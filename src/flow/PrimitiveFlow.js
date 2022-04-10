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

// export const button = flow("button",
//   ({target, text, onClick}) => target.htmlElement({
//     tagType: "button",
//     onClick,
//     children: [target.htmlTextNode({text})]
//   })
// );


export function button() { return new GenericButton(readFlowArguments(arguments)) };
export class GenericButton extends Flow {
  build()  {
    return this.target.button(this.properties);
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

export const row = flow("row",
  ({style, children}) => htmlElement({children, tagType: "div", style: {...rowStyle, ...style}})
);



export const _htmlElement = flow("htmlElement",
  ({target, children, tagType, style}) => target.primitiveHtmlElement({children, tagType, style})
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
