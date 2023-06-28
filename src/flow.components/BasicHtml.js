
/**
 * Basic HTML Node building 
 */

import { findKeyInProperties, getTarget, readFlowProperties } from "../flow/Flow";

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



const childStyleProperties = [
  "order",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex", 
  // {
  //   compound: "flex", 
  //   partial: [
  //     "flex-grow",
  //     "flex-shrink",
  //     "flex-basis",
  //   ]
  // },
  "align-self"
]