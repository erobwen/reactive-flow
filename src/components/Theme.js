import { div } from "../flow.DOMTarget/BasicHtml";
import { textInputField as basicTextInputField } from "./BasicWidgets";
import { modernButton } from "./ModernButton"
import { modernTextField } from "./ModernTextField";
import { button as basicButton } from "./BasicWidgets";


export function button(...parameters) {
  // return basicButton.apply(null, parameters); 
  return modernButton.apply(null, parameters);
}


export function textInputField(...parameters) {
  return basicTextInputField.apply(null, parameters);
  // return modernTextField.apply(null, parameters);
}