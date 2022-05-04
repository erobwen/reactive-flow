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
    this.derrive(() => {
      // In setState you can establish reactive relations between different properties using this.derrive(). You could accomplish the same thing using causality/repeat but this.derrive takes care of disposing the repeater for your convenience. 
      this.helloTextComma = this.helloText.value + ",";
    });
  }

  provide() {
     // Makes all children/grandchildren inherit the helloText and emphasis properties! Define withdraw() to remove inherited properties.
    return ["helloTextComma", "emphasis"];
  }

  build() {
    return myRow(
      "row",
      hello("hello"), // No need to pass parameters as it will be inherited.
      text("spacer", { text: " " }),
      new World("world", { exclamationCharacter: "!" }) // This is how we create child flow components with a key "world" and pass them properties.
    );
  }
}

// Stateless child flow (compact definition)
const hello = flow("hello", ({ helloTextComma }) =>
  text("text", { text: helloTextComma })
);

// Statefull child flow
class World extends Flow {
  setProperties({ exclamationCharacter }) {
    // This life cycle function is optional, but can be used to set default values for properties.
    this.exclamationCharacter = exclamationCharacter ? exclamationCharacter : "?";
  }

  setState() {
    // In this lifecycle function you can setup state and obtain expensive resources. You can let go of these resources in disposeState().
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
 * This is what you would typically do in index.js to start this app. 
 */
export function startHelloWorld() {
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

  // Set state property to "world!", using a component path to access child component.
  setTimeout(() => {
    log("----------------------------------");
    helloWorld.getChild("world").worldText = "world";
  }, 2000);

  // Exclamation mark!
  setTimeout(() => {
    log("----------------------------------");
    helloWorld.emphasis = true;
  }, 3000);
}
