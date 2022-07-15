import { observable, repeat, finalize, Flow, flow, withoutRecording, sameAsPreviousDeep, readFlowProperties, readFlowProperties2, targetStack } from "../flow/Flow.js";
const log = console.log;


/**
 * HTML Node building 
 */
export function elemenNode(...parameters) {
  let properties = readFlowProperties2(parameters, {singleStringAsText: true}); 
  const attributes = extractAttributes(properties);
  const target = targetStack[targetStack.length - 1];
  return target.elementNode({key: properties.key, attributes});
}

export function textNode(...parameters) {
  let properties = readFlowProperties2(parameters, {singleStringAsText: true}); 
  const attributes = extractAttributes(properties);
  const target = targetStack[targetStack.length - 1];
  return target.textNode({key: properties.key, attributes});
}

export function modalNode(...parameters) {
  let properties = readFlowProperties2(parameters, {singleStringAsText: true}); 
  const target = targetStack[targetStack.length - 1];
  return target.modalNode({key: properties.key});
}

export function div(...parameters) {
  let properties = readFlowProperties2(parameters, {singleStringAsText: true}); 
  const attributes = extractAttributes(properties);
  const target = targetStack[targetStack.length - 1];
  return target.elementNode({tagName: "div", key: properties.key, attributes});
}


/**
 * Basic flows for your app 
 */

export function text(...parameters) {
  let properties = readFlowProperties2(parameters, {singleStringAsText: true}); 
  const attributes = extractAttributes(properties); 
  const target = targetStack[targetStack.length - 1];

  const textProperties = {
    key: properties.key ? properties.key + ".text" : null,
    text: properties.text,
  }

  return target.elementNode(properties.key ? properties.key + ".span" : null, 
    {
      tagName:"span",
      attributes, 
      children: [target.textNode(textProperties)], 
      ...properties 
    });
}

export function button() { 
  let result; 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 
  const target = targetStack[targetStack.length - 1];

  // Inject debug printout in click.
  if (properties.onClick) {
    const onClick = properties.onClick;
    properties.onClick = () => {
      //log("clicked at: " + JSON.stringify(result.getPath()));
      onClick();
    }  
  }

  // Autogenerate child text node from string.
  const text = properties.text; delete properties.text; 
  if (text && !properties.children) {
    properties.children = [target.textNode(properties.key + ".button-text", {text, textNode:true})]; 
  }
  result = target.elementNode(properties.key + ".button", {tagName: "button", attributes, ...properties})
  return result; 
};

export const flexContainerStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  display:"flex", 
  flexDirection: "row", 
  alignItems: "stretch", 
  justifyContent: "flexStart",
  whiteSpace: "pre"
};

export const rowStyle = {
  ...flexContainerStyle,
  flexDirection: "row"
};

export const columnStyle = {
  ...flexContainerStyle,
  flexDirection: "column" 
};

export function row() { 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 
  const target = targetStack[targetStack.length - 1];
  attributes.style = {...rowStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return target.elementNode({tagName: "div", attributes, ...properties }); 
};

export function column() { 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 
  const target = targetStack[targetStack.length - 1];
  attributes.style = {...columnStyle, ...attributes.style}; // Inject column style (while making it possible to override)
  return target.elementNode({tagName: "div", attributes, ...properties }); 
};

function copyArray(array) {
  const result = [];
  array.forEach(element => result.push(element));
  return result;
}

/**
 * Element Node Attributes 
 */
function extractAttributes(properties) {
  const attributes = {};
  eventHandlerContentElementAttributes.forEach(
    attribute => {
      if (typeof(properties[attribute.camelCase]) !== "undefined") {
        attributes[attribute.lowerCase] = properties[attribute.camelCase];
        delete properties[attribute];
      }
    }
  );
  globalElementAttributes.forEach(
    attribute => {
      if (typeof(properties[attribute.camelCase]) !== "undefined") {
        attributes[attribute.lowerCase] = properties[attribute.camelCase];
        delete properties[attribute];
      }
    }
  );
  return attributes;
}


// Source https://html.spec.whatwg.org/#global-attributes
export const eventHandlerContentElementAttributesCamelCase = [
  "onAuxClick",
  "onBeforeMatch",
  "onBlur",
  "onCancel",
  "onCanPlay",
  "onCanPlaythrough",
  "onChange",
  "onClick",
  "onClose",
  "onContextLost",
  "onContextMenu",
  "onContextRestored",
  "onCopy",
  "onCueChange",
  "onCut",
  "onDblClick",
  "onDrag",
  "onDragEnd",
  "onDragEnter",
  "onDragLeave",
  "onDragOver",
  "onDragStart",
  "onDrop",
  "onDurationChange",
  "onEmptied",
  "onEnded",
  "onError",
  "onFocus",
  "onFormData",
  "onInput",
  "onInvalid",
  "onKeyDown",
  "onKeyPress",
  "onKeyUp",
  "onLoad",
  "onLoadedData",
  "onLoadedMetaData",
  "onLoadStart",
  "onMouseDown",
  "onMouseEnter",
  "onMouseLeave",
  "onMouseMove",
  "onMouseOut",
  "onMouseOver",
  "onMouseUp",
  "onPaste",
  "onPause",
  "onPlay",
  "onPlaying",
  "onProgress",
  "onRateChange",
  "onReset",
  "onResize",
  "onScroll",
  "onSecurityPolicyViolation",
  "onSeeked",
  "onSeeking",
  "onSelect",
  "onSlotChange",
  "onStalled",
  "onSubmit",
  "onSuspend",
  "onTimeUpdate",
  "onToggle",
  "onVolumeChange",
  "onWaiting",
  "onWheel"
]
const eventHandlerContentElementAttributes = eventHandlerContentElementAttributesCamelCase.map(camelCase => ({camelCase, lowerCase: camelCase.toLowerCase()}));

// Source https://html.spec.whatwg.org/#global-attributes
export const globalElementAttributesCamelCase = [
  "accessKey",
  "autoCapitalize",
  "autoFocus",
  "contentEditable",
  "dir",
  "draggable",
  "enterKeyHint",
  "hidden",
  "inert",
  "inputmode",
  "is",
  "itemId",
  "itemProp",
  "itemRef",
  "itemScope",
  "itemType",
  "lang",
  "nonce",
  "spellCheck",
  "style",
  "tabIndex",
  "title",
  "translate"
];

const globalElementAttributes = globalElementAttributesCamelCase.map(camelCase => ({camelCase, lowerCase: camelCase.toLowerCase()}));
