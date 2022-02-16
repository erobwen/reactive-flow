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

import { observable, Flow, readFlowArguments } from "./flow/Flow";
import { text, row } from "./flow/PrimitiveFlow";
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

// Parent flow
class HelloWorld extends Flow {
  setState() {
    this.hello = observable({value: ""});
  }

  build() {
    this.provide("hello");  // Makes all children/grandchildren inherit the hello property! 

    return row("row",
      new Hello("hello"),
      new text("spacer", {text: " "}),
      new World("world", {world: this.world})
    );
  }
}

// Child flow
class Hello extends Flow {
  build() {
    return text("text", {text: this.hello.value});
  }
}

// Child flow with state
class World extends Flow {
  setState() {
    this.world = "";
  }

  build() {
    return (
    row("row",
      text("text", {text: this.world}),
      emphasis("emphasis", {on: this.world ? true : false})
     )
    );
  }
}

// Flow without class declaration
function emphasis() {
  return new Flow(readFlowArguments(arguments), 
    ({on}) => {
      return on ? text({text: "!"}) : null;
    });
}

// Activate continous build/integration to DOMFlowTarget.
const helloWorld = new HelloWorld({
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).activate();

// Set "Hello" deep inside observable data structure
setTimeout(() => {
  helloWorld.hello.value = "Hello";
} , 1000)

// Set state property to "world!", using a component path to access child component.
setTimeout(() => {
  helloWorld.getChild("world").world = "world";
} , 2000)

