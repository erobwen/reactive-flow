import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, button } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { ClickablePanel } from "../flow.components/ClickablePanel";

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
      text("Some text", {animate: true, key: "my-text"}).show(this.showText),
      new ClickablePanel({mouseOverBackgroundColor: "red", style: {width: "400px", padding: "20px", height: "100px", backgroundColor: "blue"}, onClick: () => {console.log("hello")}}),
      {style: {fontSize: "40px", padding: "20px"}}
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperSimple() {
  const simple = new SuperSimple()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
