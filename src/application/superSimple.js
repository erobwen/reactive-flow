import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text } from "../flow.components/BasicWidgets";
import { column, filler, row } from "../flow.components/Layout";
import { modernButton } from "../flow.components/ModernButton";
import { animatedContainerStyle, borderStyle, panelStyle } from "../flow.components/Style";
import { simpleButton } from "../flow.components/SimpleButton";
import { div } from "../flow.components/Basic";
import { button } from "../flow.components/Theme";


const log = console.log;

export let inEperiment = false; 

/**
 * Minimalistic component used for experiments. 
 */
export class SuperSimple extends Flow {
  setState() {
    this.left = false;
    this.showButton = false;
    this.button = new button(
      "button", "Text", 
      this.move.bind(this),
      {
        animate: true,
        ripple: true,
        style: {
          color: "red"
        }
      }
    );
  }

  onDispose() {
    this.button.onDispose();
  }

  move() {
    this.left = !this.left;

    setTimeout(() => {
      inEperiment = true; 
    }, 1000);

    setTimeout(() => {
      log("SETTING TEXT");
      log(this.button);
      log(this.button.button);
      let color = this.button.button.style.color;  
      color = color === "red" ? "green" : "red"; 
      log(this.button.button.style = {...this.button.button.style, color});
      // this.button.button.text = this.button.button.text + "!"       
    }, 2500);
  }

  build() {
    // const button = new modernButton(
    const button = this.button; 

    return column(
      filler(),
      row(
        column(
          div("wrapper", button).show(this.left), 
          filler(),
          {style: {...animatedContainerStyle, width: "150px"}}
        ),
        div({style: {width: "200px"}}),
        column(
          // text("Some Text", {animate: true, style: borderStyle}).show(!this.left),
          div("wrapper", button).show(!this.left), 
          filler(), 
          {style: {...animatedContainerStyle, width: "150px"}}
        ), 
        filler(), 
        column(
          simpleButton("Move", this.move.bind(this)),
          filler(),
          {style: {...animatedContainerStyle, width: "150px"}}
        ), 
        {style: animatedContainerStyle}
      ),
      filler(),
      {style: {...animatedContainerStyle, fontSize: "40px", padding: "20px"}}
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSuperSimple() {
  const simple = new SuperSimple()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
