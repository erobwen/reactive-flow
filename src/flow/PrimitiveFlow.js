import { observable, repeat, finalize, Flow, withoutRecording, sameAsPreviousDeep, readFlowArguments } from "./Flow.js";
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
            child.getPrimitive();
          }
        }
      });
    }

    return me;
  }

  createEmptyDomElement() {
    throw new Error("Not implemented yet!");
  }

  buildDomElement(element) {
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
  
  createEmptyDomElement() {
    return document.createTextNode("");
  }

  buildDomElement(element) {
    element.nodeValue = this.text; // toString()
  }
}


/**
 * Primitive Flows
 */
export function row() { return new Row(readFlowArguments(arguments)) };
export class Row extends PrimitiveFlow {
  setProperties({children}) {
    this.children = children;
  }
  
  createEmptyDomElement() {
    return document.createElement("div");
  }
  
  buildDomElement(element) {
    // Nothing
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

  createEmptyDomElement() {
    return document.createElement("button");
  }

  buildDomElement(element) {
    element.onclick = this.onClick;
    if (element.childNodes.length === 0) element.appendChild(document.createTextNode(''));
    element.lastChild.nodeValue = this.text;
  }
}

export class HtmlElement extends PrimitiveFlow {
  setProperties({children, tagType}) {
    this.children = children;
    this.tagType =  tagType;
  }
}
