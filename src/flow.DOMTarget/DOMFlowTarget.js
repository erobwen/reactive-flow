import { observable, repeat, readFlowProperties, transaction, configuration, Flow } from "../flow/Flow";
import { mostAbstractFlow, clearNode } from "./DOMFlowPrimitive";
import { DOMElementNode, DOMTextNode, DOMModalNode } from "./DOMNode";
import { FlowTarget } from "../flow/FlowTarget";
import { addDOMFlowTarget, onFinishReBuildingDOM, onFinishReBuildingFlow, removeDOMFlowTarget } from "./DOMAnimation";
import { div } from "../flow.components/BasicFlowComponents";

const log = console.log;

export class DOMFlowTarget extends FlowTarget {
  constructor(rootElement, configuration={}){
    const {creator=null, fullWindow=true} = configuration;
    super();

    if (!this.key) this.key = configuration.key ? configuration.key : null;
    this.animate = typeof(configuration.animate) === "undefined" ? true : configuration.animate; 
    if (this.animate) addDOMFlowTarget(this);
    this.contentHolder = new DOMElementNode({targetDomNode: rootElement, tagName: rootElement.tagName})
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

  setContent(children) {
    this.children = children;

    this.updateContentHolder();
  }

  updateContentHolder() {
    let children = [];
    if (this.children instanceof Array) {
      this.children.forEach(child => children.push(child));
    } else if (this.children instanceof Flow){
      children.push(this.children);
    }
    if (this.modalPortal) {
      children.push(this.modalPortal);
    }
    children.forEach(
      child => {
        child.bounds = {width: window.innerWidth, height: window.innerHeight}
        child.target = this;  
        child.ensureEstablished();
      }
    )    
    this.contentHolder.children = children;
    this.contentHolder.ensureBuiltRecursive();
    onFinishReBuildingFlow();
    configuration.flowBuildNumber++;
    this.contentHolder.ensureDomNodeBuilt();
    onFinishReBuildingDOM();
  }

  removeContent() {
    log("REMOVE CONTENT---------------------------------------------------------------====================================")
    this.children = null; 
    this.updateContentHolder();
  }

  getModalTarget() {
    if (!this.modalTarget) {
      this.modalPortal = new DOMElementNode({
        isPortal: true,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          // pointerEvents = "none"
        }
      });
      this.modalTarget = new DOMFlowTarget(this.modalPortal.ensureDomNodeBuilt(), {creator: this});
      this.updateContentHolder();
    }
    return this.modalTarget; 
  } 

  dispose() {
    super.dispose();
    this.modalPortal.dispose();
    this.modalTarget.dispose();
    if (this.animate) removeDOMFlowTarget(this);
  }

  elementNode(...parameters) {
    return new DOMElementNode(readFlowProperties(parameters));
  }

  textNode(...parameters) {
    return new DOMTextNode(readFlowProperties(parameters));
  }
}




    // if (this.contentHolder.children) {
    //   this.contentHolder.getChildren().forEach(child => child.onRemoveFromFlowTarget()) 
    // }

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
