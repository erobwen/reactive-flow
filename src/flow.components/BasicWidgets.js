import { readFlowProperties, trace, getTarget, Flow, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, findKeyInProperties, transaction, creators, callback } from "../flow/Flow.js";
import { div, extractAttributes, extractChildStyles, extractProperty } from "./BasicHtml.js";
import { filler, row } from "./Layout.js";
import { modernButton } from "./ModernButton.js";
const log = console.log;

const lineHeight = "20px"; 

export let basicWidgetTheme = {
  lineHeight: "20px",
  rowGap: "10px", 
  text: {
    style: {
      margin: "5px",
      lineHeight
    }
  },
  inputField: {

  },
  fontSize: 20,
}



/**
 * Basic widgets
 */


/**
 * Text macro flow
 * 
 * arguments: key, text, animate, + all HTML attributes 
 */
export function text(...parameters) {
  let properties = readFlowProperties(parameters);

  // Default style
  properties.style = Object.assign({}, basicWidgetTheme.text.style, properties.style);

  return unstyledText(properties)
}

export function unstyledText(...parameters) {
  let properties = readFlowProperties(parameters);
  findTextAndKeyInProperties(properties);
  extractAttributes(properties);
  const debugIdentifier = properties.text.substring(0, 20) + "...";

  // A label surrounded by div
  if (properties.div) return textDiv(properties);
  
  const key = extractProperty(properties, "key");
  const label = getTarget().elementNode(key ? key : null, 
    {
      classNameOverride: "text[" + debugIdentifier + "]",
      tagName:"label",
      attributes: extractProperty(properties, "attributes"), 
      children: [getTarget().textNode({
        key: key ? key + ".text" : null,
        text: extractProperty(properties, "text"),
      })], 
      animate: extractProperty(properties, "animate")
    });

  // Error on too many properties. 
  if (Object.keys(properties).length) {
    throw new Error("text() macro flow got unknown properties:" + Object.keys(properties).join(", "));
  }

  return label; 
}

export function textDiv(properties) {
  delete properties.div;
  const style = extractChildStyles(extraproperties.attributes.style); 
  const animate = extractProperty(properties, "animate"); 
  const key = extractProperty(properties, "key");
  properties.key = key ? key + ".label" : null;
  return div(unstyledText(properties), {key, style, animate});
}


/**
 * Input macro flow
 * 
 * highlighted arguments: label, getter, setter,
 */
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
  const properties = findKeyInProperties(readFlowProperties(parameters));
  let key;
  let error;
  if (!properties.key) {
    properties.key = label;
  }

  if (typeof(getter) === "object" && typeof(setter) === "string") {
    const targetObject = getter;
    const targetProperty = setter; 
    properties.key = properties.key + "." + targetObject.causality.id + "." + targetProperty;
    key = properties.key; 
    getter = callback(() => targetObject[targetProperty], properties.key + ".getter");
    setter = callback(newValue => { log(newValue); targetObject[targetProperty] = (type === "number") ? parseInt(newValue) : newValue;}, properties.key + ".setter")
    error = targetObject[targetProperty + "Error"];
  }

  const inputAttributes = extractAttributes(properties.inputProperties);
  delete properties.inputProperties;
  if (type === "number") {
    if (!inputAttributes.style) inputAttributes.style = {};
    if (!inputAttributes.style.width) inputAttributes.style.width = "50px";
  } 
  const attributes = {
    oninput: callback(event => setter(type === "checkbox" ? event.target.checked : event.target.value), properties.key + ".oninput"),
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
    key: properties.key + ".input", 
    classNameOverride: type + "InputField", 
    tagName: "input", 
    attributes, 
    onClick: properties.onClick})];
  const labelChild = text(label, {style: {paddingRight: "4px", margin: ""}, ...properties.labelProperties}); 
  if (type === "checkbox") {
    children.push(labelChild);
  } else {
    children.unshift(filler());
    children.unshift(labelChild);
  }
  
  return row({style: {alignItems: "center", padding: "4px", ...properties.style}, children, ...properties}, );
}

// export const button = modernButton;

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