import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, row as basicRow } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

// Parent flow
export class HelloWorld extends Flow {
  setState() {
    this.helloText = observable({ value: "[original]" });
    this.emphasis = false;
    // this.derrive(() => {
    //   this.helloTextDouble = this.helloText.value + " " + this.helloText.value;
    // });
  }

  // provide() {
  //   return ["helloText", "emphasis"];
  // }

  // cease() {
  // }

  build() {
    // this.provide("helloText", "emphasis"); // Makes all children/grandchildren inherit the helloText and emphasis properties!

    // return myRow(
    //   "row",
      return text("text", { text: this.helloText.value });
      // return hello("hello")//, // No need to pass parameters as it will be inherited.
      // text("spacer", { text: " " }),
      // new World("world", { exclamationCharacter: "!" }) // This is how we create child flow components with a key "world" and pass them properties.
    // );
  }
}

// Stateless child flow (compact definition)
const hello = flow("hello", ({ helloText }) =>
  text("text", { text: helloText.value })
);
// const hello = flow("hello", (me) => {
//   const { helloText } = me;
//   log("in flow...");
//   log(me.toString());
//   log(me.helloText);
//   return text("text", { text: helloText.value });
// });

// Statefull child flow
class World extends Flow {
  setProperties({ exclamationCharacter }) {
    // This life cycle function is optional, but can be used to set default values for properties.
    this.exclamationCharacter = exclamationCharacter
      ? exclamationCharacter
      : "?";
  }

  setState() {
    // In this lifecycle function you can setup state and obtain expensive resources.
    this.worldText = "";
  }

  build() {
    return myRow(
      "row",
      text("text", { text: this.worldText }),
      exclamationMark("!", {
        on: this.emphasis,
        character: this.exclamationCharacter,
      })
    );
  }
}

// Another stateless child flow
const exclamationMark = flow("exclamationMark", ({ on, character }) =>
  on ? text({ text: character }) : null
);

// My own dynamically/reactivley styled row
const myRow = flow("myRow", ({ style, children, emphasis }) => {
  if (!style) style = {};
  if (emphasis) style.fontSize = "20px"; // Note how the emphasis property is provided/inherited from the root component.
  return basicRow("primitive", { children, style });
});

/**
 * Browser setup
 */

// Activate continous build/integration to DOMFlowTarget.
const helloWorld = new HelloWorld({
  key: "root",
  target: new DOMFlowTarget(document.getElementById("flow-root")),
}).activate();

/**
 * Async modification
 */

// Set "Hello" deep inside observable data structure
setTimeout(() => {
  log("----------------------------------");
  helloWorld.helloText.value = "Hello";
}, 1000);

// // Set state property to "world!", using a component path to access child component.
// setTimeout(() => {
//   log("----------------------------------");
//   helloWorld.getChild("world").worldText = "world";
// }, 2000);

// // Exclamation mark!
// setTimeout(() => {
//   log("----------------------------------");
//   helloWorld.emphasis = true;
// }, 3000);
