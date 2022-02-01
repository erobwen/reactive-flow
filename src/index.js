import { MyComponent, TestComponent } from "./application.js"
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

new TestComponent({
  key: "root",
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).render();