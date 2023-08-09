
/**
 * Basic HTML Node building 
 */

import { getTarget } from "../flow/flowBuildContext";
import { readFlowProperties, findTextAndKeyInPropertiesUsingCase, findTextAndKeyInProperties, findKeyInProperties } from "../flow/flowParameters";

export function elemenNode(...parameters) {
  let properties = findKeyInProperties(readFlowProperties(parameters)); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({key: properties.key, attributes, children: properties.children});
}

export function textNode(...parameters) {
  let properties = findKeyInProperties(readFlowProperties(parameters)); 
  const attributes = extractAttributes(properties);
  return getTarget().textNode({key: properties.key, attributes, children: properties.children});
}

export function span(...parameters) {
  // log("Span")
  let properties = findTextAndKeyInPropertiesUsingCase(readFlowProperties(parameters)); 
  const attributes = extractAttributes(properties);
  textToTextNode(properties);
  return getTarget().elementNode({tagName: "span", key: properties.key, classNameOverride: "span", attributes, children: properties.children, animate: properties.animate});
}

export function div(...parameters) {
  let properties = findKeyInProperties(readFlowProperties(parameters)); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({tagName: "div", key: properties.key, classNameOverride: "div", attributes, children: properties.children, animate: properties.animate});
}

export function div2(...parameters) {
  let properties = findKeyInProperties(readFlowProperties(parameters)); 
  const attributes = extractAttributes(properties);
  return getTarget().elementNode({tagName: "div", key: properties.key, classNameOverride: "modal-frame", attributes, children: properties.children});
}

 export function styledDiv(classNameOverride, style, parameters) { 
  const properties = findKeyInProperties(readFlowProperties(parameters));
  const attributes = extractAttributes(properties);
  attributes.style = {...style, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride, tagName: "div", attributes, ...properties }); 
}


export function textToTextNode(properties) {
  if (properties.text) { //textToTextNode(parameters);
    // TODO: Investigate why there is an infinite loop if we do not add array around children??
    properties.children = 
      // [
        getTarget().textNode({
          key: properties.key ? properties.key + ".text" : null,
          text: extractProperty(properties, "text"),
        })
      // ]
      ;
  }
}


/**
 * Element Node Attributes 
 */
export function extractAttributes(properties) {
  // TODO: Do not destructivley change properties... can we guarantee that we do not change a const 
  const attributes = {};
  if (!properties) return attributes;
  eventHandlerContentElementAttributes.forEach(
    attribute => {
      if (typeof(properties[attribute.camelCase]) !== "undefined") {
        attributes[attribute.lowerCase] = properties[attribute.camelCase];
        delete properties[attribute.camelCase];
      }
    }
  );
  globalElementAttributes.forEach(
    attribute => {
      if (typeof(properties[attribute.camelCase]) !== "undefined") {
        attributes[attribute.lowerCase] = properties[attribute.camelCase];
        delete properties[attribute.camelCase]; // Destructive change of properties... could this cause problems?
      }
    }
  );
  if (properties.className) attributes["class"] = properties.className;  
  properties.attributes = attributes;
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
  "translate",
];

const globalElementAttributes = globalElementAttributesCamelCase.map(camelCase => ({camelCase, lowerCase: camelCase.toLowerCase()}));

/**
 * Child styles
 */

export function extractChildStyles(style) {
  // style = {...style}
  const childStyle = {}
  childStylePropertiesCamelCase.forEach(property => {
    if (typeof(style[property]) !== "undefined") {
      childStyle[property] = style[property];
      delete style[property];
    }
  });
  return [childStyles, style]; 
}

const childStylePropertiesCamelCase = [
  "order",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "flex", 
  // {
  //   compound: "flex", 
  //   partial: [
  //     "flex-grow",
  //     "flex-shrink",
  //     "flex-basis",
  //   ]
  // },
  "alignSelf"
]

const childStyleProperties = childStylePropertiesCamelCase.map(camelCase => ({camelCase, lowerCase: camelCase.toLowerCase()}));


export function extractProperty(object, property) {
  const result = object[property];
  delete object[property];
  return result; 
}