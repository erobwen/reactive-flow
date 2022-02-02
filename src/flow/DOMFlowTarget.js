import { observable, world, Text, repeat, Row, Button } from "./Flow";
const log = console.log;


export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }

  integrate(flow, primitiveFlow) {
    const flowElement = this.getElement(flow, primitiveFlow);
    flow.domElement = flowElement;
    primitiveFlow.domElement = flowElement;
  
    // Setup root
    if (!flow.parent) {
      flow.domParentElement = this.rootElement;
      flow.domPosition = 0;
      flow.domTotalPositions = 1;
    }
  
    // Integrate children
    if (primitiveFlow.children) {
      let position = 0;
      let previousFlow = null;
      const childrenCount = primitiveFlow.children.length;
      
      while (flowElement.childNodes.length > childrenCount) {
        // log(flowElement.childNodes.length);
        flowElement.removeChild(flowElement.lastElementChild);
      }

      for (let child of primitiveFlow.children) {
        child.domParentElement = flowElement;
        child.domPosition = position++;
        child.domTotalPositions = childrenCount;
        child.previousFlow = null;
        
        child.previousFlow = previousFlow;
        previousFlow = child;

        child.integratePrimitive();
      }
    }

    // Place under parent node (if you have one yet)
    if (flow.domParentElement) {
      const domParentElement = flow.domParentElement;
      if (domParentElement.childNodes.length === flow.domTotalPositions) {
        const nodeToReplace = domParentElement.childNodes[flow.domPosition]; 
        if (nodeToReplace !== flowElement) {
          // log("replace" + flow.description())
          domParentElement.replaceChild(flowElement, nodeToReplace)
        }
      } else {
        if (flow.previousFlow && !flow.previousFlow.isIntegrated) {
          return; // Wait until sibling is finished first.
        }
        // log("fresh" + flow.description())
        domParentElement.appendChild(flowElement);
        flow.isIntegrated = true; 
      }  
    }
  }

  getElement(flow, primitiveFlow) {
    const me = this; 

    // Create element
    if (!primitiveFlow.createElementRepeater) {
      primitiveFlow.createElementRepeater = repeat(flow.description() + ".createElementRepeater", (repeater) => {
        if (!repeater.firstTime) log(repeater.causalityString()); 
        primitiveFlow.domElement = me.createDomElement(flow, primitiveFlow);  
      });
    }

    // Build element
    if (!primitiveFlow.buildElementRepeater) {
      primitiveFlow.buildElementRepeater = repeat(flow.description() + ".buildElementRepeater", (repeater) => {
        if (!repeater.firstTime) log(repeater.causalityString()); 
        me.buildDomElement(flow, primitiveFlow, primitiveFlow.domElement);  
      });
    }
    return primitiveFlow.domElement;
  }

  createDomElement(flow, primitiveFlow) {
    const you = primitiveFlow;
    let element;
    if (you instanceof Button) {
      element = document.createElement("button");
    } if (you instanceof Text) {
      element = document.createTextNode(you.text);
    } else if (you instanceof Row) {
      element = document.createElement("div");
    }
    element.id = flow.buildUniqueName();
    element.className = flow.className();
    return element; 
  }

  buildDomElement(flow, primitiveFlow, element) {
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
  }
}