import { observable, repeat, transaction, configuration, Flow, enterPriorityLevel, exitPriorityLevel, workOnPriorityLevel } from "../flow/Flow";
import { readFlowProperties, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, addDefaultStyleToProperties, findKeyInProperties } from "../flow/flowParameters";
import { mostAbstractFlow, clearNode } from "./DOMNode";
import { DOMElementNode, DOMModalNode } from "./DOMElementNode";
import { DOMTextNode} from "./DOMTextNode";
import { FlowTarget } from "../flow/FlowTarget";
import { addDOMFlowTarget, removeDOMFlowTarget } from "./DOMAnimation";
import { div } from "../components/basic/BasicWidgets";
import { logMark } from "../flow/utility";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement, configuration={}){
    const {creator=null, fullWindow=true} = configuration;
    super();

    if (!this.key) this.key = configuration.key ? configuration.key : null;
    this.animate = typeof(configuration.animate) === "undefined" ? true : configuration.animate; 
    if (this.animate) addDOMFlowTarget(this);
    this.creator = creator;
    this.rootElement = rootElement;
    if (fullWindow) {
      document.body.style.margin = "0px"; 
      document.body.style.width = "100%"; //window.innerWidth + "px"; 
      document.body.style.height = window.innerHeight + "px";
      this.rootElement.style.width = "100%";
      this.rootElement.style.height = "100%";
      this.rootElement.style.overflow = "hidden";
      window.addEventListener("resize", () => {
        if (document.body.style.height != window.innerHeight + "px")
          document.body.style.height = window.innerHeight + "px";
          logMark("resizing!!!");
          transaction(() => {
            if (this.flow) {
              this.flow.bounds = {width: window.innerWidth, height: window.innerHeight}
            }
          });
      });
    }
    // setTimeout(()=> {
    //   log("DIMENSIONS");
    //   log(this.rootElement.offsetHeight);
    //   log(this.rootElement.offsetWidth);
    //   log("---")
    //   log(this.rootElement.scrollHeight);
    //   log(this.rootElement.scrollWidth);
    // }, 0);
    this.state = observable({
      modalDiv: null
    });

    return observable(this, this.key);
  }

  toString() {
    return "[target]" + (this.flow ? this.flow.toString() : "null");
  }

  setContent(flow) {
    flow.bounds = {width: window.innerWidth, height: window.innerHeight}
    super.setContent(flow);
  }

  dispose() {
    super.dispose();
    if (this.animate) removeDOMFlowTarget(this);
  }

  elementNode(...parameters) {
    const properties = findKeyInProperties(readFlowProperties(parameters)); 
    properties.type = "dom.elementNode";
    return this.create({...properties});
  }

  create(...parameters) {
    const properties = findKeyInProperties(readFlowProperties(parameters));
    switch(properties.type) {
      case "dom.textNode":
        return new DOMTextNode(properties);
      case "dom.elementNode": 
        return new DOMElementNode(properties);
    }
  }
}





  // setupModalDiv() {
  //   const div = document.createElement("div");
  //   div.id = "modal-div";
  //   div.style.position = "absolute";
  //   div.style.top = 0;
  //   div.style.left = 0;
  //   div.style.width = "100%";
  //   div.style.height = "100%";
  //   // div.style.opacity = 0;
  //   div.style.pointerEvents = "none";
  //   return div;
  // }

  // setModalFlow(flow, close) {
  //   // Close existing
  //   if (this.modalFlow) {
  //     this.modalFlowClose();
  //   }

  //   // Setup modal flow
  //   this.modalFlow = flow;
  //   this.modalFlowClose = close; 
  //   const modalDiv = this.setupModalDiv();
  //   this.modalTarget = new DOMFlowTarget(modalDiv, {creator: this});
  //   this.modalTarget.setContent(this.modalFlow);

  //   // Display modal flow
  //   this.state.modalDiv = modalDiv;
  // }

  // removeModalFlow(flow) {
  //   if (this.modalFlow === flow) {
  //     // Remove new flow target, hide modal panel
  //     this.modalFlow = null;
  //     this.modalFlowClose = null;
  //     this.modalTarget.dispose();
  //     this.modalTarget = null;
  //     this.state.modalDiv = null;
  //   }
  // }
