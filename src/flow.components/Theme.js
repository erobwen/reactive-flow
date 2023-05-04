import { div } from "./BasicHtml";
import { textInputField as basicTextInputField } from "./BasicWidgets";
import { modernButton } from "./ModernButton"
import { modernTextField } from "./ModernTextField";
import { simpleButton } from "./SimpleButton";

export function button(...parameters) {
  // return modernButton.apply(null, parameters);
  // const button = simpleButton.apply(null, parameters);
  const button = modernButton.apply(null, parameters);
  return button; 
  // const wrapper = div(button);
  // wrapper.button = button; 
  // return wrapper; 
}


export function textInputField(...parameters) {
  return basicTextInputField.apply(null, parameters);
  // return modernTextField.apply(null, parameters);
}