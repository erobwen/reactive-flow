// import { MyComponent, TestComponent } from "./application.js"
// import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

// // Setup flow
// const root = new TestComponent({
//   key: "root",
//   target: new DOMFlowTarget(document.getElementById("flow-root")) 
// }).activate();

// // Emulated user interaction.
// root.getChild(["more-button"]).onClick();
// root.getChild(["more-button"]).onClick();
// root.getChild(["more-button"]).onClick();
// root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
const log = console.log;

import { observable, Flow, flow } from "./flow/Flow";
import { text, row } from "./flow/PrimitiveFlow";
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

/**
 * Flow definitions
 */

// Parent flow
class HelloWorld extends Flow {
  setState() {
    this.hello = observable({value: ""});
  }

  build() {
    this.provide("hello");  // Makes all children/grandchildren inherit the hello property! 

    return row("row",
      hello("hello"),
      text("spacer", {text: " "}),
      new World("world", {world: this.world})
    );
  }
}

// Stateless child flow (compact definition)
const hello = flow(
  ({hello}) => text("text", {text: hello.value})
);

// Child flow with state
class World extends Flow {
  setState() {
    this.world = "";
    this.emphasis = false; 
  }

  build() {
    log("here")
    return (
      row("row",
        text("text", {text: this.world}),
        emphasis("emphasis", {on: this.emphasis})
      )
    );
  }
}

// Another stateless child flow
const emphasis = flow(
  ({on}) => on ? text({text: "!"}) : null
);


/**
 * Browser setup
 */

// Activate continous build/integration to DOMFlowTarget.
const helloWorld = new HelloWorld({
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).activate();


/**
 * Async modification
 */

// Set "Hello" deep inside observable data structure
setTimeout(() => {
  helloWorld.hello.value = "Hello";
} , 1000)

// Set state property to "world!", using a component path to access child component.
setTimeout(() => {
  helloWorld.getChild("world").world = "world";
} , 2000)

// Exclamation mark!
setTimeout(() => {
  helloWorld.getChild("world").emphasis = true;
} , 3000)
  
  
