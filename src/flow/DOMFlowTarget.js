import { observable, world, repeat } from "./Flow";
import { Text, Row, Button, PrimitiveFlow } from "./PrimitiveFlow";
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
    id.unshift(scan.toString());
    scan = scan.equivalentParent;
  }
  return id.join(" | ");
}


export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }
  
  integrate(flow) {
    const me = this; 
    const you = flow;
    if (!you.integrationRepeater) {
      you.integrationRepeater = repeat(mostAbstractFlow(you).toString() + ".integrationRepeater", repeater => {
        log(repeater.causalityString());
        const element = me.getElement(you.getPrimitive());
        clearNode(me.rootElement);
        me.rootElement.appendChild(element);
      });
    }
  }
  
  getElement(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    if (!you.buildElementRepeater) {
      you.buildElementRepeater = repeat(mostAbstractFlow(you).toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString());

        me.getEmptyDomElement(you);
        me.buildDomElement(you);  
      });
    }
    return you.domElement;
  }
  
  buildDomElement(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    const element = you.domElement;
    you.buildDomElement(element);
    
    if (you.children) {
      clearNode(element);
      for (let child of you.children) {
        element.appendChild(me.getElement(child.getPrimitive()));
      }
    }
  }

  getEmptyDomElement(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    if (!you.createElementRepeater) {
      you.createElementRepeater = repeat(mostAbstractFlow(you).toString() + ".createElementRepeater", (repeater) => {
        log(repeater.causalityString());

        // Create empty dom element
        you.domElement = you.createEmptyDomElement();
        you.domElement.id = aggregateToString(you);
        // you.domElement.id = mostAbstractFlow(you).toString()
        
        // Decorate all equivalent flows
        let scanFlow = mostAbstractFlow(you).equivalentParent;
        while (scanFlow != null) {
          scanFlow.domElement = you.domElement;
          scanFlow = scanFlow.equivalentParent;
        }
      });
    }
    return you.domElement;
  }
}