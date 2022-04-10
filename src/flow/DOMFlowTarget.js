import { observable, world, repeat, readFlowArguments, Flow } from "./Flow";
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

export class FlowTarget {
  integrate(flow) {
    throw new Error("Not implemented yet!");
  }

  primitiveHtmlElement() {
    throw new Error("Not implemented yet!");
  }

  button() {
    throw new Error("Not implemented yet!");
  }
}


export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement){
    super();
    this.rootElement = rootElement;
  }
  
  button() {
    const properties = readFlowArguments(arguments);
    return new DOMButton(properties);
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
        let scanFlow = you.equivalentParent;
        while (scanFlow != null) {
          scanFlow.domNode = you.domNode;
          scanFlow = scanFlow.equivalentParent;
        }
      });
    }
    return you.domNode;
  }
}


/**
 * DOM primitive flows
 */
export class DOMButton extends PrimitiveFlow {
  setProperties({onClick, text}) {
    // log("button set properties");
    this.onClick = () => {
      console.log("clicked at: " + JSON.stringify(this.getPath()))
      onClick();
    }
    this.text = text; 
  }

  createEmptyDomNode() {
    return document.createElement("button");
  }

  buildDomNode(element) {
    element.onclick = this.onClick;
    if (element.childNodes.length === 0) element.appendChild(document.createTextNode(''));
    element.lastChild.nodeValue = this.text;
  }
}
