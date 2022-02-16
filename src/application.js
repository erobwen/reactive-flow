import { observable, world, repeat, when, Flow } from "./flow/Flow";
import { text, row, button } from "./flow/PrimitiveFlow";
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
  
  // Constructor: Normally do not override constructor!!! (unless modifying the framework itself)

  // Lifecycle function onEstablish when a flow is first established. The same flow (same parent same key) may be constructed many times, but the first time a flow under a certain parent with a certain key is created, it is established and this event is sent. Use this function to initialize expensive resorces like DB-connections etc. 
  setState() {
    // log("Established:" + this.toString());
    
    // Set state
    this.count = 1
    this.myModel = observable({
      value: 42 
    })
    
    // Just a debug causality repeater that writes a debug log whenever count is changed. 
    const me = this;
    repeat(this.toString() + " (count tracker)",repeater => {
      log(repeater.causalityString());
      let observe = me.count;
      log("---------- count -------------");
    })
  }

  // Lifecycle function disposeState when parent no longer creates a child with the same key/class. Can be used to deallocate state-related resources.
  disposeState() {
    // log("Removed:" + this.toString());
  }

  // Lifecycle function build is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
  build() {
    this.provide("myModel"); // Give all grand-children access to myModel, they will get this as a property of their own.

    const me = this;
    let observe = this.count;
    
    const rootText = text("root-text", {text: "My List:"});
    const rootTextNode = this.target.getDomNode(rootText.getPrimitive()); 
    log("Getting dom text node in advance during build!")
    log(rootTextNode);

    return (
      row("root-row",
        rootText,
        button("less-button", {onClick: () => {me.count--}, text: "Less"}),
        button("more-button", {onClick: () => {me.count++}, text: "More"}),
        new List("root-list", {maxCount: this.count, count: 1})
      )
    );
  }
}

export class List extends Flow {
  // This is the function setProperties where you declare all properties that a parent can set on its child. This is optional, but is a good place to define default values, modify values given by parent, or document what properties that the component needs.   
  setProperties({maxCount, count}) {
    this.maxCount = maxCount;
    this.count = count;
  }

  build() {
    const children = [];
    children.push(new Item("first-item", {text: "Foo " +  this.count}));
    if (this.count < this.maxCount) {
      children.push(new List("rest-list", {maxCount: this.maxCount, count: this.count + 1}));
    }
    return row("list-row", {children: children});
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text;
  }
  
  setState() {
    // log("Established:" + this.toString());

    // This is the place to define view model variables. In this case the "on" property is defined. 
    // Note: Do NOT  do this in the constructor or setProperties as then the established value might be overwritten by the default value!   
    this.on = true;
    
    // This is a reactivley triggered repeater that reacts when me.domNode is set. This is a way to catch a reference to the actual DOM element of this component.
    const me = this;
    when(() => me.domNode, 
      node => { 
        log("Got a node!");
        log(node);
      });
  }

  // If we define keys for all created children in the render function, Flow will optimally preserve the state for all of these components from previous renderers. 
  // For stateless components such as Row and Text it would be possible to omit the key and it would still work, however it would be vasteful as components can no longer be reused. 
  build() {
    const me = this; 
    return row("item-row",  // row is a primitive flow that can be converted into a DOM element by the DomFlowTarget module. However, a 1:1 mapping to HTML can also be possible, by using a Div flow for example. 
      text("text", {text: me.on ? "on" : "off"}),
      button("toggle-button", {onClick: () => { log("---------- toggle on -------------");me.on = !me.on; }, text: "toggle"}),
      text("item-text", {text: me.text})
      // text("item-text", {text: me.text})
    );
  }
}

/**
 * This is how to declare a simple function flow without state
 */
function frame() {
  return new Flow({
    build: ({children}) => {
      return new Div({children: [
        row({children})
      ]});
    },
    ... readFlowArguments(arguments)
  })
}

/**
 * This is how to package a class component in a way so that it can be used without "new".
 * One way is to do this to primitive flows only, so they are easy to distinguish from compound/stateful flows. 
 */
export const MyComponent = () => new MyComponentFlow(readFlowArguments(arguments)); // lean constructor
export class MyComponentFlow extends Flow {
  setProperties({count}) {
    this.count = count;
  }
  
  build() {
    return ( 
      row("list-row", {}, 
        button("a", {onClick: () => {console.log("a clicked")}}),
        button("b", {onClick: () => {console.log("b clicked")}})
      )
    );
  }
}
  
  