import { textInputField as basicTextInputField } from "./BasicWidgets";
import { modernButton } from "./ModernButton"
import { modernTextField } from "./ModernTextField";
import { simpleButton } from "./SimpleButton";

export function button(...parameters) {
  return modernButton.apply(null, parameters);
  // return simpleButton.apply(null, parameters);
}


export function textInputField(...parameters) {
  return basicTextInputField.apply(null, parameters);
  // return modernTextField.apply(null, parameters);
}