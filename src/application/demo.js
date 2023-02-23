import { observable, Flow, flow, repeat, creators } from "../flow/Flow";
import { text, column, row, button, flexAutoStyle, div, filler, columnStyle, modalFrame } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { SuperSimple } from "./superSimple";
import { AnimationExample } from "./animationExample";
import { ComplexForm, initialData } from "./complexFormApplication";
import { HelloWorld } from "./helloWorldApplication";
import { RecursiveExample } from "./recursiveDemoApplication";
import { ProgrammaticReactiveLayout } from "./programmaticReactiveLayout";
import { ToggleView } from "./toggleExample";
import { PortalExample } from "./portalDemo";
import { ModalExample } from "./modalDemo";
import { portalExit } from "../flow.components/PortalAndModal";

const log = console.log;

/**
 * Flow definitions
 */


// A very simple view component
export class Demo extends Flow {
  setState() {
    this.leftColumnPortal = portalExit({key: "portal", style: {...columnStyle, overflow: "visible"}});

    // Example of building static child-flow components in the setState. Remember to add them to onEstablish/onDispose
    this.components = [
      new HelloWorld({key: "helloWorld"}),
      new AnimationExample({key: "animationExample", items: ["Foo", "Fie", "Fum", "Bar", "Foobar", "Fiebar", "Fumbar"]}),
      new ComplexForm({key: "complexForm", initialData}),
      new PortalExample({key: "portalExample", portal: this.leftColumnPortal}),
      new ModalExample({key: "modalExample", portal: this.leftColumnPortal}),
      // "Super Simple": new SuperSimple({model: observable({value: ""})}),
      new RecursiveExample({key: "recursiveDemo", name: "RecursiveExample"})
      // "Programmatic Reactive Layout": new ProgrammaticReactiveLayout(),
      // "Toggle": new ToggleView()
    ];
    
    for (let component of this.components) {
      component.onEstablish();
    }

    // this.choosen = this.components.find(component => component.key === "portalExample");
    // this.choosen = this.components.find(component => component.key === "complexForm");
    this.choosen = this.components.find(component => component.key === "modalExample");
    // this.choosen = this.components["Recursive and Modal Demo"];
    // this.choosen = this.components["Hello World"];

  }
  
  disposeState() {
    super.onDispose();
    for (let name in this.components) {
      this.components[name].onDispose();
    }
    this.leftColumnPortal.onDispose();
    this.leftColumnPortal.dispose();
  }

  provide() {
    return ["leftColumnPortal"];
  }

  buildButton(component) { // Extra function to get a stack frame that provides variables to the lambda function. 
    return button(component.name, {onClick: () => {this.choosen = component}})
  }

  build() {
    log("BUILD DEMO -----------------------------------------------")
    log(creators.length)
    const buttons = [];
    for (let component of this.components) {
      buttons.push(
        this.buildButton(component), 
      )
    }
    buttons.push(this.leftColumnPortal);
    buttons.push(filler());

    const leftColumn = column(
      buttons,
      {key: "left-column", 
       style: {...flexAutoStyle, borderRight: "1px", borderRightStyle: "solid", backgroundColor: "lightgray", overflow: "visible"}}
    );
    this.choosen.bounds = { width: this.bounds.width - leftColumn.dimensions().width, height: this.bounds.height};
    // this.choosen.leftColumnPortal =  this.leftColumnPortal;  

    return modalFrame(
      row(
        leftColumn, 
        this.choosen, 
        {style: {height: "100%", overflow: "visible"}}
      )  
    )
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startDemo() {
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(
    new Demo()
  );
}
