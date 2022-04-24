import { observable, repeat, finalize, Flow, flow, withoutRecording, sameAsPreviousDeep, readFlowProperties } from "../flow/Flow.js";
const log = console.log;


/**
 * Basic flows for your app 
 */
export function text() {
  const properties = readFlowProperties(arguments); 
  return new ElementNode(properties.key + ".span", 
    {
      tagName:"span", 
      children: [new TextNode(properties.key + ".text", {text: properties.text})], 
      ...properties
    });
}

export function button() { 
  let result; 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 

  // Inject debug printout in click.
  if (properties.onClick) {
    const onClick = properties.onClick;
    properties.onClick = () => {
      console.log("clicked at: " + JSON.stringify(result.getPath()));
      onClick();
    }  
  }

  // Autogenerate child text node from string.
  const text = properties.text; delete properties.text; 
  if (text && !properties.children) {
    properties.children = [new TextNode(properties.key + ".button-text", {text, textNode:true})]; 
  }
  result = new ElementNode({tagName: "button", attributes, ...properties})
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
  attributes.style = {...rowStyle, ...attributes.style}; // Inject row style (while making it possible to override)
  return new ElementNode({tagName: "div", attributes, ...properties }); 
};

export function column() { 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 
  attributes.style = {...columnStyle, ...attributes.style}; // Inject column style (while making it possible to override)
  return new ElementNode({tagName: "div", attributes, ...properties }); 
};


/**
 * 1:1 HTML 
 */
export class BasicFlow extends Flow {
  constructor() {
    super();
    let properties = readFlowProperties(arguments); 

    // Arguments
    this.causality.flowProperties = properties; 
    log("properties of " + properties.key + ":");
    log(properties)
  }
}


 export class ElementNode extends BasicFlow { 
  toString() {
    return this.tagName + ":" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.elementNode(this.causality.flowProperties);
  }
}

export function elementNode() { 
  return new ElementNode(readFlowProperties(arguments)) 
};


export class TextNode extends BasicFlow {
  toString() {
    return "[text]" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.textNode(this.causality.flowProperties);
  }
}

export function textNode() { 
  return new TextNode(readFlowProperties(arguments)) 
};

export class ModalNode extends BasicFlow { 
  toString() {
    return "ModalNode:" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.modalNode(this.causality.flowProperties);
  }
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
