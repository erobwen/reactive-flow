import { MyComponent } from "./application.js"
import { FlowDOMTarget } from "./flow/FlowDomTarget.js";

new MyComponent({
  target: new FlowDOMTarget(document.getElementById("flow-root")) 
}).render();