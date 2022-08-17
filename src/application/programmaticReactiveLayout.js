import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, row, div, centerMiddle } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

// Parent flow
export class ProgrammaticReactiveLayout extends Flow {
  
  setProperties({bounds}) {
    this.bounds = bounds; 
  } 

  setState() {
    this.foo = "foo";
  }

  build() {
    console.log();
    return centerMiddle(
      text("bounds: [" + this.bounds.width + " x " + this.bounds.height + "]"), 
      {style: {height: "100%", width: "100%"}}
    );
    // return row(text(this.bounds.toString()), );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startProgrammaticReactiveLayout() {
  const root = new ProgrammaticReactiveLayout({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}


function subtractWidth(bounds, width) {
  return {width: bounds.width - width, height: bounds.height};
}


function subtractHeight(bounds, width) {
  return {width: bounds.width - width, height: bounds.height};
}