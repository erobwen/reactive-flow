import { MyComponent, ShowcaseComponent } from "./application/showcaseApplication.js"
import { DOMFlowTarget } from "./flow.DOMTarget/DOMFlowTarget.js";

// Setup flow
const root = new ShowcaseComponent({
  key: "root",
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).activate();

// Emulated user interaction.
// console.log(root.buildRepeater.buildIdObjectMap);
// root.getChild("more-button").onClick();
// root.findChild("more-button").onClick();
// root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();




