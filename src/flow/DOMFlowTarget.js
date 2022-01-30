import { observable, world, Text, Row } from "./Flow";
const log = console.log;


export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }

  integrate(flow, primitiveFlow) {
    const flowElement = this.getElement(primitiveFlow);
    flow.domElement = flowElement;
  
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
        domParentElement.replaceChild(flowElement, domParentElement.childNodes[flow.domPosition])
      } else {
        if (flow.previousFlow && !flow.previousFlow.isIntegrated) {
          return; // Wait until sibling is finished first.
        }
        domParentElement.appendChild(flowElement);
        flow.isIntegrated = true; 
      }  
    }
  }

  getElement(primitiveFlow) {
    if (primitiveFlow.domElement) return primitiveFlow.domElement; 

    if (primitiveFlow instanceof Text) {
      return document.createTextNode(primitiveFlow.text);
    } else if (primitiveFlow instanceof Row) {
      return document.createElement("div");
    }
  }
}