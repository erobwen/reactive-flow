import { findTextKeyAndOnClickInProperties, Flow, readFlowProperties } from "../flow/Flow";
import { div } from "./BasicHtml";
import { text } from "./BasicWidgets";
import { modernButton } from "./ModernButton";

export function simpleButton(...parameters) { 
  const properties = findTextKeyAndOnClickInProperties(readFlowProperties(parameters));
  return new ModernButton(properties);
};

export class ModernButton extends Flow {
  build() {
    let children; 
    if (this.children) children = this.children; 
    if (this.text) children = [text(this.text)]; // TODO: Breaks if not in a list! 
    return div({
      key: "div",
      style: {
        textAlign: "center", 
        borderRadius: "5px", 
        borderStyle: "solid", 
        borderWidth: "1px", 
        borderColor: "rgb(204, 204, 204)", 
        backgroundColor: "rgb(250, 250, 250)", 
        padding: "10px",
        opacity:  this.disabled ? 0.5 : 1,
        ...this.style,
        margin: "10px",
      }, 
      children, 
      onClick: this.onClick
    });
  }
}