import { flexAutoStyle } from "../flow.components/Layout";
import { repeat, Flow, trace, configuration, readFlowProperties, finalize } from "../flow/Flow";
import { FlowPrimitive } from "../flow/FlowPrimitive";
import { flowChanges, previousFlowChanges } from "./DOMAnimation";

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

/**
 * DOM Flow Base class
 */
 export class DOMFlowPrimitive extends FlowPrimitive {

  dimensions(contextNode) {
    //TODO: Research a way to isolate the reflow used in dimensions to a wecomponent?
    console.warn("Calls to dimensions() could lead to performance issues as it forces a reflow to measure the size of a dom-node. Note that transition animations may use dimensions() for measuring the size of added nodes"); 
    const domNode = this.ensureDomNodeBuilt(true).cloneNode(true);
    if (contextNode) {
      contextNode.appendChild(domNode);
    } else {
      domNode.style.position = "absolute"; 
      domNode.style.top = "0";
      domNode.style.left = "0";
      domNode.style.width = "auto";
      domNode.style.height = "auto";
      Object.assign(domNode.style, flexAutoStyle);
      document.body.appendChild(domNode);  
    }

    const result = {width: domNode.offsetWidth, height: domNode.offsetHeight }; 
    const original = this.ensureDomNodeBuilt(true)
    // log("dimensions " + this.toString() + " : " +  result.width + " x " +  result.height);
    // log(original);
    // debugger;
    if (contextNode) {
      contextNode.removeChild(domNode);
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

    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    if (!(node instanceof Element)) return;
    console.group("ensureDomNodeChildrenInPlace " + this.toString())
    // log(node)0
    
    // Get new children list, this is the target
    const newChildren = this.getPrimitiveChildren(node);
    const newChildNodes = newChildren.map(child => child.ensureDomNodeBuilt()).filter(child => !!child);
    
    // Iterate and remove things that should be removed or outgoing
    let index = node.childNodes.length - 1;
    const existingPrimitives = {};
    
    while(index >= 0) {
      const existingChildNode = node.childNodes[index];
      const existingPrimitive = existingChildNode.equivalentCreator;
      if (!existingPrimitive) {
        // No creator, probably a fading trailer that we want to keep
        newChildNodes.splice(index, 0, existingChildNode);
      } else {
        // A creator, meaning a flow primitive
        existingPrimitives[existingPrimitive.id] = existingPrimitive; 
        const animation = existingPrimitive.getAnimation(); 
        if (animation) {

          // If node is removed, copy it back to leave it to wait for animation.
          if (flowChanges.globallyRemovedAnimated[existingPrimitive.id]) {
            newChildNodes.splice(index, 0, existingChildNode);
          }
            
          // Test for moving out 
          if (flowChanges.globallyMovedAnimated[existingPrimitive.id]) {

            // Outgoing could already be gone at this stage?
            if (existingChildNode.fadingTrailerOnChanges !== flowChanges.number) {
              node.insertBefore(animation.getFadingTrailer(existingChildNode), existingChildNode);
              node.removeChild(existingChildNode);
            }
          }
        } else {
          // Not animated, remove instantly!
          if (flowChanges.globallyRemoved[existingPrimitive.id] || flowChanges.globallyMoved[existingPrimitive.id]) {
            node.removeChild(existingChildNode);
          }
        }
      }
      index--;
    }

    for(let newPrimitive of newChildren) {
      const animation = newPrimitive.getAnimation();
      if (animation) {

        // For all added
        if (flowChanges.globallyAddedAnimated[newPrimitive.id]) {
          // Check if it is being removed, in that case do nothign        
          if (!flowChanges.beingRemovedMap[newPrimitive.id]) {
            animation.setOriginalMinimizedStyleForAdded(newPrimitive.domNode);
          }
        }

        // For all being moved here
        if (flowChanges.globallyMovedAnimated[newPrimitive.id]) {
          // debugger; 
          log("Moved: ")
          log(newPrimitive.domNode);
          movedPrimitives.push(newPrimitive.domNode);
          newPrimitive.domNode.touchedByFoo = true;
          window.touched = newPrimitive.domNode;
          newPrimitive.domNode.style.transform = "none";
          // newPrimitive.domNode.style = {...newPrimitive.domNode.style, transform: "none"};
          // newPrimitive.domNode.transform = "none";
          // log(newPrimitive.domNode.style.transform)
          
          // Arrange trailer for incoming that leaves another container, arrange trailer. 
          const newPrimitiveDomNode = newPrimitive.domNode; 
          if (newPrimitiveDomNode.fadingTrailerOnChanges !== flowChanges.number) {
            newPrimitiveDomNode.parentNode.insertBefore(animation.getFadingTrailer(newPrimitiveDomNode), newPrimitiveDomNode);
            newPrimitiveDomNode.parentNode.removeChild(newPrimitiveDomNode);
          }

          // Minimize footprint for incoming. 
          animation.minimizeIncomingFootprint(newPrimitiveDomNode);

          // Preserve style for incoming. For example to avoid sudden changes of animated 
          // properties if moving from a parent div with different font size, so we want to 
          // fixate font size on the moving element so it can be animated. 
          // Check if not in animation?  
          if(window.allFlows[11] && window.allFlows[11].domNode) log(window.allFlows[11].domNode.style.transform);
          animation.preserveStyleForMoved(newPrimitiveDomNode);
          if(window.allFlows[11] && window.allFlows[11].domNode) log(window.allFlows[11].domNode.style.transform);
        }
      }
    }
      
    // Adding pass, will also rearrange moved elements
    index = 0;
    while(index < newChildNodes.length) {
      const existingChildNode = node.childNodes[index];
      if (newChildNodes[index] !== existingChildNode) {
        node.insertBefore(newChildNodes[index], existingChildNode);
      }
      index++;
    }

    console.groupEnd();
  }

  *iterateChildren() {
    if (this.children instanceof Array) {
      for (let child of this.children) {
        if (child instanceof Flow && child !== null) {
          yield child;
        }
      }
    } else if (this.children instanceof Flow  && this.children !== null) {
      yield this.children;
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



