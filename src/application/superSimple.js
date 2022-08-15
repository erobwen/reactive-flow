import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

// A very simple model
const model = observable({value: ""});

// A very simple view component
export class SuperSimple extends Flow {
  setState() {
    this.foo = "foo";
    this.bar = "bar"
  }

  build() {
    log("BUILD");
    log(this.model.value)
    return column(
      text(this.foo), 

      text(this.bar), 
      text(this.model.value), 
      {style: {fontSize: "40px", padding: "20px"}}
    );
  }

  reset() {
    this.model.value = "";
    this.foo = "foo";
    this.bar = "bar";
  }

  timedChanges() {
    this.reset();
    setTimeout(() => {
      log("----------------------------------");
      this.foo = "FOO";
    }, 1000);
  
    setTimeout(() => {
      log("----------------------------------");
      this.bar = "BAR";
    }, 2000);
  
    setTimeout(() => {
      log("----------------------------------");
      this.model.value = "FUM";
    }, 3000);  
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperSimple() {
  const simple = new SuperSimple({
    key: "root",
    model, 
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
  simple.timedChanges();
}
