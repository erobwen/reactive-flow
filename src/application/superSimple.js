import { observable, Flow, flow, repeat, readFlowProperties, findTextAndKeyInProperties } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { ClickablePanel } from "../flow.components/ModernButton";
import { modal, modalFrame } from "../flow.components/PortalAndModal";
import { button, text } from "../flow.components/BasicWidgets";
import { column, row } from "../flow.components/Layout";

const log = console.log;

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
    return column(
      text(this.text),
      button("Close", () => this.close()), 
      {style: {pointerEvents: "auto"}}
    )
  }
}


/**
 * Minimalistic component used for experiments. 
 */
export class SuperSimple extends Flow {
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
      modalFrame(
        column(
          button("Open Modal", ()=> {log("SHOW");this.showModal = true;}),
          modal(
            "modal",
            dialog("dialog", "Modal!", {close: () => {log("CLOSE"); this.showModal = false}})
            ).show(this.showModal)
        )
      )
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperSimple() {
  const simple = new SuperSimple()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
