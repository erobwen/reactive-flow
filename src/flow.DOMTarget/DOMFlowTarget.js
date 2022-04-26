import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";
import { mostAbstractFlow, clearNode } from "./DOMFlowTargetPrimitive";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMNode";
import { FlowTarget } from "../flow/FlowTarget";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement){
    super();
    this.rootElement = rootElement;
    this.setupRootAndModalElement();
  }

  setupRootAndModalElement() {
    this.rootElement.style.width = "100%";
    this.rootElement.style.height = "100%";
    this.modalDiv = document.createElement("div");
    this.modalDiv.id = "modal-div";
    this.modalDiv.style.position = "absolute";
    this.modalDiv.style.top = 0;
    this.modalDiv.style.left = 0;
    this.modalDiv.style.width = "100%";
    this.modalDiv.style.height = "100%";
    // this.modalDiv.style.opacity = 0;
    this.modalDiv.style.pointerEvents = "none";
  }

  integrate(flow) {
    log(this);
    this.content = flow;
    flow.target = this;
    // console.log("integrate----");
    const me = this; 
    const you = flow;
    if (!you.integrationRepeater) {
      you.integrationRepeater = repeat(mostAbstractFlow(you).toString() + ".integrationRepeater", repeater => {
        log(repeater.causalityString());
        const primitive = you.getPrimitive(); 
        let domNode;
        if (primitive !== null) {
          domNode = primitive.getDomNode(me);
        }
        // log(domNode)
        domNode.style.pointerEvents = "auto"; // If inside modal
        clearNode(me.rootElement);
        if (domNode) {
          log("Adding back")
          log(domNode)
          me.rootElement.appendChild(domNode);
          me.rootElement.appendChild(this.modalDiv);
        }
      });
    }
  }

  dispose() {
    log("dispose target")
    log(this.rootElement)
    clearNode(this.rootElement);
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

