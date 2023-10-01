import { div } from "../flow.DOMTarget/BasicHtml";
import { button, text } from "../components/basic/BasicWidgets";
import { column } from "../components/basic/Layout";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget";
import { Flow } from "../flow/Flow";

const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SimpleAddRemoveAnimation extends Flow {
  setState() {
    this.showText = false;
    this.color = "green"; 
  }

  // text("Some text", {div: false, animate: true, key: "my-text", style: {color: "green"}}).show(this.showText)

  onClick() {
    this.showText = !this.showText;
    setTimeout(()=> {
      this.color = this.color === "green" ? "red" : "green"; 
    },
    2500) 

  }

  build() {
    return column(
      button("foo", "Foo", this.onClick.bind(this)),
      column(
        div({key: "my-text", animate: true, style: {width: "200px", height: "40px", backgroundColor: this.color}}).show(this.showText),
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
