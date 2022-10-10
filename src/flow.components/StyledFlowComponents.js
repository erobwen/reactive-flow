import { Flow, readFlowProperties } from "../flow/Flow";
import { div, text } from "./BasicFlowComponents";

export function button(...parameters) { 
  const properties = readFlowProperties(parameters, {singleStringAsText: true});
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
        padding: "4px",
        margin: "4px",
        opacity:  this.disabled ? 0.5 : 1,
        ...this.style
      }, 
      children, 
      onClick: this.onClick
    });
  }
}