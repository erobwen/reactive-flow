import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, row, button, flexAutoStyle } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { SuperSimple } from "./superSimple";
import { AnimationExample } from "./animationExample";
import { ComplexForm, initialData } from "./complexFormApplication";
import { HelloWorld } from "./helloWorldApplication";
import { DemoComponent } from "./recursiveAndModalDemoApplication";
import { ProgrammaticReactiveLayout } from "./programmaticReactiveLayout";

const log = console.log;

/**
 * Flow definitions
 */


// A very simple view component
export class Demo extends Flow {
  setState() {
    // Example of building static child-flow components in the setState. Remember to add them to onEstablish/onDispose
    this.components = {
      "Super Simple": new SuperSimple({model: observable({value: ""})}),
      "Animation Example": new AnimationExample({items: ["Foo", "Fie", "Fum", "Bar", "Foobar", "Fiebar", "Fumbar"]}),
      "Complex Form Example": new ComplexForm({initialData}),
      "Hello World": new HelloWorld(),
      "Recursive and Modal Demo": new DemoComponent(),
      "Programmatic Reactive Layout": new ProgrammaticReactiveLayout()
    }

    this.choosen = this.components["Complex Form Example"];
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
      {style: {...flexAutoStyle, borderRight: "1px", borderRightStyle: "solid", backgroundColor: "lightgray"}}
    );
    log("BUILD DEMO")
    log(this.bounds);
    log(leftColumn.dimensions());
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
