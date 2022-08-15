import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, row, button } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { SuperSimple } from "./superSimple";
import { AnimationExample } from "./animationExample";

const log = console.log;

/**
 * Flow definitions
 */


// A very simple view component
export class Demo extends Flow {
  setState() {}
  
  build() {
    this.superSimple = new SuperSimple("super-simple", {model: observable({value: ""})});
    this.animationExample = new AnimationExample("animation-example", {items: ["Foo", "Fie", "Fum", "Bar", "Foobar", "Fiebar", "Fumbar"]});
    if (!this.choosen) this.choosen = this.superSimple;
    return column(
      row(
        button({text: "Super Simple", onClick: () => {log("clicked!");this.choosen = this.superSimple}}), 
        button({text: "Animation Example", onClick: () => {log("clicked!");log(this); this.choosen = this.animationExample}}),
        {style: {borderBottom: "1px", borderBottomStyle: "solid"}}
      ),
      this.choosen
    )
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startDemo() {
  const demo = new Demo({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();

}
