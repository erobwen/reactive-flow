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
  
  getDomNode(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    if (!you.buildElementRepeater) {
      you.buildElementRepeater = repeat(mostAbstractFlow(you).toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString());

        me.getEmptyDomNode(you);
        me.buildDomNode(you);  
      });
    }
    return you.domNode;
  }
  
  buildDomNode(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    const node = you.domNode;
    you.buildDomNode(node);
    
    if (you.children) {
      clearNode(node);
      for (let child of you.children) {
        if (child !== null) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive !== null) {
            node.appendChild(me.getDomNode(childPrimitive));
          }
        }
      }
    }
  }

  getEmptyDomNode(primitiveFlow) {
    const me = this; 
    const you = primitiveFlow;
    if (!you.createElementRepeater) {
      you.createElementRepeater = repeat(mostAbstractFlow(you).toString() + ".createElementRepeater", (repeater) => {
        log(repeater.causalityString());

        // Create empty dom node
        you.domNode = you.createEmptyDomNode();
        you.domNode.id = aggregateToString(you);
        // you.domNode.id = mostAbstractFlow(you).toString()
        
        // Decorate all equivalent flows
        let scanFlow = mostAbstractFlow(you).equivalentParent;
        while (scanFlow != null) {
          scanFlow.domNode = you.domNode;
          scanFlow = scanFlow.equivalentParent;
        }
      });
    }
    return you.domNode;
  }
}