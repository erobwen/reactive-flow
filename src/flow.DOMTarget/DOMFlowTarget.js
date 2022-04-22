import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMFlowTargetPrimitive";
import { FlowTarget } from "../flow/FlowTarget";

const log = console.log;

function mostAbstractFlow(flow) {
  while (flow.equivalentParent) flow = flow.equivalentParent;
  return flow; 
}

function aggregateToString(flow) {
  let id = [];
  let scan = flow;
  while (scan) {
    if (!(scan instanceof FlowTargetPrimitive)) {
      // Dont display flow target primitive.       
      id.unshift(scan.toString());
    }
    scan = scan.equivalentParent;
  }
  return id.join(" | ");
}

function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement){
    super();
    this.rootElement = rootElement;
  }
  
  integrate(flow) {
    const me = this; 
    const you = flow;
    if (!you.integrationRepeater) {
      you.integrationRepeater = repeat(mostAbstractFlow(you).toString() + ".integrationRepeater", repeater => {
        log(repeater.causalityString());
        const primitive = you.getPrimitive(); 
        let domNode;
        if (primitive !== null) {
          domNode = primitive.getDomNode(me);
        }
        clearNode(me.rootElement);
        if (domNode) {
          me.rootElement.appendChild(domNode);
        }
      });
    }
  }

  elementNode() {
    return new DOMElementNode(readFlowProperties(arguments));
  }

  textNode() {
    return new DOMTextNode(readFlowProperties(arguments));
  }

  modalNode() {
    return new DOMModalNode(readFlowProperties(arguments));
  }
}

