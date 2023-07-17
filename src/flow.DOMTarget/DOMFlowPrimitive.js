import { flexAutoStyle } from "../flow.components/Layout";
import { repeat, Flow, trace, configuration, readFlowProperties, finalize } from "../flow/Flow";
import { FlowPrimitive } from "../flow/FlowPrimitive";
import { flowChanges, getHeightIncludingMargin, getWidthIncludingMargin, logProperties, previousFlowChanges, typicalAnimatedProperties } from "./DOMAnimation";

const log = console.log;

export function mostAbstractFlow(flow) {
  while (flow.equivalentCreator) flow = flow.equivalentCreator;
  return flow; 
}

export function aggregateToString(flow) {
  let id = [];
  let scan = flow;
  while (scan) {
    // if (!(scan instanceof FlowTargetPrimitive)) {
      // Dont display flow target primitive.       
      id.unshift(scan.toString());
    // }
    scan = scan.equivalentCreator;
  }
  return id.join(" | ");
}

export const movedPrimitives = [];
window.moved = movedPrimitives;

export function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}


export const getWrapper = (node) => !node ? node : (node.wrapper && node.wrapper.wrapped === node ? node.wrapper : node);  
export const getWrappedNode = (node) => !node ? node : (node.wrapped && node.wrapped.wrapper === node ? node.wrapped : node);  


/**
 * DOM Flow Base class
 */
// TODO: Change Name to DOMNode
 export class DOMFlowPrimitive extends FlowPrimitive {

  dimensions(contextNode) {
    //TODO: Research a way to isolate the reflow used in dimensions to a wecomponent?
    console.warn("Calls to dimensions() could lead to performance issues as it forces a reflow to measure the size of a dom-node. Note that transition animations may use dimensions() for measuring the size of added nodes"); 
    let domNode = this.ensureDomNodeBuilt(true);
    // domNode = getWrapper(domNode); 
    let alreadyInContext;
    if (contextNode) { 
      alreadyInContext = domNode.parentNode === contextNode;
      // alreadyInContext = true; 
      if (!alreadyInContext) {
        // log("CLONE!!!");
        domNode = domNode.cloneNode(true);
        contextNode.appendChild(domNode);
        // domNode.style.position = ""; 
      }
    } else {
      domNode = domNode.cloneNode(true);
      domNode.style.position = "absolute"; 
      domNode.style.top = "0";
      domNode.style.left = "0";
      domNode.style.width = "auto";
      domNode.style.height = "auto";
      Object.assign(domNode.style, flexAutoStyle);
      document.body.appendChild(domNode);  
    }
  
    // domNode.offsetWidth 
    const result = {
      width: getWidthIncludingMargin(domNode), 
      height: getHeightIncludingMargin(domNode),

      widthIncludingMargin: getWidthIncludingMargin(domNode), 
      heightIncludingMargin: getHeightIncludingMargin(domNode),
      
      widthWithoutMargin: domNode.offsetWidth,
      heightWithoutMargin: domNode.offsetHeight
    }; 
    const original = this.ensureDomNodeBuilt(true)
    // log("dimensions " + this.toString() + " : " +  result.width + " x " +  result.height);
    // log(original);
    // debugger;
    // log("dimensions clone")
    // log(domNode);
    // log(domNode.offsetWidth);
    // log(domNode.parentNode);
    // log(domNode.parentNode.offsetWidth);

    if (contextNode) {
      if (!alreadyInContext) {
        contextNode.removeChild(domNode);
      }
    } else {
      document.body.removeChild(domNode);
    }
    return result; 
  }

  getDomNode() {
    this.ensureDomNodeBuilt();
    return this.domNode; 
  }
  
  ensureDomNodeBuilt() {
    finalize(this);
    if (!this.buildDOMRepeater) {
      // this.buildDOMRepeater = repeat(mostAbstractFlow(this).toString() + ".buildDOMRepeater", (repeater) => {
      this.buildDOMRepeater = repeat("[" + aggregateToString(this) + "].buildDOMRepeater", (repeater) => {
        if (trace) console.group(repeater.causalityString());
        
        this.ensureDomNode();
        this.ensureDomNodeAttributesSet();
        this.ensureDomNodeChildrenInPlace();
        if (trace) console.groupEnd();  
      }, {priority: 2});
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  ensureDomNodeChildrenInPlace() {// But do not change style for animated children!
    // log("ensureDomNodeChildrenInPlace " + this.toString());
    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    if (!(node instanceof Element)) return;
    
    // Get new children list, this is the target
    const newChildren = this.getPrimitiveChildren(node);
    const newChildNodes = newChildren.map(child => child.ensureDomNodeBuilt()).filter(child => !!child);
    
    // Iterate and remove things that should be removed or outgoing
    const existingPrimitives = {};
    
    const recoveredNodes = [];
    // log([...node.childNodes])
    for(let existingChildNode of node.childNodes) {
      // log("---")
      // log(existingChildNode);
      const existingPrimitive = getWrappedNode(existingChildNode).equivalentCreator;
      // log(existingPrimitive);
      if (!existingPrimitive) {
        // No creator, probably a fading trailer that we want to keep
        // TODO: Mark trailers somehow! 
        recoveredNodes.push(existingChildNode);
      } else {
        // A creator, meaning a flow primitive
        existingPrimitives[existingPrimitive.id] = existingPrimitive; 
        const animation = existingPrimitive.getAnimation(); 

        // Keep node in new children
        if (newChildNodes.includes(existingChildNode)) {
          recoveredNodes.push(existingChildNode);
        } 

        // If node is removed and animated, copy it back to leave it to wait for animation.
        if (animation) {
          if (flowChanges.beingRemovedMap[existingPrimitive.id]) {
            recoveredNodes.push(existingChildNode);
          }
        }
      }
    }

    // log(recoveredNodes);

    // Link recovered nodes:
    let anchor = null; 
    recoveredNodes.forEach(node => {node.anchor = anchor; anchor = node; });

    function insertAfter(array, reference, element) {
      array.splice(array.indexOf(reference) + 1, 0, element);
    }

    // Merge old with new
    recoveredNodes.forEach(node => {
      if (!newChildNodes.includes(node)) {
        let anchor = node.anchor;
        while (!newChildNodes.includes(anchor) && anchor) anchor = anchor.anchor; // Maybe not necessary. 
        if (!anchor) {
          newChildNodes.unshift(node);
        } else {
          insertAfter(newChildNodes, anchor, node);
        }
      }
    })

    // Removing pass, will also rearrange moved elements
    let index =  node.childNodes.length - 1;
    while(index >= 0) {
      const existingChildNode = getWrappedNode(node.childNodes[index]);
      if ((existingChildNode instanceof Element) && !newChildNodes.includes(existingChildNode)) {
        node.removeChild(getWrapper(existingChildNode));
      }
      index--;
    }

    // Adding pass, will also rearrange moved elements
    index = 0;
    while(index < newChildNodes.length) {
      const existingChildNode = getWrappedNode(node.childNodes[index]);
      if (newChildNodes[index] !== existingChildNode) {
        node.insertBefore(getWrapper(newChildNodes[index]), getWrapper(existingChildNode));
      }
      index++;
    }

    // Ensure wrappers in use. 
    for (let childNode of node.childNodes) {
      if (childNode.id !== "wrapper" && childNode.wrapper) {
        node.replaceChild(childNode.wrapper, childNode);
      }
    }

    // Ensure wrappers non empty. 
    for (let childNode of node.childNodes) {
      if (childNode.id === "wrapper" && !childNode.isOldWrapper && childNode.wrapped.parentNode !== childNode) {
        // debugger; 
        childNode.appendChild(childNode.wrapped);
      }
    }
  }

  getChildNodes() {
    return this.getPrimitiveChildren().map(child => child.ensureDomNodeBuilt())
  }

  ensureDomNode() { 
    if (this.givenDomNode) {
      this.domNode = this.givenDomNode;
      this.domNode.id = aggregateToString(this);
      this.domNode.equivalentCreator = this; 
    } else if (!this.createElementRepeater) {
      this.createElementRepeater = repeat(mostAbstractFlow(this).toString() + ".createElementRepeater", (repeater) => {
        if (trace) log(repeater.causalityString());

        // Create empty dom node
        this.domNode = this.createEmptyDomNode();
        this.domNode.id = aggregateToString(this);
        this.domNode.equivalentCreator = this; 
        // this.domNode.id = mostAbstractFlow(this).toString()
        
        // Decorate all equivalent flows
        let scanFlow = this.equivalentCreator;
        while (scanFlow != null) {
          scanFlow.domNode = this.domNode;
          scanFlow = scanFlow.equivalentCreator;
        }

        if (trace) log(this.domNode);
      }, {priority: 2});
    }
    return this.domNode;
  }

  ensureDomNodeAttributesSet() {
    // Ensure dom node attributes set. This method assumes that no one else has messed with the dom node. 
    throw new Error("Not implemented yet!");
  }

  synchronizeDomNodeStyle(properties) {
    // Enforce writing of all dom node style to the dom. This is used when the dom node is out of sync with the flow, for example after a halted animation.  
    throw new Error("Not implemented yet!");
  }
}



