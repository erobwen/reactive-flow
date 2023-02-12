import { observable, world, repeat, when, Flow, finalize, readFlowProperties, getTarget } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text, row, column, button, extractAttributes, wrapper, centerMiddle, modal, portalEntrance } from "../flow.components/BasicFlowComponents";

const log = console.log;
const loga = (action) => {
  log("-----------" + action + "-----------");
}


/**
 * This is a demo-application that showcases some of the principles of Flow. 
 * Please read the comments for a tour over what features exists and how they work.  
 * 
 * This simple program just demonstrates the recursive and state preserving capabilities 
 * of Flow. A number of components are created recursivley according to the "count" state.
 * And each component has its own state that can be toggled on/off. Note that the state of each individual 
 * component is maintained, while the whole recursive chain of components are re-built. 
 * Also, open and expand the view-elements debug panel in Chrome, to verify minimal updates
 * to the DOM when the UI is rebuilt.  
 */
export class ModalAndPortalExample extends Flow {
  // Lifecycle function build is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
  setParameters({portal}) {
    this.portal = portal;
  }
  
  setState() {
    this.name = "Modal and Portal Example";
    this.showPortal = true;
  }

  build() {
    return (
      column(
        button("toggle-button", "Toggle", ()=> {this.showPortal = !this.showPortal}),
        text("portal demo"), 
        portalEntrance(
          {
            portalExit: this.portal, 
            key: "portalEntrance", 
            portalContent: text("text in portal", {key: "content", animate: true})
          })
          .show(this.showPortal)
      )
    );
  }
}
  

/**
 * Start the demo
 */
  
export function startModalDemo() {
  const root = new ModalAndPortalExample();
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(root);
}
