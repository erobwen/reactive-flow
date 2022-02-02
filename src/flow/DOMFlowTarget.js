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
          log("replace" + flow.description())
          domParentElement.replaceChild(flowElement, nodeToReplace)
        }
      } else {
        if (flow.previousFlow && !flow.previousFlow.isIntegrated) {
          return; // Wait until sibling is finished first.
        }
        log("fresh" + flow.description())
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
      primitiveFlow.elementRepeater = repeat("elementRepeater", (repeater) => {
        if (!repeater.firstTime) log(repeater.causalityString()) 

        log("new element:" + flow.description())
        primitiveFlow.domElement = me.createElement(flow, primitiveFlow);  
      });
    }
    return primitiveFlow.domElement;
  }

  createElement(flow, primitiveFlow) {
    const you = primitiveFlow; 
    if (you instanceof Button) {
      const button = document.createElement("button");
      button.onclick = you.onClick;
      button.appendChild(document.createTextNode(you.text));
      return button; 
    } if (you instanceof Text) {
      return document.createTextNode(you.text);
    } else if (you instanceof Row) {
      let element = document.createElement("div");
      element.id = flow.uniqueName();
      element.className = flow.className();
      return element; 
    }
  }
}