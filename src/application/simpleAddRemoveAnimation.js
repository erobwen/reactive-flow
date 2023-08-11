import { div } from "../flow.DOMTarget/BasicHtml";
import { button, text } from "../flow.components/BasicWidgets";
import { column } from "../flow.components/Layout";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget";
import { Flow } from "../flow/Flow";

const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SimpleAddRemoveAnimation extends Flow {
  setState() {
    this.showText = false; 
  }

  // text("Some text", {div: false, animate: true, key: "my-text", style: {color: "green"}}).show(this.showText)

  build() {
    return column(
      button("foo", "Foo", ()=> { this.showText = !this.showText}),
      column(
        div({key: "my-text", animate: true, style: {width: "200px", height: "40px", backgroundColor: "green"}}).show(this.showText),
        {style: {overflow: "visible", width: "400px", height: "400px"}}
      ),
      {style: {fontSize: "40px", padding: "20px"}}
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSimpleAddRemoveAnimation() {
  const simple = new SimpleAddRemoveAnimation()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
