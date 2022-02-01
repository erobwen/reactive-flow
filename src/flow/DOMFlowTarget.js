import { observable, world, Text, repeat, Row } from "./Flow";
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
      for (let child of primitiveFlow.children) {
        child.domParentElement = flowElement;
        child.domPosition = position++;
        child.domTotalPositions = primitiveFlow.children.length;
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
          domParentElement.replaceChild(flowElement, nodeToReplace)
        }
      } else {
        if (flow.previousFlow && !flow.previousFlow.isIntegrated) {
          return; // Wait until sibling is finished first.
        }
        domParentElement.appendChild(flowElement);
        flow.isIntegrated = true; 
      }  
    }
  }

  getElement(flow, primitiveFlow) {
    // log(primitiveFlow);
    const me = this; 
    // if (primitiveFlow === null) debugger;
    if (!primitiveFlow.elementRepeater) {
      primitiveFlow.elementRepeater = repeat("elementRepeater", () => {
        primitiveFlow.domElement = me.createElement(flow, primitiveFlow);  
      });
    }
    return primitiveFlow.domElement;
  }

  createElement(flow, primitiveFlow) {
    if (primitiveFlow instanceof Text) {
      return document.createTextNode(primitiveFlow.text);
    } else if (primitiveFlow instanceof Row) {
      let element = document.createElement("div");
      element.id = flow.uniqueName();
      element.className = flow.className();
      return element; 
    }
  }
}