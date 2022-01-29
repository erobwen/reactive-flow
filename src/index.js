import { MyComponent, TestComponent } from "./application.js"
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

new TestComponent({
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).render();