import { observable, world, repeat, when, Flow, finalize, readFlowProperties, getTarget, creators, findTextAndKeyInProperties } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text, row, column, button } from "../flow.components/BasicFlowComponents";
import { modal } from "../flow.components/PortalAndModal";

const log = console.log;
const loga = (action) => {
  log("-----------" + action + "-----------");
}

function dialog(...parameters) {
  let properties = readFlowProperties(parameters);
  properties = findTextAndKeyInProperties(properties);
  return new Dialog(properties);
}

export class Dialog extends Flow {
  setProperties({close, text}) {
    this.close = close; 
    this.text = text; 
  }

  build() {
    return row(
      text(this.text),
      button("Close", () => this.close()), 
      {style: {pointerEvents: "auto"}}
    )
  }
}


/**
 * Modal example
 */
export class ModalExample extends Flow {
  // Lifecycle function build is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
  setProperties({}) {
    // Object.assign(this, properties)
    this.name = "Modal Example";
  }

  setState() {
    this.showModal = false;
  }

  build() {

    return (
      column(
        text("modal demo"),
        row(
          button("Open Modal", ()=> {this.showModal = true;}),
        ), 
        modal(
          "modal",
          dialog("dialog", "Modal!", {close: () => {log("CLOSE"); this.showModal = false}})
        ).show(this.showModal)
      )
    );
  }
}
  

/**
 * Start the demo
 */
  
export function startModalDemo() {
  const root = new ModalExample();
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(root);
}
