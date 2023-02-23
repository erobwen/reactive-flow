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


const panelStyle = {
  backgroundColor: "rgb(250, 250, 250)",
  borderStyle: "solid", 
  borderRadius: "5px",
  borderWidth: "1px",
  padding: "20px"
}

const animatedContainerStyle = {
  overflow: "visible"
}

export class Dialog extends Flow {
  setProperties({close, text, children}) {
    this.close = close; 
    this.text = text; 
    this.children = children ? children : []; 
  }

  build() {
    return zStack(
      div({style: {...zStackElementStyle, ...animatedContainerStyle, backgroundColor: "rgba(0, 0, 0, 0.1)"}}),
      centerMiddle(
        column(
          text(this.text),
          button("Close", () => this.close()), 
          ...this.children,
          {style: {...panelStyle, ...animatedContainerStyle}}
        ),
        {style: {...zStackElementStyle, ...animatedContainerStyle, height: "100%", pointerEvents: "auto"}}
      ),
      {style: fitStyle, ...animatedContainerStyle}
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
    this.showAnimatedModal = false; 
  }

  build() {

    const openAnimatedModalButton = button("openAnimatedButton", "Open Animated Modal", ()=> {this.showAnimatedModal = true;}, {animate: true});

    return (
      column(
        text("modal demo"),
        row(
          button("Open Modal", ()=> {this.showModal = true;}),
          openAnimatedModalButton.show(!this.showAnimatedModal),
        ), 
        modal(
          "modal",
          dialog("dialog", "Modal!", {close: () => {log("CLOSE"); this.showModal = false}})
        ).show(this.showModal),
        modal(
          "animatedModal",
          dialog("animatedDialog", "Animated Modal!", openAnimatedModalButton, {close: () => {log("CLOSE"); this.showAnimatedModal = false}})
        ).show(this.showAnimatedModal)
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
