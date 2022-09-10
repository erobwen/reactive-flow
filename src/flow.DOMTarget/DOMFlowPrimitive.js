import { flexAutoStyle } from "../flow.components/BasicFlowComponents";
import { repeat, Flow, trace, configuration, readFlowProperties, finalize } from "../flow/Flow";
import { FlowPrimitive } from "../flow/FlowPrimitive";

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
    // if (this.causality.forwardTo !== null)
    // log("not properly finalized: " + ())
    finalize(this);
    if (!this.buildElementRepeater) {
      // this.buildElementRepeater = repeat(mostAbstractFlow(this).toString() + ".buildElementRepeater", (repeater) => {
      this.buildElementRepeater = repeat(this.toString() + ".buildElementRepeater", (repeater) => {
        if (trace) console.group(repeater.causalityString());
        
        this.ensureDomNode();
        if (!this.targetDomNode) this.ensureDomNodeAttributesSet();
        if (!this.isPortal) this.ensureDomNodeChildrenInPlace();
        if (trace) console.groupEnd();  
      }, {priority: 2});
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  ensureDomNodeChildrenInPlace() {
    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    if (!(node instanceof Element)) return;
    const newChildren = this.getPrimitiveChildren(node);
    const changes = this.unobservable;
    // console.group("ensureDomNodeChildrenInPlace " + this.toString())
    // log(node)
    // log({...changes});

    // Remove non-animated children
    for(let removed of Object.values(changes.removed)) {
      if (!removed.getAnimation()) {
        // log(removed.domNode)
        node.removeChild(removed.domNode);
      }
    }

    // Arrange dissapearing expander for outgoing
    for(let outgoing of Object.values(changes.outgoing)) {
      const animation = outgoing.getAnimation(); 
      if (animation) {
        // outgoing could already be gone at this stage!
        if (!outgoing.domNode.disappearingExpander) {
          node.insertBefore(animation.getDisappearingReplacement(outgoing.domNode), outgoing.domNode);
          node.removeChild(outgoing.domNode);
          animation.minimizeIncomingFootprint(outgoing.domNode);
        }
      }
    }

    // Arrange disappearing expander for incoming
    for(let incoming of Object.values(changes.incoming)) {
      const animation = incoming.getAnimation(); 
      if (animation) {
        if (!incoming.domNode.disappearingExpander) {
          incoming.domNode.parentNode.insertBefore(animation.getDisappearingReplacement(incoming.domNode), incoming.domNode);
          incoming.domNode.parentNode.removeChild(incoming.domNode);
          animation.minimizeIncomingFootprint(incoming.domNode);
        }
      }      
    }

    // Add back nodes that exist in childNodes, since there we have dissapearing expanders and removed nodes
    let index = 0;
    const newChildNodes = newChildren.map(child => child.ensureDomNodeBuilt());
    while(index < node.childNodes.length) {
      const existingChildNode = node.childNodes[index];
      if (!newChildNodes.includes(existingChildNode)) {
        newChildNodes.splice(index, 0, existingChildNode);
      }
      index++;
    }
    
    // Add contractors for incoming
    // log(changes);
    // index = newChildNodes.length - 1;
    // while(0 <= index) {
    //   const childNode = newChildNodes[index];
    //   const child = childNode.equivalentCreator;
    //   if (child && changes.incoming[child.id]) {
    //     child.getAnimation().minimizeIncomingFootprint(childNode);
    //   }
    //   index--;
    // }

    // Adding pass, will also rearrange moved elements
    index = 0;
    while(index < newChildNodes.length) {
      const existingChildNode = node.childNodes[index];
      if (newChildNodes[index] !== existingChildNode) {
        node.insertBefore(newChildNodes[index], existingChildNode);
      }
      index++;
    }

    // console.groupEnd();
  }

  getChildNodes() {
    return this.getPrimitiveChildren().map(child => child.ensureDomNodeBuilt())
  }

  ensureDomNode() { 
    if (this.targetDomNode) {
      this.domNode = this.targetDomNode;
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
    throw new Error("Not implemented yet!");
  }
}



