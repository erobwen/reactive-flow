
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
