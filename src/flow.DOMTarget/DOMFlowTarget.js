import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";
import { mostAbstractFlow, clearNode } from "./DOMFlowTargetPrimitive";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMNode";
import { FlowTarget } from "../flow/FlowTarget";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement, creator=null){
    super();
    this.creator = creator;
    this.rootElement = rootElement;
    this.rootElement.style.width = "100%";
    this.rootElement.style.height = "100%";
    this.state = observable({
      modalDiv: null
    });
  }

  integrate(flow) {
    this.content = flow;
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
      });
    }
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
    this.modalTarget = new DOMFlowTarget(modalDiv, this);
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
    this.content.integrationRepeater.dispose();
  }

  elementNode() {
    return new DOMElementNode(readFlowProperties(arguments));
  }

  textNode() {
    return new DOMTextNode(readFlowProperties(arguments));
  }

  modalNode() {
    return new DOMModalNode(readFlowProperties(arguments));
  }
}

