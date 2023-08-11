import { div } from "../../flow.DOMTarget/BasicHtml";
import { textInputField as basicTextInputField } from "../basic/BasicWidgets";
import { button as basicButton } from "../basic/BasicWidgets";
import { modernButton } from "../modern/ModernButton";


export function button(...parameters) {
  // return basicButton.apply(null, parameters); 
  return modernButton.apply(null, parameters);
}


export function textInputField(...parameters) {
  return basicTextInputField.apply(null, parameters);
  // return modernTextField.apply(null, parameters);
}