import { text } from "../components/basic/BasicWidgets";
import { centerMiddle, column, fitStyle } from "../components/Layout";
import { modernButton } from "../components/ModernButton";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget";
import { Flow } from "../flow/Flow";

const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
class ButtonTest extends Flow {
  setState() {
    this.pressed = false; 
  }

  build() {
    return centerMiddle(
      modernButton("test", "Test", ()=> { this.pressed = !this.pressed}, {pressed: this.pressed, style: {width: "100px"}}),
      {style: {...fitStyle, fontSize: "40px", padding: "20px"}}
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function buttonTest() {
  const test = new ButtonTest()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(test)
}
