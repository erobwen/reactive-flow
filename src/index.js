import { MyComponent, TestComponent } from "./application.js"
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

// Setup flow
const root = new TestComponent({
  key: "root",
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).activate();

// Emulated user interaction.
root.getChild(["more-button"]).onClick();
root.getChild(["more-button"]).onClick();
root.getChild(["more-button"]).onClick();
root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
