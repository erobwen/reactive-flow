import { ShowcaseComponent } from "./application/showcaseApplication.js";
import { helloWorldIndex } from "./application/helloWorldApplication.js";
import { DOMFlowTarget } from "./flow.DOMTarget/DOMFlowTarget.js";

helloWorldIndex();

// Setup hello world showcase
// const root = new HelloWorld({
//   key: "root",
//   target: new DOMFlowTarget(document.getElementById("flow-root")),
// }).activate();

// Setup flow Showcase
// const root = new ShowcaseComponent({
//   key: "root",
//   target: new DOMFlowTarget(document.getElementById("flow-root")),
// }).activate();

// // Emulated user interaction.
// console.log(root.buildRepeater.buildIdObjectMap);
// root.getChild("more-button").onClick();
// root.findChild("more-button").onClick();
// root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
