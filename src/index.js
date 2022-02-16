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
import { text, row as primitiveRow } from "./flow/PrimitiveFlow";
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

    return myRow("row", 
      hello("hello"), // No need to pass parameters as it will be inherited.
      text("spacer", {text: " "}),
      new World("world", {exclamationCharacter: "!"}) // This is how we create child flow components with a key "world" and pass them properties.
    );
  }
}

// Stateless child flow (compact definition)
const hello = flow(
  ({helloText}) => text("text", {text: helloText.value})
);

// Statefull child flow
class World extends Flow {
  setProperties({exclamationCharacter}) {
    // This life cycle function is optional, but can be used to set default values for properties.
    this.exclamationCharacter = exclamationCharacter ? exclamationCharacter : "?";
  }

  setState() {
    // In this lifecycle function you can setup state and obtain expensive resources.
    this.worldText = "";
  }

  build() {
    return (
      myRow("row",
        text("text", {text: this.worldText}),
        exclamationMark("!", {on: this.emphasis, character: this.exclamationCharacter})
      )
    );
  }
}

// Another stateless child flow
const exclamationMark = flow(
  ({on, character}) => on ? text({text: character}) : null
);

// My own dynamically/reactivley styled row
const myRow = flow(
  ({style, children, emphasis}) => {
    if (!style) style = {};
    if (emphasis) style.fontSize = "20px"; // Note how the emphasis property is provided/inherited from the root component. 
    return primitiveRow({children, style});
  }
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
  
  
