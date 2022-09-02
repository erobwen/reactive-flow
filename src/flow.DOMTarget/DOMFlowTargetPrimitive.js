import { flexAutoStyle } from "../flow.components/BasicFlowComponents";
import { repeat, Flow, trace, configuration, readFlowProperties } from "../flow/Flow";
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
 export class DOMFlowTargetPrimitive extends FlowPrimitive {


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

  reBuildDomNodeWithChildren() {
    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    this.reBuildDomNode(node);
    if (!(node instanceof Element)) return;
    const newChildNodes = this.getChildNodes(node);
    
    // Remove non-animated children
    let index = node.childNodes.length - 1;
    while(0 <= index) {
      const existingChild = node.childNodes[index];
      if (!newChildNodes.includes(existingChild) && !existingChild.equivalentCreator.getAnimation()) {
        node.removeChild(existingChild);
      }
      index--;
    }

    // Add back animated to newChildNodes for placement at existing index
    index = 0;
    while(index < node.childNodes.length) {
      const existingChild = node.childNodes[index];
      if (!newChildNodes.includes(existingChild) && existingChild.equivalentCreator.getAnimation()) {
        newChildNodes.splice(index, 0, existingChild);
      }
      index++;
    }
    
    // Adding pass, will also rearrange moved elements
    index = 0;
    while(index < newChildNodes.length) {
      const existingChild = node.childNodes[index];
      if (newChildNodes[index] !== existingChild) {
        node.insertBefore(newChildNodes[index], existingChild);
      }
      index++;
    }
  }

  getChildNodes() {
    return this.getChildren().reduce(
      (result, child) => 
        {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive) {
            result.push(childPrimitive.getDomNode());
          }
          return result;
        }, []);
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



