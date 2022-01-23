import { ContextReplacementPlugin } from "webpack";
import { observable } from "./reactive-flow";

class Flow {
  constructor() {
    this.repeater = null;
    this.children = null; // Actual children, once rendered. Could be a 
    return observable(this);
  }

  ensureRendered() {
    if (this.children === null) {
      this.repeater = repeat(() => {
        this.render();
        this.bubbleBounds()
      });  
    }
    return this; 
  }

  render() { throw Error("Not implemented!") } 

  bubbleBounds() {
    if (this.target.type === "html") {
      this.width = this.children.getWidthFromTemplateResultSomehow();
      this.height = this.children.getHeightFromTemplateResultSomehow();
    }
  }
}

class MyComponent extends Flow {
  constructor({key, target, children}) { 
    super();
    this.target = target;
    this.givenChildren = children; // Children set by parent
    return observable(this, key);
  }

  onReBuildCreate() {
    // Lifecycle function for doing costly things, like opening up connections etc.
  }

  onReBuildRemove() {
    this.repeater.dispose();
  }

  render() {
    const {target, givenChildren} = this;
    let childA = new ChildA({key: "A", target}).ensureRendered();
    let childB = new ChildC({key: "C", target}).ensureRendered();

    this.children = new Row({
      key: "myRow", // This key will cause the same object to be reused in several repeats. 
      target: this.target,
      children: [
        childA, // Note that these children are not saved directly in the children property, but they will be remembered through their key. 
        new ChildB({
          key: "B", 
          width: target.width - childA.width - childC.width,  // Width ajusted according to peers. 
          target, 
          children: givenChildren}), // Just pass on to child.
        childC
      ] 
    }).ensureRendered().children;
  }
}

// A generic cross platform container. (rendered as a div on web)
class Container extends Flow {
  children = null; // is set on render
  
  constructor({target, children}) {
    this.target = target;
    this.givenChildren = children; 
  }

  ensureRendered() {
    if (children === null) {
      this.repeater = repeat(() => {
        this.render();
      });  
    }
    return this; 
  }

  render() {
    if (this.target.type === "html") {
      // Render to html
      const content = givenChildren.map(child => { child.ensureRendered(); child.children});
      if (this.children) {
        // Patch result somehow. 
        // this.children.
      } else {
        this.children = html`<div>${content}</div>`
      }
    } else if (this.target.type === "something else") {
      //...
    }
  }
}