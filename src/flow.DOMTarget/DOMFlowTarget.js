import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMFlowTargetPrimitive";
import { FlowTarget } from "../flow/FlowTarget";

const log = console.log;

function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}

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
          domNode = me.getDomNode(primitive);
        }
        clearNode(me.rootElement);
        if (domNode) {
          me.rootElement.appendChild(domNode);
        }
      });
    }
  }
  
  getDomNode(domFlow) {
    const me = this; 
    const you = domFlow;
    if (!you.buildElementRepeater) {
      you.buildElementRepeater = repeat(mostAbstractFlow(you).toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString());

        you.getEmptyDomNode(me);
        me.buildDomNode(you);  
      });
    }
    return you.domNode;
  }
  
  buildDomNode(domFlow) {
    const me = this; 
    const you = domFlow;
    const node = you.domNode;
    you.buildDomNode(node);
    
    if (you.children instanceof Array) {
      clearNode(node);
      for (let child of you.children) {
        if (child !== null) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive !== null) {
            node.appendChild(me.getDomNode(childPrimitive));
          }
        }
      }
    } else if (you.children instanceof Flow) {
      clearNode(node);
      const childPrimitive = you.children.getPrimitive();
      if (childPrimitive !== null) {
        node.appendChild(me.getDomNode(childPrimitive));
      }
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

