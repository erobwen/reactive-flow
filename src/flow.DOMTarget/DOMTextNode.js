import { extractAttributes } from "../flow.components/BasicHtml";
import { trace } from "../flow/Flow";
import { logMark } from "../flow/utility";
import { extractProperties } from "./DOMAnimation";
import { DOMNode } from "./DOMNode";    
const log = console.log;


export class DOMTextNode extends DOMNode {
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
