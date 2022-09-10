import { trace } from "../flow/Flow";
import { DOMFlowPrimitive } from "./DOMFlowPrimitive";    
const log = console.log;

/**
 * DOM Flow Target Primitive
 */
 export class DOMElementNode extends DOMFlowPrimitive {
    initialUnobservables() {
      let result = super.initialUnobservables();
      result.previouslySetStyles = {};
      return result;
    }

    setProperties({children, tagName, attributes}) {
      this.children = children;
      this.tagName =  tagName ? tagName : "div";
      this.attributes = attributes ? attributes : {};
    }
   
    createEmptyDomNode() {
      const result = document.createElement(this.tagName);
      // console.log(this.toString() + ".createEmptyDomNode:");
      // console.log(result);
      return result;
    }
    
    ensureDomNodeBuilt() {
      const element = this.domNode;
      // console.log(this.toString() + ".ensureDomNodeBuilt:");
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
      for (let property in this.unobservable.previouslySetStyles) {
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
  
      this.unobservable.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater.     
    }
  }
  
  export class DOMTextNode extends DOMFlowPrimitive {
    setProperties({text}) {
      this.text = text;
    }
    
    createEmptyDomNode() {
      return document.createTextNode("");
    }
  
    ensureDomNodeBuilt() {
      // console.log(this.toString() + ".ensureDomNodeBuilt:");
      // console.log(element);
      this.domNode.nodeValue = this.text; // toString()
    }
  }
  
  