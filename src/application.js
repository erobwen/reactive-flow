import { Flow, Text, Row, Button, repeat, when } from "./flow/Flow";
const log = console.log;


/**
 * This is a demo-application that showcases some of the principles of Flow. 
 * Please read the comments for a tour over what features exists and how they work.  
 * 
 * This simple program just demonstrates the recursive and state preserving capabilities 
 * of Flow. A number of components are created recursivley according to the "count" state.
 * And each component has its own state that can be toggled on/off. Note that the state of each individual 
 * component is maintained, while the whole recursive chain of components are re-built. 
 * Also, open and expand the view-elements debug panel in Chrome, to verify minimal updates
 * to the DOM when the UI is rebuilt.  
 */

export class TestComponent extends Flow {
  
  // Constructor: Normally do not override constructor (unless in special ocasions)

  // onReBuildCreate(): Lifecycle function when a flow is first established. The same flow (same parent same key) may be constructed many times, but the first time a flow under a certain parent with a certain key is created, it is established and this event is sent. Use this function to initialize expensive resorces like DB-connections etc. 
  onReBuildCreate() {
    Flow.prototype.onReBuildCreate.call(this);
    this.count = 1
    const me = this;

    // Just a debug causality repeater that writes a debug log whenever count is changed. 
    repeat(this.toString() + " (count tracker)",repeater => {
      log(repeater.causalityString());
      let observe = me.count;
      log("---------- count -------------");
    })
  }

  // onReBuildRemove(): Lifecycle function when parent no longer creates a child with the same key/class.
  onReBuildRemove() {}

  build() {
    // build() is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
    const me = this;
    let observe = this.count;
    return new Row({
      key:"root-row",
      children: [
        new Text({key: "root-text", text: "My List:"}),
        new Button({key: "less-button", onClick: () => {me.count--}, text: "Less"}),
        new Button({key: "more-button", onClick: () => {me.count++}, text: "More"}),
        new List({key: "root-list", count: this.count})
      ]
    });
  }
}

export class List extends Flow {
  // setProperties({}) is a function where you declare all properties that a parent can set on its child. This is a good place to define default values, or modify values given by parent. Note however, that you could omit this if you want to and properties would still be transfered by the default constructor to the object.   
  setProperties({count}) {
    this.count = count;
  }

  build() {
    const children = [];
    children.push(new Item({key: "first-item", text: "Foo " +  this.count}));
    if (this.count > 1) {
      children.push(new List({key: "rest-list", count: this.count - 1}));
    }
    return new Row({key:"list-row", children: children });
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text;
  }
  
  onReBuildCreate() {
    Flow.prototype.onReBuildCreate.call(this);

    // This is the place to define view model variables. In this case the "on" property is defined. 
    // Note: Do NOT  do this in the constructor or setProperties as then the established value might be overwritten by the default value!   
    this.on = true;
    
    // This is a reactivley triggered repeater that reacts when me.domElement is set. This is a way to catch a reference to the actual DOM element of this component.
    const me = this;
    when(() => me.domElement, 
      element => { 
        log("Got an element!") 
        log(element) 
      });
  }

  // If we define keys for all created children in the render function, Flow will optimally preserve the state for all of these components from previous renderers. 
  // For stateless components such as Row and Text it would be possible to omit the key and it would still work, however it would be vasteful as components can no longer be reused. 
  build() {
    const me = this; 
    return new Row({key: "item-row", // Row is a primitive flow that can be converted into a DOM element by the DomFlowTarget module. However, a 1:1 mapping to HTML can also be possible, by using a Div flow for example. 
      children: [
        new Text({key: "text", text: me.on ? "on" : "off"}),
        new Button({key: "toggle-button", onClick: () => { log("---------- toggle on -------------");me.on = !me.on; }, text: "toggle"}),
        new Text({key: "item-text", text: me.text})
      ]});
  }
}

