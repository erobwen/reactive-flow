import { observable, Flow } from "./flow/Flow";
import { text, row } from "./flow/PrimitiveFlow";
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

export class HelloWorld extends Flow {
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

export class Hello extends Flow {
  build() {
    return text("text", {text: this.hello.value});
  }
}

export class World extends Flow {
  setState() {
    this.world = "";
  }

  build() {
    return text("text", {text: this.world});
  }
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
  helloWorld.getChild("world").world = "world!";
} , 2000)

