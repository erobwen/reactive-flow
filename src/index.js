import { MyComponent, TestComponent } from "./application.js"
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

const root = new TestComponent({
  key: "root",
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).render();


root.getChild(["more-button"]).onClick();
root.getChild(["more-button"]).onClick();
root.getChild(["more-button"]).onClick();
root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
// ["root","root-list","rest-list","list-row"]