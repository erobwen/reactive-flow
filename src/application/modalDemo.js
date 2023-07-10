import { Flow, readFlowProperties, findTextAndKeyInProperties } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { button, text } from "../flow.components/BasicWidgets";
import { centerMiddle, column, fitStyle, row, zStack, zStackElementStyle } from "../flow.components/Layout";
import { div } from "../flow.components/BasicHtml"
;
import { adjustLightness } from "../flow.components/Color";
import { modernButton } from "../flow.components/ModernButton";
import { animatedContainerStyle } from "../flow.components/Style";
import { modal, modalFrame } from "../flow.components/Modal";


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

const shadeColor = "rgba(0, 0, 0, 0.4)";
const transparentColor = "rgba(0, 0, 0, 0)";

export class Dialog extends Flow {
  setProperties({close, text, children}) {
    this.close = close; 
    this.text = text; 
    this.children = children ? children : []; 
    this.backgroundColor = transparentColor;
  }

  onDidDisplayFirstFrame() {
    this.backgroundColor = shadeColor;
    log("onDidDisplayFirstFrame");
    // log("onDidDisplayFirstFrame: " + this.toString() + ".visibility = " + isVisible);
  }

  build() {
    log("Dialog.build")
    const background = div({
      key: "background", 
      style: {
        ...zStackElementStyle, 
        ...animatedContainerStyle, 
        transition: "background-color 1000ms linear", 
        backgroundColor: this.backgroundColor
      }});
    const domNode = background.getPrimitive().getDomNode();
    log(domNode);

    return zStack(
      background,
      centerMiddle(
        column(
          text(this.text),
          button("Close", () => this.close()), 
          ...this.children,
          {style: {...panelStyle, ...animatedContainerStyle}, animateChildrenWhenThisAppears: true}
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
    const openAnimatedModalButton = button("openAnimatedButton", this.showAnimatedModal ? "Close Animated Modal" : "Open Animated Modal", ()=> {this.showAnimatedModal = !this.showAnimatedModal;}, {animate: true});
    const color = "rgb(143, 212, 190)";
    return (
      modalFrame(
        column(
          text("modal demo"),
          row(
            button("Open Modal", ()=> {this.showModal = true;}),
            // openAnimatedModalButton.show(!this.showAnimatedModal),
            // text("foobar"),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, -0.2)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, -0.1)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: color}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.1)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.2)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.3)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.4)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.5)}}),
            // div({style: {width: "100px", height: "100px", backgroundColor: adjustLightness(color, 0.6)}}),
            {style: animatedContainerStyle}
          ), 
          // modernButton({style: {width: "100px", height: "100px", backgroundColor: color}}),
          modal(
            "modal",
            dialog("dialog", "Modal!", {close: () => {log("CLOSE"); this.showModal = false}})
          ).show(this.showModal),
          // modal(
          //   "animatedModal",
          //   dialog("animatedDialog", "Animated Modal!", openAnimatedModalButton.show(this.showAnimatedModal), {close: () => {log("CLOSE"); this.showAnimatedModal = false}})
          // ).show(this.showAnimatedModal),
          {style: animatedContainerStyle}
        )
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
