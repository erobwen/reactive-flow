import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { panel, text } from "../components/basic/BasicWidgets";
import { column, filler, row, centerMiddle, columnStyle} from "../components/Layout";
import { modernButton } from "../components/ModernButton";
import { animatedContainerStyle, borderStyle, panelStyle } from "../components/Style";
import { div, span } from "../flow.DOMTarget/BasicHtml"
;
import { button } from "../components/Theme";
import { suitcaseIcon } from "../components/Icons";


const log = console.log;

/**
 * Minimalistic component used for experiments. 
 */
export class SingleStaticWidget extends Flow {
  setState() {}

  build() {
  
    // const singleWidget = text("Hello");

    // const singleWidget = button(
    //   suitcaseIcon(), 
    //   span("Add luggage", {style: {marginLeft: "5px"}}),
    //   () => { log("Pressed!") }
    // );

    const singleWidget = panel(text("in a panel"));
  
    return centerMiddle(singleWidget);
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startSingleStaticWidget() {
  const singleWidget = new SingleStaticWidget()  
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(singleWidget)
}
