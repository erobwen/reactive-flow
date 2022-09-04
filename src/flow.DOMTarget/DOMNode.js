import { trace } from "../flow/Flow";
import { DOMFlowPrimitive } from "./DOMFlowPrimitive";    
const log = console.log;

/**
 * DOM Flow Target Primitive
 */
 export class DOMElementNode extends DOMFlowPrimitive {
    setProperties({children, tagName, attributes}) {
      this.children = children;
      this.tagName =  tagName ? tagName : "div";
      this.attributes = attributes ? attributes : {};
    }
  
    setState() {
      super.setState();
      this.previouslySetStyles = {};
      this.newPreviouslySetAttributes = {};
    }
  
    createEmptyDomNode() {
      const result = document.createElement(this.tagName);
      // console.log(this.toString() + ".createEmptyDomNode:");
      // console.log(result);
      return result;
    }
    
    reBuildDomNode(element) {
      // console.log(this.toString() + ".reBuildDomNode:");
      // console.log(element);

      const newAttributes = this.attributes;
      const newPreviouslySetAttributes = {};
      if (this.tagName.toUpperCase() !== element.tagName) {
        throw new Error("Too high expectations error. Cannot change tagName of existing HTML element. Please do not change the tagName property once set!");
      }
  
      // Clear out styles that will no longer be modified
      for (let property in this.previouslySetAttributes) {
        if (typeof(newAttributes[property]) === "undefined") {
          if (property === "style") {
            this.updateStyle(element, {}); // Clear style
          } else {
            element[property] = "";
          }
        }
      }
  
      // Set styles if changed
      for (let property in newAttributes) {
        if (property === "style") {
          this.updateStyle(element, newAttributes[property]);
        } else {
          if (element[property] !== newAttributes[property]) {
            element[property] = newAttributes[property];
          }
          newPreviouslySetAttributes[property] = true;  
        }
      }
  
      this.previouslySetAttributes = newPreviouslySetAttributes; // Note: Causality will prevent this from self triggering repeater.
    }
  
    updateStyle(element, newStyle) {
      const elementStyle = element.style;
      const newPreviouslySetStyles = {};
  
      // Clear out styles that will no longer be modified
      for (let property in this.previouslySetStyles) {
        if (typeof(newStyle[property]) === "undefined") {
          elementStyle[property] = "";
        }
      }
  
      // Set styles if changed
      for (let property in newStyle) {
        if (elementStyle[property] !== newStyle[property]) {
          elementStyle[property] = newStyle[property];
        }
        newPreviouslySetStyles[property] = true;
      }
  
      this.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater.     
    }
  }
  
  export class DOMTextNode extends DOMFlowPrimitive {
    setProperties({text}) {
      this.text = text;
    }
    
    createEmptyDomNode() {
      return document.createTextNode("");
    }
  
    reBuildDomNode(element) {
      // console.log(this.toString() + ".reBuildDomNode:");
      // console.log(element);
      element.nodeValue = this.text; // toString()
    }
  }
  
  export class DOMModalNode extends DOMFlowPrimitive {
    setProperties({children}) {
      this.child = (children instanceof Array) ? children[0] : children;
      this.children = null; // Avoid children for the initiator 
    }
  
    setState() {
      this.target.setModalFlow(this.child, this.close);
    }
  
    disposeState() {
      this.target.removeModalFlow(this.child); 
    }
  
    createEmptyDomNode() {
      return document.createElement("div");
    }
  
    reBuildDomNode(element) {
      if (trace) console.log(this.toString() + ".reBuildDomNode:");
      if (trace) console.log(element);
      element.style.display = "none";
    }
  }
  