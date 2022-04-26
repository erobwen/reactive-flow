import { DOMFlowTarget } from "./DOMFlowTarget";
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
      this.child = (children instanceof Array) ? children[0] : children;
      this.children = null; // Avoid children for the initiator 
    }
  
    setState() {
      // console.log("ACTIVATE MODAL NODE!!!");
      // console.log(this.close)
      // Create the new flow target? show modal panel.
      // this.child.target = this.domFlowTarget; // This is kind of interesting if it works, the child was rendered by the parent, but later decorated by this.
      if (this.target.currentModalOnClose) this.target.currentModalOnClose(); 
      this.target.currentModalOnClose = this.close;
      // const childDomNode = this.child.getPrimitive().getDomNode();
      // childDomNode.style.pointerEvents = "auto";
      this.domFlowTarget = new DOMFlowTarget(this.target.modalDiv);
      this.domFlowTarget.integrate(this.child);
    }
  
    disposeState() {
      console.log("dispose");
      console.log(this.domFlowTarget.content.toString());
      console.log(this.child.toString());
      if (this.target.currentModalOnClose === this.close) {
        this.domFlowTarget.dispose();
      } else {
        console.log("not in charge...")
      }

      // Remove new flow target, hide modal panel 
    }
  
    createEmptyDomNode() {
      return document.createElement("div");
    }
  
    buildDomNode(element) {
      element.style.display = "none";
    }
  }
  