//import { ContextReplacementPlugin } from "webpack";
import { observable } from "./Flow";
import { html, render } from "lit-html";
window.html = html; 



export class DOMFlowTarget {
  constructor(rootElement){
    this.rootElement = rootElement;
  }

  integrate(flow, templateResult) {
    let foo = "Hello World" 
    const myTemplate = html`<div>${foo}</div>`;

    // Render the template
    
    console.log("integrate");
    console.log(this.rootElement);
    console.log(templateResult)
    console.log(render(templateResult, this.rootElement));
    // TODO:  Decorate flow with dom-references. 
  }
}
