import { PrimitiveFlow } from "./PrimitiveFlow";
const log = console.log;



/**
 * DOM primitive flows
 */
 export class DOMButton extends PrimitiveFlow {
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
  