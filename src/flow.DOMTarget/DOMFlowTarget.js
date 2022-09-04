import { observable, repeat, readFlowProperties, transaction, configuration } from "../flow/Flow";
import { mostAbstractFlow, clearNode } from "./DOMFlowPrimitive";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMNode";
import { FlowTarget } from "../flow/FlowTarget";
import { addDOMFlowTarget, onFinishReBuildingFlow, removeDOMFlowTarget } from "./DOMAnimation";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement, configuration={}){
    super();
    const {creator=null, fullWindow=true} = configuration;
    this.animate = typeof(configuration.animate) === "undefined" ? true : configuration.animate; 
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
          transaction(() => {
            if (this.content) {
              this.content.bounds = {width: window.innerWidth, height: window.innerHeight}
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
  }

  integrate(flow) {
    // log("INTEGRATE");
    this.content = flow;
    this.content.bounds = {width: window.innerWidth, height: window.innerHeight}
    flow.target = this;
    // console.log("integrate----");
    const me = this; 
    const you = flow;
    if (!you.integrationRepeater) {
      you.integrationRepeater = repeat(mostAbstractFlow(you).toString() + ".integrationRepeater", repeater => {
        // log(repeater.causalityString());

        // Get dom node
        const primitive = you.getPrimitive(); 
        let domNode;
        if (primitive !== null) {
          domNode = primitive.getDomNode(me);
        }

        // If inside modal, reactivate mouse events
        if (this.creator) {
          domNode.style.pointerEvents = "auto";
        }

        // Set contents of root
        clearNode(me.rootElement);
        if (domNode) {
          me.rootElement.appendChild(domNode);
          if (this.state.modalDiv) me.rootElement.appendChild(this.state.modalDiv);
        }
      }, {priority: 2});
    }
    onFinishReBuildingFlow();
    configuration.flowBuildNumber++;
    if (this.animate) addDOMFlowTarget(this);
  }

  setupModalDiv() {
    const div = document.createElement("div");
    div.id = "modal-div";
    div.style.position = "absolute";
    div.style.top = 0;
    div.style.left = 0;
    div.style.width = "100%";
    div.style.height = "100%";
    // div.style.opacity = 0;
    div.style.pointerEvents = "none";
    return div;
  }

  setModalFlow(flow, close) {
    // Close existing
    if (this.modalFlow) {
      this.modalFlowClose();
    }

    // Setup modal flow
    this.modalFlow = flow;
    this.modalFlowClose = close; 
    const modalDiv = this.setupModalDiv();
    this.modalTarget = new DOMFlowTarget(modalDiv, {creator: this});
    this.modalTarget.integrate(this.modalFlow);

    // Display modal flow
    this.state.modalDiv = modalDiv;
  }

  removeModalFlow(flow) {
    if (this.modalFlow === flow) {
      // Remove new flow target, hide modal panel
      this.modalFlow = null;
      this.modalFlowClose = null;
      this.modalTarget.dispose();
      this.modalTarget = null;
      this.state.modalDiv = null;
    }
  }

  dispose() {
    super.dispose();
    this.content.integrationRepeater.dispose();
    if (this.animate) removeDOMFlowTarget(this);
  }

  elementNode(...parameters) {
    return new DOMElementNode(readFlowProperties(parameters));
  }

  textNode(...parameters) {
    return new DOMTextNode(readFlowProperties(parameters));
  }

  modalNode(...parameters) {
    return new DOMModalNode(readFlowProperties(parameters));
  }
}

