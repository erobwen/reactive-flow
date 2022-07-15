import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, row } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

// Parent flow
export class SuperSimple extends Flow {
  setState() {
    this.foo = "foo";
    this.bar = "bar"
  }

  build() {
    console.log("============ BUILDING ============")
    return row(text({key: "text1", text: this.foo}), text({key: "text2", text: this.bar}));
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperSimple() {
  const simple = new SuperSimple({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();

  setTimeout(() => {
    log("----------------------------------");
    simple.foo = "FOO";
  }, 1000);

  setTimeout(() => {
    log("----------------------------------");
    simple.bar = "BAR";
  }, 2000);
}
