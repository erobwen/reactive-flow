import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { text } from "../components/basic/BasicWidgets";
import { column, filler, fillerStyle, row } from "../components/Layout";
import { modernButton } from "../components/ModernButton";
import { animatedContainerStyle, borderStyle, panelStyle } from "../components/Style";
;
import { button } from "../components/Theme";
import { startExperiment, inExperiment } from "..";
import { div } from "../flow.DOMTarget/BasicHtml";


const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SimpleMoveAnimation extends Flow {
  setState() {
    this.left = false;
    this.showButton = false;
    this.button = button(
      "button", "Text", 
      this.move.bind(this),
      {
        ripple: true,
        style: {
          margin: "10px",
          color: "green",
          width: "150px"
        }
      }
    );
  }

  onDispose() {
    this.button.onDispose();
  }

  move() {
    this.left = !this.left;

    // setTimeout(() => {
    //   startExperiment();
    // }, 1000);

    // setTimeout(() => {
    //   log("SETTING TEXT");
    //   log(this.button);
    //   log(this.button);
    //   this.button.hover = false;  

    //   // let color = this.button.style.color;  
    //   // color = color === "red" ? "green" : "red"; 
    //   // log(this.button.style = {...this.button.style, color});
    //   // this.button.text = this.button.text + "!"       
    // }, 2500);
  }

  build() {
    // const button = new modernButton(
    // const button = div("wrapper", this.button, {animate: true});
    const movingButton = this.button; 
    movingButton.animate = true; // Force property...  

    return column(
      row(
        button("Move", this.move.bind(this)),
        button("Experiment", () => startExperiment()),
        filler(),
        {style: {...animatedContainerStyle, width: "150px"}}
      ),
      div({style: {height: "200px"}}),
      row(
        column(
          movingButton.show(this.left),
          {style: {...animatedContainerStyle, width: "150px"}}
        ),
        div({style: {width: "200px"}}),
        column(
          // text("Some Text", {animate: true, style: borderStyle}).show(!this.left),
          movingButton.show(!this.left),
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
export function startSimpleMoveAnimation() {
  const simple = new SimpleMoveAnimation()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(simple)
}
