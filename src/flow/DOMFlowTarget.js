import { observable, world, repeat, readFlowProperties, Flow } from "./Flow";
import { DOMButton, ElementNode, TextNode } from "./DOMFlowTargetPrimitive";
import { FlowTarget } from "./FlowTarget";

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

        me.getEmptyDomNode(you);
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

  getEmptyDomNode(domFlow) {
    const me = this; 
    const you = domFlow;
    if (!you.createElementRepeater) {
      you.createElementRepeater = repeat(mostAbstractFlow(you).toString() + ".createElementRepeater", (repeater) => {
        log(repeater.causalityString());

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

  elementNode() {
    return new ElementNode(readFlowProperties(arguments));
  }

  textNode() {
    return new TextNode(readFlowProperties(arguments));
  }
}

