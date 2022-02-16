import { observable, repeat, finalize, Flow, flow, withoutRecording, sameAsPreviousDeep, readFlowArguments } from "./Flow.js";
const log = console.log;



/**
 * Primitive Flow Base class
 */
 export class PrimitiveFlow extends Flow {
  getPrimitive() {
    const me = this;
    me.primitive = me;
    
    finalize(me);
    if (!me.expandRepeater) {
      me.expandRepeater = repeat(me.toString() + ".expandRepeater", repeater => {

        // Expand known children (do as much as possible before integration)
        if (me.children) {
          for (let child of me.children) {
            if (child !== null) {
              child.getPrimitive();
            }
          }
        }
      });
    }

    return me;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  buildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}


/**
 * Primitive Flows
 */
export function text() { return new Text(readFlowArguments(arguments)) };
class Text extends PrimitiveFlow {
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


export function button() { return new Button(readFlowArguments(arguments)) };
export class Button extends PrimitiveFlow {
  setProperties({onClick, text}) {
    // log("button set properties");
    this.onClick = () => {
      console.log("clicked at: " + JSON.stringify(this.getPath()))
      onClick();
    }
    this.text = text; 
  }

  createEmptyDomNode() {
    return document.createElement("button");
  }

  buildDomNode(element) {
    element.onclick = this.onClick;
    if (element.childNodes.length === 0) element.appendChild(document.createTextNode(''));
    element.lastChild.nodeValue = this.text;
  }
}


export const rowStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  display:"flex", 
  flexDirection: "row", 
  alignItems: "stretch", 
  justifyContent: "flexStart",
  whiteSpace: "pre"
};

export const row = flow(
  ({style, children}) => htmlElement({children, tagType: "div", style: {...rowStyle, ...style}})
);


/**
 * 1:1 HTML mapping 
 */
export function htmlElement() { return new HtmlElement(readFlowArguments(arguments)) };
export class HtmlElement extends PrimitiveFlow {
  setProperties({children, tagType, style}) {
    this.children = children;
    this.tagType =  tagType ? tagType : "div";
    this.style = style ? style : {};
  }

  setState() {
    this.previouslySetStyles = {};
  }

  createEmptyDomNode() {
    return document.createElement(this.tagType);
  }
  
  buildDomNode(node) {
    // Nothing
    const newStyle = this.style;
    const nodeStyle = node.style;
    const newPreviouslySetStyles = {};

    // Clear out styles that will no longer be modified
    for (let property in this.previouslySetStyles) {
      if (typeof(newStyle[property]) === "undefined") {
        nodeStyle[property] = "";
      }
    }

    // Set styles if changed
    for (let property in newStyle) {
      if (nodeStyle[property] !== newStyle[property]) {
        nodeStyle[property] = newStyle[property];
      }
      newPreviouslySetStyles[property] = true;
    }

    this.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater. 
  }
}
