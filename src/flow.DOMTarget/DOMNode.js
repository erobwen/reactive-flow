import { extractAttributes } from "../flow.components/Basic";
import { trace } from "../flow/Flow";
import { extractProperties } from "./DOMAnimation";
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
    
    ensureDomNodeAttributesSet() {
      const element = this.domNode;
      // console.log(this.toString() + ".ensureDomNodeAttributesSet:");
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
    
    // updateStyle(element, newStyle) {
    //   const elementStyle = element.style;
    //   const newPreviouslySetStyles = {};
  
    //   // Clear out styles that will no longer be modified
    //   for (let property in this.unobservable.previouslySetStyles) {
    //     if (typeof(newStyle[property]) === "undefined") {
    //       elementStyle[property] = "";
    //     }
    //   }
  
    //   // Set styles if changed
    //   for (let property in newStyle) {
    //     if (elementStyle[property] !== newStyle[property]) {
    //       elementStyle[property] = newStyle[property];
    //     }
    //     newPreviouslySetStyles[property] = true;
    //   }
  
    //   this.unobservable.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater.     
    // }
    
    updateStyle(element, newStyle) {
      const elementStyle = element.style;

      const newPreviouslySetStyles = {};
      let blockedProperties = {};
      if (this.currentAnimation) {
        // log("HERE")
        blockedProperties = this.currentAnimation.blockedPropertiesMap();
        // log(blockedProperties);
      }

      // Clear out styles that will no longer be modified
      for (let property in this.unobservable.previouslySetStyles) if (!blockedProperties[property]) {
        if (typeof(newStyle[property]) === "undefined") {
          // log(this.toString() + " clear style: " + property);
          elementStyle[property] = "";
        }
      }
  
      // Set styles if changed
      for (let property in newStyle) if (!blockedProperties[property]) {
        if (elementStyle[property] !== newStyle[property]) {
          // log(this.toString() + " set style: " + property + " = " + newStyle[property]);
          elementStyle[property] = newStyle[property];
        }
        newPreviouslySetStyles[property] = true;
      }
  
      this.unobservable.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater.     
    }
  
    getAnimatedFinishStyles() {
      const style = (this.attributes && this.attributes.style) ? this.attributes.style : {};
      const animation = this.animation ? this.animation : this.getAnimation();
      return extractProperties(style, animation.animatedProperties);
    }

    synchronizeDomNodeStyle(properties) {
      const style = (this.attributes && this.attributes.style) ? this.attributes.style : {}; 

      const same = (styleValueA, styleValueB) => 
        (typeof(styleValueA) === "undefined" && typeof(styleValueB) === "undefined")
        || styleValueA === styleValueB; 

      for (let property of properties) {
        if (typeof property === "string") {
          if (!same(style[property], this.domNode.style[property])) {
            console.log("Synchronizing: " + this.toString() + ", style " + property + " mismatch, resetting: " + this.domNode.style[property] + " --> " + style[property]);
            this.domNode.style[property] = style[property] ? style[property] : "";
          }
        } else {
          const propertyCompoundValue = style[property.compound];

          if (propertyCompoundValue) {
            if (!same(propertyCompoundValue, this.domNode.style[property.compound])) {
              console.log("Synchronizing: " + this.toString() + ", style " + property.compound + " mismatch, resetting: " + this.domNode.style[property.compound] + " --> " + propertyCompoundValue);
              this.domNode.style[property.compound] = propertyCompoundValue ? propertyCompoundValue : "";
            }
          } else {
            const propertyPartialValues = {}
            property.partial.forEach(property => {
              if (style[property]) {
                propertyPartialValues[property] = style[property];  
              }
            });
  
            if (Object.keys(propertyPartialValues).length > 0) {
              Object.assign(this.domNode.style, propertyPartialValues);
            } else {
              this.domNode.style[property.compound] = "";
            }
          }
        }
      }
    }
  }
  
  export class DOMTextNode extends DOMFlowPrimitive {
    setProperties({text}) {
      this.text = text;
    }
    
    createEmptyDomNode() {
      return document.createTextNode("");
    }
  
    ensureDomNodeAttributesSet() {
      // console.log(this.toString() + ".ensureDomNodeAttributesSet:");
      // console.log(element);
      this.domNode.nodeValue = this.text; // toString()
    }

    synchronizeDomNodeStyle(properties) {
      // for (let property of properties) {
      //   this.domNode.style[property] = "";
      // }
    }
  }
  
  