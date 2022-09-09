import { observable, repeat, readFlowProperties, transaction, configuration } from "../flow/Flow";
import { mostAbstractFlow, clearNode } from "./DOMFlowPrimitive";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMNode";
import { FlowTarget } from "../flow/FlowTarget";
import { addDOMFlowTarget, onFinishReBuildingFlow, removeDOMFlowTarget } from "./DOMAnimation";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement, configuration={}){
    super();
    if (!this.key) this.key = configuration.key ? configuration.key : null;
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

    return observable(this, this.key);
  }

  toString() {
    return "[target]" + (this.content ? this.content.toString() : "null");
  }

  setContent(flow) {
    if (this.content === flow) return;
    if (this.content) this.removeContent();
    // log("INTEGRATE");
    this.content = flow;
    this.content.bounds = {width: window.innerWidth, height: window.innerHeight}
    this.content.target = this;
    this.content.ensureEstablished();
    // console.log("integrate----");
    const me = this; 
    if (!this.integrationRepeater) {
      this.integrationRepeater = repeat(this.toString() + ".integrationRepeater", repeater => {
        console.group(repeater.causalityString());
        let index = 0;

        // Get dom node
        if (this.content) {
          const primitive = this.content.getPrimitive(); 
          let domNode;
          if (primitive !== null) {
            domNode = primitive.getDomNode(me);
          }
  
          if (domNode) {
            const existingNode = this.rootElement.childNodes[index]; 
            if (existingNode !== domNode) {
              this.rootElement.insertBefore(domNode, existingNode);
            }
            index++;
          }  
        }
        log(index)
        if (this.modalTarget) {
          const modalNode = this.modalTarget.rootElement; 
          const existingNode = this.rootElement.childNodes[index]; 
          if (existingNode !== modalNode) {
            this.rootElement.insertBefore(modalNode, existingNode);
          }
          index++;
        }
        log(index)
        log(this.rootElement);
        log(this.rootElement.childNodes[0])
        log(this.rootElement.childNodes[1])
        while(this.rootElement.childNodes[index]) {
          log("removing a node")
          this.rootElement.removeChild(this.rootElement.childNodes[index]);
          index++;
        }

        // If inside modal, reactivate mouse events
        // if (this.creator) {
        //   domNode.style.pointerEvents = "auto";
        // }
        console.groupEnd();
      }, {priority: 1});
    }
    onFinishReBuildingFlow();
    configuration.flowBuildNumber++;
    if (this.animate) addDOMFlowTarget(this);
  }

  removeContent() {
    this.content.onRemoveFromFlowTarget();
    this.content = null;
  }

  getModalTarget() {
    if (!this.modalTarget) {
      this.modalTarget = new DOMFlowTarget(this.setupModalDiv(), {creator: this});
    }
    return this.modalTarget; 
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

  dispose() {
    super.dispose();
    this.integrationRepeater.dispose();
    if (this.animate) removeDOMFlowTarget(this);
  }

  elementNode(...parameters) {
    return new DOMElementNode(readFlowProperties(parameters));
  }

  textNode(...parameters) {
    return new DOMTextNode(readFlowProperties(parameters));
  }
}

