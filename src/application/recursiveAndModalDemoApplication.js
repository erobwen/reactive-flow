import { observable, world, repeat, when, Flow, finalize } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text, row, column, button } from "../flow.components/BasicFlowComponents";

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
export class DemoComponent extends Flow {
  
  // Constructor: Normally do not override constructor!!! (unless modifying the framework itself)

  // Lifecycle function onEstablish when a flow is first established. The same flow (same parent same key) may be constructed many times, but the first time a flow under a certain parent with a certain key is created, it is established and this event is sent. Use this function to initialize expensive resorces like DB-connections etc. 
  setState() {
    this.count = 1
    this.myModel = observable({
      value: 42 
    })
  }

  disposeState() {
      // Lifecycle function disposeState when parent no longer creates a child with the same key/class. Can be used to deallocate state-related resources.
  }

  provide() {
    // Give all grand-children access to myModel, they will get this as a property of their own.
    return ["myModel"];
  }

  // Lifecycle function build is run reactivley on any change, either in the model or in the view model. It reads data from anywhere in the model or view model, and the system automatically infers all dependencies.
  build() {
    
    return (
      column(
        new ControlRow("control-row", {demoComponent: this}),
        new List("root-list", {maxCount: this.count, count: 1})
      )
    );
  }
}
  
export class ControlRow extends Flow {
  setProperties({demoComponent}) {
    this.demoComponent = demoComponent;
  }
      
  build() {
    const me = this;    
    const rootText = text({ key: "root-text", text: "My Recursive List:"});
    const moreButton = button("more-button", {onClick: () => {loga("More");me.demoComponent.count++}, text: "More"});

    // Early finalization of sub-component, and dimension analysis of it while building 
    console.log(finalize(moreButton).getPrimitive().dimensions());

    return row(
      rootText,
      button("less-button", {onClick: () => {loga("Less");me.demoComponent.count--}, text: "Less"}),
      moreButton,
      {style: {padding: "10px"}} // Reactive programmatic styling! 
    )
  }
}
  
export class List extends Flow {
  // This is the function setProperties where you declare all properties that a parent can set on its child. This is optional, but is a good place to define default values, modify values given by parent, or document what properties that the component needs.   
  setProperties({maxCount, count}) {
    this.maxCount = maxCount;
    this.count = count;
  }

  build() {
    const children = [];
    children.push(new Item("first-item", {text: "Item " +  this.count}));
    if (this.count < this.maxCount) {
      children.push(new List("rest-list", {maxCount: this.maxCount, count: this.count + 1}));
    }
    return column("list-column", {style: {marginLeft: "10px", marginBottom: "2px", marginRight: "2px", borderWidth: "1px", borderStyle: "solid"}, children: children});
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text;
  }
  
  setState() {
    // This is the place to define view model variables. In this case the "on" property is defined. 
    this.on = true;
    this.showModal = false;     
  }
 
  build() {
    const me = this; 

    function close() {
      log("Closing modal...");
      me.showModal = false; 
    }

    return row("item-row",  // row is a primitive flow that can be converted into a DOM element by the DomFlowTarget module. However, a 1:1 mapping to HTML can also be possible, by using a Div flow for example. 
      text({ key: "item-text", text: me.text}),
      button("toggle-button", {onClick: () => { loga("Toggle on"); me.on = !me.on; }, text: "toggle"}),
      text( { key: "text", style: {width: "60px"}, text: me.on ? "on" : "off"}),
      button("modal-button", {onClick: () => { loga("Show modal"); me.showModal = true; }, text: "modal"}),
      !me.showModal ? null : this.target.modalNode("modal-node", {close},
        button("close-button", {
          text: "close " + me.text + " modal",
          style: {opacity: 1},
          onClick: () => {loga("Close modal");close()},
        })
      ) // text( { key: "item-text", text: me.text})
    );
  }
}


  
export function startRecursiveAndModalDemo() {
  const root = new DemoComponent({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();

  // Emulated user interaction.
  console.log(root.buildRepeater.buildIdObjectMap);
  root.getChild("control-row").getChild("more-button").onClick();
  root.findChild("more-button").onClick();
  root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
}
