import { FlowTargetPrimitive } from "./Flow";

const log = console.log;


/**
 * DOM Flow Base class
 */
 export class DOMFlow extends FlowTargetPrimitive {

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  buildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}

/**
 * DOM primitive flows
 */
  
  
/**
 * 1:1 HTML mapping 
 */
export class ElementNode extends DOMFlow {
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

export class TextNode extends DOMFlow {
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




//  export class DOMButton extends DOMFlow {
//     setProperties({onClick, text}) {
//       // log("button set properties");
//       this.onClick = () => {
//         console.log("clicked at: " + JSON.stringify(this.getPath()))
//         onClick();
//       }
//       this.text = text; 
//     }
  
//     createEmptyDomNode() {
//       return document.createElement("button");
//     }
  
//     buildDomNode(element) {
//       element.onclick = this.onClick;
//       if (element.childNodes.length === 0) element.appendChild(document.createTextNode(''));
//       element.lastChild.nodeValue = this.text;
//     }
//   }