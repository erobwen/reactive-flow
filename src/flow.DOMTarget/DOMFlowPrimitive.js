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


  dimensions() {
    //TODO: Research a way to isolate the reflow used in dimensions to a wecomponent?
    console.warn("Calls to dimensions() could lead to performance issues as it forces a reflow to measure the size of a dom-node. Note that transition animations may use dimensions() for measuring the size of added nodes"); 
    const domNode = this.getDomNode(true).cloneNode(true);
    domNode.style.position = "absolute"; 
    domNode.style.top = "0";
    domNode.style.left = "0";
    domNode.style.width = "auto";
    domNode.style.height = "auto";
    Object.assign(domNode.style, flexAutoStyle);
    document.body.appendChild(domNode);
    // console.log(domNode.clientHeight);
    // console.log(domNode.offsetHeight);
    // console.log(domNode.offsetWidth);
    // console.log(domNode.scrollHeight);
    const result = {width: domNode.offsetWidth, height: domNode.offsetHeight }; 
    document.body.removeChild(domNode);
    //this.domNode = null; this.domNode = domNode; // Trigger change for parent 
    return result; 
    return null;
  }
  
  getDomNode() {
    if (!this.buildElementRepeater) {
      // this.buildElementRepeater = repeat(mostAbstractFlow(this).toString() + ".buildElementRepeater", (repeater) => {
      this.buildElementRepeater = repeat(this.toString() + ".buildElementRepeater", (repeater) => {
        if (trace) console.group(repeater.causalityString());
        
        this.ensureDomNodeCreated();
        this.reBuildDomNodeWithChildren();
        if (trace) console.groupEnd();  
      }, {priority: 2});
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  // reBuildDomNodeWithChildren2() {
  //   const changes = this.unobservable;
  //   const newChildren = this.getPrimitiveChildren();
  //   const newChildNodes = newChildren.map(child => child.getDomNode())
  //   for (let flow of changes.previousChildPrimitives) {

  //   }
  //   if (changes.removed) { // This will only add back animated removed
  //     for (let flow of Object.values(changes.removed)) {
  //       newChildNodes.splice(Math.max(changes.previousChildPrimitives.indexOf(flow), newChildNodes.length), 0, flow.domNode)
  //     }
  //   }
  //   if (changes.outgoing) {
  //     for (let flow of Object.values(changes.outgoing)) {
  //       // Use initial bounds
  //       newChildNodes.splice(Math.max(changes.previousChildPrimitives.indexOf(flow), newChildNodes.length), 0, null); // dissapearing expander
  //     }
  //   }
  //   if (changes.incoming) {
  //     for (let flow of Object.values(changes.outgoing)) {
  //       // Use initial bounds 
  //       newChildNodes.splice(newChildNodes.indexOf(flow), 0, null); // dissapearing contractor
  //     }
  //   }

  //   // Remove from node.childNodes those not in end result

  //   // Add and rearrange node.childNodes to match newChildNodes.
  // }
    
  reBuildDomNodeWithChildren() {
    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    this.reBuildDomNode(node);
    if (!(node instanceof Element)) return;
    const newChildNodes = this.getChildNodes(node);
    const changes = this.unobservable;
    console.group("reBuildDomNodeWithChildren " + this.toString())
    log({...changes})
    
    // Remove non-animated children
    let index = node.childNodes.length - 1;
    while(0 <= index) {
      const existingChildNode = node.childNodes[index];
      const existingChild = existingChildNode.equivalentCreator;
      if (existingChild && !newChildNodes.includes(existingChildNode) && !existingChild.getAnimation()) {
        node.removeChild(existingChildNode);
      }
      index--;
    }

    // Add back animated to newChildNodes for placement at existing index while being removed.
    // Outgoing should be replaced with a dissapearing expander.
    index = 0;
    while(index < node.childNodes.length) {
      const existingChildNode = node.childNodes[index];
      const existingChild = existingChildNode.equivalentCreator;
      log(existingChildNode)
      if (!newChildNodes.includes(existingChildNode)) {
        if (!existingChild) {
          // Add back all dissapearing expanders and contractors from previous animations (just let them finish their jurney) 
          log("adding back dissapearing expander... ? ")
          newChildNodes.splice(index, 0, existingChildNode);
          // Will this interrupt animation?
        } else {
          log("adding back replacement for " + existingChild.toString());
          // Add back removed or outgoing elements.       
          // newChildNodes.splice(index, 0, existingChild.getAnimation().getDissapearingExpander(existingChildNode));
          if (changes.outgoing[existingChild.id]) {
            // Add back expander
            newChildNodes.splice(index, 0, existingChild.getAnimation().getDissapearingExpander(existingChildNode));
          } else if (changes.removed[existingChild.id]) {
            // Add back node itself
            newChildNodes.splice(index, 0, existingChildNode);
          } else {
            console.log(changes);
            throw new Error("Should not happen, existing dom-element not a dissapearing expander/contracter nor a flow domNode");
          }
        }
      }
      index++;
    }

    // Add contractors for incoming
    // log(changes);
    index = newChildNodes.length - 1;
    while(0 <= index) {
      const childNode = newChildNodes[index];
      const child = childNode.equivalentCreator;
      if (child && changes.incoming[child.id]) {
        log("Adding negative margins to incoming to cancel out its size");
        // newChildNodes.splice(index, 0, child.getAnimation().getDisappearingContractor(childNode));
        child.getAnimation().contractIncoming(childNode);
      }
      index--;
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

  getChildNodes() {
    return this.getPrimitiveChildren().map(child => child.getDomNode())
  }

  ensureDomNodeCreated() { 
    if (!this.createElementRepeater) {
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

  reBuildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}



