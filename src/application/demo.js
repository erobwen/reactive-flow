import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, row, button } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { SuperSimple } from "./superSimple";
import { AnimationExample } from "./animationExample";
import { ComplexForm, serverData } from "./complexFormApplication";

const log = console.log;

/**
 * Flow definitions
 */


// A very simple view component
export class Demo extends Flow {
  setState() {
    // Example of building static child-flow components in the setState. Remember to add them to onEstablish/onDispose
    this.superSimple = new SuperSimple({model: observable({value: ""})});
    this.animationExample = new AnimationExample({items: ["Foo", "Fie", "Fum", "Bar", "Foobar", "Fiebar", "Fumbar"]});
    this.complexFormApplication = new ComplexForm({serverData});
    this.choosen = this.complexFormApplication;
  }
  
  onEstablish() {
    super.onEstablish();
    this.animationExample.onEstablish();
    this.complexFormApplication.onEstablish();
  }
  
  onDispose() {
    super.onDispose();
    this.animationExample.onDispose();
    this.complexFormApplication.onDispose();
  }
  
  build() {
    return row(
      column(
        button({text: "Super Simple", onClick: () => { this.choosen = this.superSimple; this.superSimple.timedChanges() }}), 
        button({text: "Animation Example", onClick: () => { this.choosen = this.animationExample }}),
        button({text: "Complex Form Example", onClick: () => { this.choosen = this.complexFormApplication }}),
        {style: {borderRight: "1px", borderRightStyle: "solid", backgroundColor: "lightgray"}}
      ),
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
