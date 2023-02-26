import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { button, text } from "../flow.components/BasicWidgets";
import { column } from "../flow.components/Layout";
import { modernButton } from "../flow.components/ModernButton";
import { panelStyle } from "../flow.components/Style";


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
      new modernButton("Text", {style: {width: "400px", padding: "20px", height: "100px", backgroundColor: "rgb(150, 150, 255)", ...panelStyle}, onClick: () => {console.log("hello")}}),
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
