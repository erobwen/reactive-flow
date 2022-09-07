import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, row, button, flexAutoStyle } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { SuperSimple } from "./superSimple";
import { AnimationExample } from "./animationExample";
import { ComplexForm, initialData } from "./complexFormApplication";
import { HelloWorld } from "./helloWorldApplication";
import { DemoComponent } from "./recursiveAndModalDemoApplication";
import { ProgrammaticReactiveLayout } from "./programmaticReactiveLayout";
import { ToggleView } from "./toggleExample";

const log = console.log;

/**
 * Flow definitions
 */


// A very simple view component
export class Demo extends Flow {
  setState() {
    // Example of building static child-flow components in the setState. Remember to add them to onEstablish/onDispose
    this.components = {
      "Hello World": new HelloWorld(),
      "Animation Example": new AnimationExample({items: ["Foo", "Fie", "Fum", "Bar", "Foobar", "Fiebar", "Fumbar"]}),
      "Complex Form Example": new ComplexForm({initialData}),
      // "Super Simple": new SuperSimple({model: observable({value: ""})}),
      "Recursive and Modal Demo": new DemoComponent(),
      "Programmatic Reactive Layout": new ProgrammaticReactiveLayout(),
      "Toggle": new ToggleView()
    }

    // this.choosen = this.components["Animation Example"];
    this.choosen = this.components["Complex Form Example"];
    // this.choosen = this.components["Hello World"];
  }
  
  onEstablish() {
    super.onEstablish();
    for (let name in this.components) {
      this.components[name].onEstablish();
    }
  }
  
  onDispose() {
    super.onDispose();
    for (let name in this.components) {
      this.components[name].onDispose();
    }
  }
  
  build() {
    function buildButton(demo, name) { // Extra function to get a stack frame that provides variables to the lambda function. 
      return button(name, {onClick: () => {demo.choosen =  demo.components[name]}})
    }

    const buttons = [];
    for (let name in this.components) {
      buttons.push(
        buildButton(this, name), 
      )
    }

    const leftColumn = column(
      buttons,
      {key: "left-column", 
       style: {...flexAutoStyle, borderRight: "1px", borderRightStyle: "solid", backgroundColor: "lightgray"}}
    );
    this.choosen.bounds = { width: this.bounds.width - leftColumn.dimensions().width, height: this.bounds.height};

    return row(
      leftColumn, 
      this.choosen, 
      {style: {height: "100%"}}
    )
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startDemo() {
  const demo = new Demo({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}
