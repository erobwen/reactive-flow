import { observable, world, Text, Row } from "./Flow";
const log = console.log;


export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }

  integrate(flow, primitiveFlow) {
    // log("integrate ======================== " + flow.uniqueName())
    // log(flow);
    // log(primitiveFlow)
    const flowElement = this.getElement(primitiveFlow);
    flow.domElement = flowElement;
  
    // Assume this flow is to be placed in the root. 
    if (!flow.domParentElement) {
      flow.domParentElement = this.rootElement;
      flow.domPosition = 0;
      flow.domTotalPositions = 1;
    }
  
    // Place under parent
    const domParentElement = flow.domParentElement;
    // log(flow.domParentElement)
    // log(flow.domTotalPositions)
    // log(domParentElement.childNodes.length)
    if (domParentElement.childNodes.length === flow.domTotalPositions) {
      // log("re-integrating")
      domParentElement.replaceChild(flowElement, domParentElement.childNodes[flow.domPosition])
    } else {
      if (flow.previousFlow && !flow.previousFlow.isIntegrated) {
        // log("sibling not finished!")
        return; // Wait until sibling is finished first.
      }
      // log("integrating")
      domParentElement.appendChild(flowElement);
    }
  
    // Position and integrate children
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
    // log("===")

    flow.isIntegrated = true; 
  }

  getElement(primitiveFlow) {
    if (primitiveFlow.domElement) return primitiveFlow.domElement; 

    if (primitiveFlow instanceof Text) {
      let result = document.createTextNode(primitiveFlow.text);
      return result; 
    } else if (primitiveFlow instanceof Row) {
      return document.createElement("div");
    }
  }
}