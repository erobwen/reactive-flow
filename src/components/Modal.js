import { Flow, transaction } from "../flow/Flow.js";
import { creators } from "../flow/flowBuildContext.js";
import { readFlowProperties, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, addDefaultStyleToProperties, findKeyInProperties } from "../flow/flowParameters";
import { div, div2 } from "../flow.DOMTarget/BasicHtml.js";
import { text } from "./BasicWidgets.js";
const log = console.log;

/**
 * Modal
 */
export function modal(...parameters) {
  const properties = readFlowProperties(parameters);
  findKeyInProperties(properties);
  const result = new Modal(properties);
  return result; 
}

export class Modal extends Flow {
  setProperties({children}) {
    if (children.length !== 1) throw new Error("Modal only accepts a single child!");
    this.content = children[0];
    children.length = 0;
  }

  setState() {
    this.visibleOnFrame = null;
  }

  ensure() {
    this.modalFrame = this.inheritFromParentContainer("modalFrame")
    if (this.isVisible && this.modalFrame) {
      this.visibleOnFrame = this.modalFrame;
      this.modalFrame.openModal(this.content);
    } 
    
    if (!this.isVisible && this.visibleOnFrame) {
      this.modalFrame.closeModal(this.content);
    }
  }

  build() {
    return div({style: {display: "none"}});
  }
}

export function modalFrame(...parameters) {
  // debugger; 
  const properties = readFlowProperties(parameters);
  const result = new ModalFrame(properties);
  return result; 
}

class ModalFrame extends Flow {
  setProperties({style, children}) {
    this.style = style; 
    this.children = children;  
    this.modalFrame = this;
    this.staticContent = children; 
  }

  setState() {
    this.modalContent = null;
    this.modalSubFrame = null;
    this.actualChildren = [...this.children];
  }

  updateChildren() {
    const newChildren = [...this.staticContent]
    if (this.modalSubFrame) newChildren.push(this.modalSubFrame);
    this.actualChildren = newChildren;  
  }

  openModal(modalContent) {
    this.setModalContent(modalContent)
  }

  onDispose() {
    log("DISPOSE!!!!!");
    console.group("onDispose");
    super.onDispose();
    this.setModalContent(null);
    console.groupEnd();
  }

  closeModal(modalContent) {
    if (this.modalContent === modalContent) {
      this.setModalContent(null);
    }
  }

  setStaticContent(staticContent) {
    staticContent = staticContent instanceof Array ? staticContent : [staticContent]
    this.staticContent = staticContent;
    this.updateChildren();
  }

  setModalContent(modalContent) {

    const previousContent = this.modalContent;

    transaction(() => {
      if (previousContent !== modalContent) {
        this.modalContent = modalContent;

        if (!modalContent) {
          // Remove modal
          this.disposeModalSubFrame();
          this.updateChildren();
        } else if (previousContent) {
          // Replace content
          this.modalSubFrame.setStaticContent(modalContent)
          modalContent.modalFrame = this.modalSubFrame;
        } else {
          // New content
          this.ensureModalSubFrame(this.modalContent);
          modalContent.modalFrame = this.modalSubFrame;
          this.updateChildren();
        }
      }
    });
  }

  ensureModalSubFrame(content) {
    if (!this.modalSubFrame) {
      creators.push(this);
      this.modalSubFrame = new ModalFrame(
        content, 
        { 
          style: {
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            pointerEvents: "none"
          }
        }
      ); 
      creators.pop();
    }
  }

  disposeModalSubFrame() {
    if (this.modalSubFrame) {
      transaction(() => {
        this.modalSubFrame.reallyDisposed = true;
        // This is to avoid the old sub frame holding on the the dialog, if we create a new one. 
        this.modalSubFrame.children = [];
        this.modalSubFrame.getPrimitive(this.modalSubFrame.causality.target.parentPrimitive).children = []; 
        this.modalSubFrame.onDispose();
        this.modalSubFrame = null;
      });
    }
  }

  build() {
    if (this.reallyDisposed) throw new Error("CANNOT REBUILD A DISPOSED ONE!!!");
    return new div2({style: this.style, children: this.actualChildren});
    // return new styledDiv("modalFrame", this.style, {children: this.actualChildren});
  }
}
