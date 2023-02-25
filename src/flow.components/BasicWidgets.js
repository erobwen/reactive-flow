import { readFlowProperties, trace, getTarget, Flow, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, findKeyInProperties, transaction, creators } from "../flow/Flow.js";
import { extractAttributes } from "./Basic.js";
import { filler, row } from "./Layout.js";
import { xbutton } from "./ModernButton.js";
const log = console.log;

/**
 * Basic widgets
 */

export function text(...parameters) {
  let properties = readFlowProperties(parameters);
  findTextAndKeyInProperties(properties);
  const attributes = extractAttributes(properties);

  const textProperties = {
    key: properties.key ? properties.key + ".text" : null,
    text: properties.text,
  }
  const textCut = textProperties.text.substring(0, 20) + "...";

  return getTarget().elementNode(properties.key ? properties.key + ".label" : null, 
    {
      classNameOverride: "text[" + textCut + "]",
      tagName:"label",
      attributes, 
      children: [getTarget().textNode(textProperties)], 
      ...properties 
    });
}

export function checkboxInputField(label, getter, setter, ...parameters) {
  return inputField("checkbox", label, getter, setter, ...parameters);
}

export function numberInputField(label, getter, setter, ...parameters) {
  return inputField("number", label, getter, setter, ...parameters);
}

export function textInputField(label, getter, setter, ...parameters) {
  return inputField("text", label, getter, setter, ...parameters);
}

export function inputField(type, label, getter, setter, ...parameters) {
  let error;
  if (typeof(getter) === "object" && typeof(setter) === "string") {
    const targetObject = getter;
    const targetProperty = setter; 
    getter = () => targetObject[targetProperty]
    setter = newValue => { log(newValue); targetObject[targetProperty] = (type === "number") ? parseInt(newValue) : newValue;}
    error = targetObject[targetProperty + "Error"];
  }
  const properties = findKeyInProperties(readFlowProperties(parameters));

  const inputAttributes = extractAttributes(properties.inputProperties);
  delete properties.inputProperties;
  if (type === "number") {
    if (!inputAttributes.style) inputAttributes.style = {};
    if (!inputAttributes.style.width) inputAttributes.style.width = "50px"; 
  } 
  const attributes = {
    oninput: event => setter(type === "checkbox" ? event.target.checked : event.target.value),
    value: getter(),
    checked: getter(),
    type,
    style: {
      backgroundColor: error ? "rgba(255, 240, 240, 255)" : "white",
      borderColor: "rgba(200, 200, 200, 20)", //error ? "red" : 
      borderStyle: "solid",
      borderWidth: "1px" 
    },
    ...inputAttributes
  };
  
  const children = [getTarget().elementNode({
    key: properties.key, 
    classNameOverride: type + "InputField", 
    tagName: "input", 
    attributes, 
    onClick: properties.onClick})];
  const labelChild = text(label, {style: {paddingRight: "4px"}, ...properties.labelProperties}); 
  if (type === "checkbox") {
    children.push(labelChild);
  } else {
    children.unshift(filler());
    children.unshift(labelChild);
  }
  
  return row({style: {padding: "4px", ...properties.style}, children, ...properties}, );
}

// export const button = xbutton;

export function button(...parameters) { 
  let result; 
  const properties = readFlowProperties(parameters);
  findTextKeyAndOnClickInProperties(properties);
  const attributes = extractAttributes(properties);
  if (properties.disabled) attributes.disabled = true; 

  // Inject debug printout in click.
  if (trace && properties.onClick) {
    const onClick = properties.onClick;
    properties.onClick = () => {
      log("clicked at: " + JSON.stringify(result.getPath()));
      onClick();
    }  
  }

  // Autogenerate child text node from string.
  let children; 
  if (properties.text && !properties.children) {
    children = [getTarget().textNode(properties.key ? properties.key + ".button-text" : null, {text: properties.text})]; 
  } else {
    children = properties.children;
  } 
  result = getTarget().elementNode(properties.key, {classNameOverride: "button", tagName: "button", attributes, children, onClick: properties.onClick, animate: properties.animate});
  return result; 
};