import { Flow, readFlowProperties, findTextAndKeyInProperties } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { modal } from "../flow.components/PortalAndModal";
import { button, text } from "../flow.components/BasicWidgets";
import { centerMiddle, column, fitStyle, row, zStack, zStackElementStyle } from "../flow.components/Layout";
import { div } from "../flow.components/Basic";


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
    return zStack(
      centerMiddle(
        text(this.text),
        button("Close", () => this.close()), 
        {style: {...zStackElementStyle, height: "100%", pointerEvents: "auto"}}
      ),
      div({style: {...zStackElementStyle, backgroundColor: "rgba(0, 0, 0, 0.1)"}}),
      {style: fitStyle}
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
