import { finalize, Flow } from "./flow/Flow";


export class TestComponent extends Flow {

  setProperties({}) {
  }

  onReBuildCreate() {
    // Lifecycle function for doing costly things, like opening up connections etc.
    console.log("created!");
  }

  onReBuildRemove() {
    this.repeater.dispose();
  }

  build() {
    return new Row({
      children: [
        new Text({text: "Foo"}),
        new Text({text: "Foo"})
      ]
    });
  }
}


class Row extends Flow {
  setProperties({children}) {
    this.children = children;
  }

  build() {
    return new Div({children: this.children});
  }
}


class Text extends Flow {
  setProperties({text}) {
    this.text = text;
  }

  getResult() {
    finalize(this);
    // return html`<span>${this.text}</span>`;
    let result = html`${this.text}`;
    result.owner = this;
    return result; 
  }
}


class Div extends Flow {
  
  setProperties({children}) {
    this.children = children;
  }

  getResult() {
    finalize(this);
    return html`<div>${this.children ? this.children.map(child => child.getResult()) : null}</div>`;
  }
}

export class MyComponent extends Flow {

  setProperties({target, children}) {
    this.target = target;
    this.children = children; // Children set by parent
  }

  onReBuildCreate() {
    // Lifecycle function for doing costly things, like opening up connections etc.
  }

  onReBuildRemove() {
    this.repeater.dispose();
  }

  build() {
    const {target, children} = this;
    let childA = new ChildA({key: "A", target}).ensureBuilt();
    let childB = new ChildC({key: "C", target}).ensureBuilt();

    return new Row({
      key: "myRow", // This key will cause the same object to be reused in several repeats. 
      target: this.target,
      children: [
        childA, // Note that these children are not saved directly in the children property, but they will be remembered through their key. 
        new ChildB({
          key: "B", 
          width: target.width - childA.width - childC.width,  // Width ajusted according to peers. 
          target, 
          children: children}), // Just pass on to child.
        childC
      ] 
    });
  }
}