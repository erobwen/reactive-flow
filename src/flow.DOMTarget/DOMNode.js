import { DOMFlowTargetPrimitive } from "./DOMFlowTargetPrimitive";

/**
 * DOM Flow Target Primitive
 */
 export class DOMElementNode extends DOMFlowTargetPrimitive {
    setProperties({children, tagName, attributes}) {
      this.children = children;
      this.tagName =  tagName ? tagName : "div";
      this.attributes = attributes ? attributes : {};
    }
  
    setState() {
      this.previouslySetStyles = {};
      this.newPreviouslySetAttributes = {};
    }
  
    createEmptyDomNode() {
      return document.createElement(this.tagName);
    }
    
    buildDomNode(element) {
      const newAttributes = this.attributes;
      const newPreviouslySetAttributes = {};
      if (this.tagName.toUpperCase() !== element.tagName) {
        throw new Error("Too high expectations error. Cannot change tagName of existing HTML element. Please do not change the tagName property once set!");
      }
  
      // Clear out styles that will no longer be modified
      for (let property in this.newPreviouslySetAttributes) {
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
  
      this.newPreviouslySetAttributes = newPreviouslySetAttributes; // Note: Causality will prevent this from self triggering repeater.
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
  
  export class DOMTextNode extends DOMFlowTargetPrimitive {
    setProperties({text}) {
      this.text = text;
    }
    
    createEmptyDomNode() {
      return document.createTextNode("");
    }
  
    buildDomNode(element) {
      element.nodeValue = this.text; // toString()
    }
  }
  
  export class DOMModalNode extends DOMFlowTargetPrimitive {
    setProperties({children}) {
      this.children = children;
    }
  
    setState({}) {
      // Create the new flow target? show modal panel.
    }
  
    disposeState() {
      // Remove new flow target, hide modal panel 
    }
  
    createEmptyDomNode() {
      // Do nothing.
    }
  
    buildDomNode(element) {
      // Do nothing.
    }
  
  
    getPrimitive() {
      const me = this;
      me.primitive = me;
      
      finalize(me);
      if (!me.mountRepeater) {
        me.mountRepeater = repeat(me.toString() + ".mountRepeater", repeater => {
  
          // TODO: somehow mount 
    
          // Expand known children (do as much as possible before integration)
          // if (me.children) {
          //   for (let child of me.children) {
          //     if (child !== null) {
          //       child.getPrimitive();
          //     }
          //   }
          // }
        });
      }
    
      return me;
    }  
  }
  