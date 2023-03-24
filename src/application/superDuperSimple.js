import { text } from "../flow.components/BasicWidgets";
import { column } from "../flow.components/Layout";
import { button } from "../flow.components/Theme";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget";
import { Flow } from "../flow/Flow";

const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SuperSimple extends Flow {
  setState() {
    this.showText = true; 
  }

  build() {
    return column(
      button("foo", "Foo", ()=> { this.showText = !this.showText}),
      text("Some text", {animate: true, key: "my-text", style: {color: "green"}}).show(this.showText),
      {style: {fontSize: "40px", padding: "20px"}}
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperDuperSimple() {
  const simple = new SuperSimple()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
