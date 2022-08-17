import { readFlowProperties, trace, getTarget } from "../flow/Flow.js";
const log = console.log;


/**
 * Basic HTML Node building 
 */

export function elemenNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({key: properties.key, attributes, children: properties.children});
}

export function textNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().textNode({key: properties.key, attributes, children: properties.children});
}

export function modalNode(...parameters) {
  let properties = readFlowProperties(parameters); 
  return getTarget().modalNode({key: properties.key});
}

export function div(...parameters) {
  let properties = readFlowProperties(parameters); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({tagName: "div", key: properties.key, attributes, children: properties.children});
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
 * Basic element styles
 */
export const naturalSizeStyle = { // For bottom up components inside scroll compoennts
  overflow: "visible",
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto'
}

export const fitStyle = {
  overflow: "hidden", // Enforce top down layout. If set to auto or display, layout might be influenced by grand children that are too large to fit within their given space. 
  boxSizing: "border-box",  // Each component needs to be responsible of their own padding/border space...
  width: "100%",
  height: "100%"
} 

// For components that needs to grow and shrink without regard to its contents. Scroll panels typically, or for equal distribution of space.
export const flexGrowShrinkStyle = {
  overflow: "hidden", 
  boxSizing: "border-box",
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 1,
}

export function flexGrowShrinkRatioStyle(ratio) {
  return {
    overflow: "hidden", 
    boxSizing: "border-box",
    flexGrow: ratio,
    flexShrink: 1,
    flexBasis: 1,
  };
}

// For a component that stubbornly needs to keep its size in the flex direction. For buttons etc.  
export const flexAutoStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: 'auto'
};

export const flexShrinkAutoStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 'auto'
};

// Convenience for an auto width style with fixed width. 
export function flexAutoWidthStyle(width) {
  return {
    overflow: "hidden",
    boxSizing: "border-box",
    width: width, 
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto'    
  };
};

// Convenience for an auto width style with fixed height. 
export function flexAutoHeightStyle(height) {
  return {
    overflow: "hidden",
    boxSizing: "border-box",
    height: height, 
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto'
  };
};

// For components that needs to grow and shrink with the size of its contents as base. This was needed for some IE11 support. 
export const flexGrowShrinkAutoStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
}

export const flexGrowAutoStyle = {
  overflow: "hidden",
  boxSizing: "border-box",
  flexGrow: 1,
  flexShrink: 0,
  flexBasis: 'auto',  
} 


/**
 * Basic basic layout containers
 */

export function wrapper(...parameters) { // I.e. a plain div, but with a classNameOverride.
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({key: properties.key, classNameOverride: "wrapper", tagName: "div", attributes, ...properties }); 
}

export function row(...parameters) { 
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...rowStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "row", tagName: "div", attributes, ...properties }); 
}

export function column(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...columnStyle, ...attributes.style}; // Inject column style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "column", tagName: "div", attributes, ...properties }); 
}

export function center(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...centerStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "center", tagName: "div", attributes, ...properties }); 
}

export function middle(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...middleStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "center", tagName: "div", attributes, ...properties }); 
}

export function centerMiddle(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...centerMiddleStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "centerMiddle", tagName: "div", attributes, ...properties }); 
}

/**
 * Basic basic layout fillers
 */
 export function filler(...parameters) {
  const properties = readFlowProperties(parameters);
  const attributes = extractAttributes(properties);
  attributes.style = {...flexGrowShrinkStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride: "center", tagName: "div", attributes, ...properties }); 
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
  if (typeof(getter) === "object" && typeof(setter) === "string") {
    const targetObject = getter;
    const targetProperty = setter; 
    getter = () => targetObject[targetProperty]
    setter = newValue => { log(newValue); targetObject[targetProperty] = (type === "number") ? parseInt(newValue) : newValue; }
  }
  const properties = readFlowProperties(parameters);

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
    children.unshift(labelChild);
  }
  
  return row({style: {padding: "4px", ...properties.style}, children, ...properties}, );
}

export function button(...parameters) { 
  let result; 
  const properties = readFlowProperties(parameters, {singleStringAsText: true});
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
  if (!properties) return attributes;
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
