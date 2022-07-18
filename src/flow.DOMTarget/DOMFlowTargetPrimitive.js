import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";

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
 export class DOMFlowTargetPrimitive extends FlowTargetPrimitive {

  dimensions() {
    // const domNode = this.getDomNode(true);
    // document.body.appendChild(domNode);
    // // console.log(domNode.clientHeight);
    // // console.log(domNode.offsetHeight);
    // // console.log(domNode.offsetWidth);
    // // console.log(domNode.scrollHeight);
    // const result = {width: domNode.offsetWidth, height: domNode.offsetHeight }; 
    // document.body.removeChild(domNode);
    // //this.domNode = null; this.domNode = domNode; // Trigger change for parent 
    // return result; 
    return null;
  }
  
  getDomNode() {
    if (!this.buildElementRepeater) {
      // this.buildElementRepeater = repeat(mostAbstractFlow(this).toString() + ".buildElementRepeater", (repeater) => {
      this.buildElementRepeater = repeat(this.toString() + ".buildElementRepeater", (repeater) => {
        console.group(repeater.causalityString());
        
        this.getEmptyDomNode();
        this.buildDomNodeWithChildren();
        console.log(this.domNode);
        console.groupEnd();  
      });
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  buildDomNodeWithChildren() {
    const node = this.domNode;
    this.buildDomNode(node);
    
    clearNode(node);
    if (this.children instanceof Array) {
      for (let child of this.children) {
        if (child) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive) {
            node.appendChild(childPrimitive.getDomNode());
          }
        }
      }
    } else if (this.children instanceof Flow) {
      const childPrimitive = this.children.getPrimitive();
      if (childPrimitive) {
        node.appendChild(childPrimitive.getDomNode());
      }
    }  
  }

  getEmptyDomNode() { 
    if (!this.createElementRepeater) {
      this.createElementRepeater = repeat(mostAbstractFlow(this).toString() + ".createElementRepeater", (repeater) => {
        // log(repeater.causalityString());

        // Create empty dom node
        this.domNode = this.createEmptyDomNode();
        this.domNode.id = aggregateToString(this);
        // this.domNode.id = mostAbstractFlow(this).toString()
        
        // Decorate all equivalent flows
        let scanFlow = this.equivalentCreator;
        while (scanFlow != null) {
          scanFlow.domNode = this.domNode;
          scanFlow = scanFlow.equivalentCreator;
        }
      });
    }
    return this.domNode;
  }

  buildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}



