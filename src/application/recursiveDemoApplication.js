import { observable, world, repeat, when, Flow, finalize, readFlowProperties, getTarget } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text, row, column, button, extractAttributes, wrapper, centerMiddle, modal, numberInputField } from "../flow.components/BasicFlowComponents";

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
export class RecursiveExample extends Flow {
  
  // Constructor: Normally do not override constructor!!! (unless modifying the framework itself)

  // Lifecycle function onEstablish when a flow is first established. The same flow (same parent same key) may be constructed many times, but the first time a flow under a certain parent with a certain key is created, it is established and this event is sent. Use this function to initialize expensive resorces like DB-connections etc. 
  setState() {
    log("SET STATE==========================================================")
    this.count = 1
    this.myModel = observable({
      value: 42 
    });
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
    const moreButton = button({key: "more-button", onClick: () => {loga("More");me.demoComponent.count++}, text: "More"});

    // Early finalization of sub-component, and dimension analysis of it while building 
    console.log(moreButton.dimensions());

    return row(
      rootText,
      button({key: "less-button", onClick: () => {loga("Less");me.demoComponent.count--}, text: "Less"}),
      moreButton,
      numberInputField("Shared state", this.myModel, "value"),
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
      button({key: "toggle-button", onClick: () => { loga("Toggle on"); me.on = !me.on; }, text: "toggle"}),
      text({key: "text", style: {width: "60px"}, text: me.on ? "on" : "off"}),
      text(" Shared state: " + me.myModel.value)
    );
  }
}

function shadePanel(close) {
  const target = getTarget();
  return target.elementNode({
    tagName: "div", 
    classNameOverride: "shadePanel",
    attributes: {
      onclick: () => {close();},
      style:{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%", 
        height: "100%", 
        backgroundColor: "black", 
        opacity: 0.2
      }
    }, 
  });
}


/**
 * Start the demo
 */
  
export function startRecursiveDemo() {
  const root = new RecursiveExample();
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(root);

  // Emulated user interaction.
  // console.log(root.buildRepeater.buildIdObjectMap);
  root.getChild("control-row").getChild("more-button").onClick();
  root.findChild("more-button").onClick();
  root.getChild(["root-list", "rest-list", "first-item", "toggle-button"]).onClick();
}
