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
      you.integrationRepeater = repeat(you.description() + ".integrationRepeater", repeater => {
        if (!repeater.firstTime) log(repeater.causalityString());

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
      primitiveFlow.createElementRepeater = repeat(flow.description() + ".createElementRepeater", (repeater) => {
        // if (!repeater.firstTime) log(repeater.causalityString()); 
        // log("create repeater? ")
        primitiveFlow.domElement = me.createDomElement(flow, primitiveFlow);
        flow.domElement = primitiveFlow.domElement;
      });
    }

    // Build element
    if (!primitiveFlow.buildElementRepeater) {
      primitiveFlow.buildElementRepeater = repeat(flow.description() + ".buildElementRepeater", (repeater) => {
        // if (!repeater.firstTime) log(repeater.causalityString()); 
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
    element.id = flow.buildUniqueName();
    element.className = flow.className()  + ":" + primitiveFlow.buildUniqueName();
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
      element.nodeValue = you.text;
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