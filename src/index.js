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
    this.helloText = observable({value: ""});
    this.emphasis = false; 
  }

  build() {
    this.provide("helloText", "emphasis");  // Makes all children/grandchildren inherit the helloText and emphasis properties! 
    
    let style = {};
    if (this.emphasis) style.fontSize = "20px";

    return row("row", {style},
      hello("hello"), // No need to pass parameters as it will be inherited.
      text("spacer", {text: " "}),
      new World("world", {emphasisCharacter: "!"}) // This is how we create child flow components with a key "world" and pass them properties.
    );
  }
}

// Stateless child flow (compact definition)
const hello = flow(
  ({helloText}) => text("text", {text: helloText.value})
);

// Statefull child flow
class World extends Flow {
  setProperties({emphasisCharacter}) {
    // This life cycle function is optional, but can be used to set default values for properties.
    this.emphasisCharacter = emphasisCharacter ? emphasisCharacter : "?";
  }

  setState() {
    // In this lifecycle function you can setup state and obtain expensive resources.
    this.worldText = "";
  }

  build() {
    let style = {};
    if (this.emphasis) style.fontSize = "20px";
    return (
      row("row", {style},
        text("text", {text: this.worldText}),
        emphasis("emphasis", {on: this.emphasis, character: this.emphasisCharacter})
      )
    );
  }
}

// Another stateless child flow
const emphasis = flow(
  ({on, character}) => on ? text({text: character}) : null
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
  helloWorld.helloText.value = "Hello";
} , 1000)

// Set state property to "world!", using a component path to access child component.
setTimeout(() => {
  helloWorld.getChild("world").worldText = "world";
} , 2000)

// Exclamation mark!
setTimeout(() => {
  helloWorld.emphasis = true;
} , 3000)
  
  
