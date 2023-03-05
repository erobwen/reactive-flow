import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { button, text } from "../flow.components/BasicWidgets";
import { column, filler, row } from "../flow.components/Layout";
import { modernButton } from "../flow.components/ModernButton";
import { animatedContainerStyle, panelStyle } from "../flow.components/Style";
import { simpleButton } from "../flow.components/SimpleButton";


const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SuperSimple extends Flow {
  setState() {
    this.left = true;
    this.button = new simpleButton(
      "button", "Text", 
      this.move.bind(this),
      {
        animate: true,
        ripple: false
      }
    );
  }

  onDispose() {
    this.button.onDispose();
  }

  move() {
    this.left = !this.left;
    setTimeout(() => {
      log(this.button.domNode);
      log(this.button)
      const primitive = this.button.getPrimitive();
      const domNode = primitive.domNode;
      const animation = primitive.getAnimation();
      animation.recordOriginalBoundsAndStyle(primitive.domNode);
      const measures = animation.getOriginalMeasures(primitive.domNode);
      log(measures);
      log(domNode.originalBounds);
      log(domNode.originalBounds.top);
      log(domNode.originalBounds.left);
    }, 2500);
  }

  build() {
    // const button = new modernButton(
    const button = this.button; 

    return row(
      column(
        button.show(this.left), 
        filler(),
        {style: animatedContainerStyle}
      ),
      filler(),
      column(
        button.show(!this.left), 
        filler(), 
        {style: animatedContainerStyle}
      ), 
      filler(), 
      column(
        simpleButton("Move", this.move.bind(this)),
        filler()
      )
      // {style: {fontSize: "40px", padding: "20px"}}
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
