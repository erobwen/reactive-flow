import { observable, world, repeat, when, Flow, finalize, readFlowProperties, getTarget, creators } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text, row, column, button } from "../flow.components/BasicFlowComponents";

const log = console.log;
const loga = (action) => {
  log("-----------" + action + "-----------");
}


/**
 * Modal example
 */
export class ModalExample extends Flow {
  // Lifecycle function build is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
  setProperties({portal}) {
    this.name = "Modal Example";
    this.portal = portal;
    log(this);
  }

  setState() {
    this.modal = null;
  }
  
  showModal() {
    console.group("CREATE MODAL TEXT");
    creators.push(this);
    this.modal = text("modal!");
    // this.modal.target = this.target; 
    creators.pop();
    console.groupEnd();
    this.inheritFromContainer("modalFrame").openModal(this.modal);
  }

  build() {

    return (
      column(
        text("modal demo"),
        row(
          button("Open Modal", ()=> {this.showModal()}),
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
