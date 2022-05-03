import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";

const log = console.log;


export function mostAbstractFlow(flow) {
  while (flow.equivalentParent) flow = flow.equivalentParent;
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
    scan = scan.equivalentParent;
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
  
  getDomNode(domTarget) {
    const me = domTarget; 
    const you = this;
    if (!you.buildElementRepeater) {
      // you.buildElementRepeater = repeat(mostAbstractFlow(you).toString() + ".buildElementRepeater", (repeater) => {
      you.buildElementRepeater = repeat(you.toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString());

        you.getEmptyDomNode(me);
        you.buildDomNodeWithChildren(me);  
      });
    }
    return you.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  buildDomNodeWithChildren(domTarget) {
    const me = domTarget; 
    const you = this;
    const node = you.domNode;
    you.buildDomNode(node);
    
    clearNode(node);
    if (you.children instanceof Array) {
      for (let child of you.children) {
        if (child) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive) {
            node.appendChild(childPrimitive.getDomNode(me));
          }
        }
      }
    } else if (you.children instanceof Flow) {
      const childPrimitive = you.children.getPrimitive();
      if (childPrimitive) {
        node.appendChild(childPrimitive.getDomNode(me));
      }
    }  
  }

  getEmptyDomNode(domTarget) {
    const me = domTarget; 
    const you = this;
    if (!you.createElementRepeater) {
      you.createElementRepeater = repeat(mostAbstractFlow(you).toString() + ".createElementRepeater", (repeater) => {
        // log(repeater.causalityString());

        // Create empty dom node
        you.domNode = you.createEmptyDomNode();
        you.domNode.id = aggregateToString(you);
        // you.domNode.id = mostAbstractFlow(you).toString()
        
        // Decorate all equivalent flows
        let scanFlow = you.equivalentParent;
        while (scanFlow != null) {
          scanFlow.domNode = you.domNode;
          scanFlow = scanFlow.equivalentParent;
        }
      });
    }
    return you.domNode;
  }

  buildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}



