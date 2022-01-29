import { ContextReplacementPlugin } from "webpack";
import { observable } from "./Flow";
import { html } from "lit-html";
window.html = html; 


export const FlowToDom = {
  render: (rootComponent, rootElement) => {
    rootComponent.target = 
    rootComponent.render(new FlowDOMTarget(rootElement));
  }
}



// export class DomIntegrator {
//   constructor(rootElement){
//     this.rootElement = this.rootElement;
//   }
// }

export class FlowDOMTarget {
  constructor(rootElement){
    this.rootElement = this.rootElement;
  }

  integrate(templateResult) {
    // Set child of ... 
    this.rootElement.
  }
}

// A generic cross platform container. (rendered as a div on web)
class Container extends Flow {
  children = null; // is set on render
  
  constructor({target, children}) {
    this.target = target;
    this.givenChildren = children; 
  }

  render() {
    if (this.target.type === "html") {
      // Render to html
      const content = givenChildren.map(child => { child.ensureRendered(); child.children});
      if (this.result) {
        // Patch result. 
        this.result.values[0] = content;
        // Notify differential engine of change? 
      } else {
        // A new result
        this.result = html`<div>${content}</div>`
      }
    } else if (this.target.type === "something else") {
      //...
    }
  }
}


