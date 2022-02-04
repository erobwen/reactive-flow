import { observable, world, Text, repeat, Row, Button } from "./Flow";
const log = console.log;

function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}

export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }
  
  integrate(flow, primitiveFlow) {
    const you = flow;
    if (!you.integrationRepeater) {
      you.integrationRepeater = repeat(you.toString() + ".integrationRepeater", repeater => {
        log(repeater.causalityString());

        const element = this.getElement(flow, primitiveFlow);
        clearNode(this.rootElement);
        this.rootElement.appendChild(element);
      });
    }
  }

  getElement(flow, primitiveFlow) {
    // log("getElmenet")
    const me = this; 

    // Create element
    if (!primitiveFlow.createElementRepeater) {
      primitiveFlow.createElementRepeater = repeat(flow.toString() + ".createElementRepeater", (repeater) => {
        log(repeater.causalityString());
        primitiveFlow.domElement = me.createDomElement(flow, primitiveFlow);
        flow.domElement = primitiveFlow.domElement;
      });
    }

    // Build element
    if (!primitiveFlow.buildElementRepeater) {
      primitiveFlow.buildElementRepeater = repeat(flow.toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString()); 
        me.buildDomElement(flow, primitiveFlow, primitiveFlow.domElement);  
      });
    }
    return primitiveFlow.domElement;
  }

  createDomElement(flow, primitiveFlow) {
    // log("createDomElement")
    const you = primitiveFlow;
    let element;
    if (you instanceof Button) {
      element = document.createElement("button");
    } if (you instanceof Text) {
      element = document.createTextNode("");
    } else if (you instanceof Row) {
      element = document.createElement("div");
    }
    element.id = flow.toString()
    // element.className = 
    return element; 
  }
  
  buildDomElement(flow, primitiveFlow, element) {
    // log("buildDomElement")
    const me = this; 
    const you = primitiveFlow;
    if (you instanceof Button) {
      element.onclick = you.onClick;
      if (element.childNodes.length === 0) element.appendChild(document.createTextNode(''));
      element.lastChild.nodeValue = you.text;
    } if (you instanceof Text) {
      element.nodeValue = you.text; // toString();
    } else if (you instanceof Row) {
      // Nothing
    }

    if (primitiveFlow.children) {
      clearNode(element);
      for (let child of primitiveFlow.children) {
        element.appendChild(me.getElement(child, child.getPrimitive()));
      }
    }
  }
}