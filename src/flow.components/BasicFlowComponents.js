import { readFlowProperties, trace, getTarget } from "../flow/Flow.js";
const log = console.log;


/**
 * Basic HTML Node building 
 */

export function elemenNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({key: properties.key, attributes, children: parameters.children});
}

export function textNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().textNode({key: properties.key, attributes, children: parameters.children});
}

export function modalNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  return getTarget().modalNode({key: properties.key});
}

export function div(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({tagName: "div", key: properties.key, attributes, children: parameters.children});
}


/**
 * Basic layout styles
 */

 export const flexContainerStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  display:"flex",
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

export const centerStyle = {
  ...rowStyle,
  justifyContent:"center",
  alignItems: "stretch"
} 

export const middleStyle = {
  ...columnStyle,
  justifyContent:"center",
  alignItems: "stretch"
}

export const centerMiddleStyle = {
  ...rowStyle,
  justifyContent:"center",
  alignItems: "center"
} 


/**
 * Basic basic layout  
 */

export function wrapper(...parameters) { // I.e. a plain div, but with a classNameOverride.
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({key: properties.key, classNameOverride: "wrapper", tagName: "div", attributes, children: properties.children }); 
}

export function row(...parameters) { 
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...rowStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "row", tagName: "div", attributes, children: properties.children }); 
}

export function column(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...columnStyle, ...attributes.style}; // Inject column style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "column", tagName: "div", attributes, children: properties.children }); 
}

export function center(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...centerStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "center", tagName: "div", attributes, children: properties.children }); 
}

export function middle(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...middleStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "center", tagName: "div", attributes, children: properties.children }); 
}

export function centerMiddle(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...centerMiddleStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "centerMiddle", tagName: "div", attributes, children: properties.children }); 
}


/**
 * Basic widget  
 */

export function text(...parameters) {
  let properties = readFlowProperties(parameters, {singleStringAsText: true}); 
  const attributes = extractAttributes(properties);

  const textProperties = {
    key: properties.key ? properties.key + ".text" : null,
    text: properties.text,
  }

  return getTarget().elementNode(properties.key ? properties.key + ".span" : null, 
    {
      classNameOverride: "text[" + textProperties.text + "]",
      tagName:"span",
      attributes, 
      children: [getTarget().textNode(textProperties)], 
      ...properties 
    });
}

export function textInputField(label, getter, setter, ...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = {
    ...extractAttributes(properties),
    oninput: event => setter(event.target.value),
    value: getter(),
    type: "text",
    // onfocusout: event => {debugger}
  };

  return row(
    text(label, {style: {paddingRight: "4px"}}),
    getTarget().elementNode(properties.key, {classNameOverride: "textInputField", tagName: "input", attributes, onClick: properties.onClick}),
    {style: {padding: "4px"}}
  );
}

export function button(...parameters) { 
  let result; 
  const properties = readFlowProperties(parameters);
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
  result = getTarget().elementNode(properties.key, {classNameOverride: "button", tagName: "button", attributes, children, onClick: properties.onClick});
  return result; 
};


/**
 * Element Node Attributes 
 */
export function extractAttributes(properties) {
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
