import { observable, repeat, finalize, Flow, flow, withoutRecording, sameAsPreviousDeep, readFlowProperties, readFlowProperties2 } from "../flow/Flow.js";
const log = console.log;


/**
 * Basic flows for your app 
 */
export function text() {
  const properties = readFlowProperties(arguments); 
  // console.log(properties.target);
  const textProperties = {
    key: properties.key + ".text",
    text: properties.text,
  }
  if (properties.target) {
    textProperties.target = properties.target;
  }

  return new BasicElementNode(properties.key + ".span", 
    {
      tagName:"span", 
      children: [targetOrBasicText(textProperties)], 
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
      //log("clicked at: " + JSON.stringify(result.getPath()));
      onClick();
    }  
  }

  // Autogenerate child text node from string.
  const text = properties.text; delete properties.text; 
  if (text && !properties.children) {
    properties.children = [new BasicTextNode(properties.key + ".button-text", {text, textNode:true})]; 
  }
  result = new BasicElementNode(properties.key + ".button", {tagName: "button", attributes, ...properties})
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
  return new BasicElementNode({tagName: "div", attributes, ...properties }); 
};

export function column() { 
  const properties = readFlowProperties(arguments);
  const attributes = extractAttributes(properties); 
  attributes.style = {...columnStyle, ...attributes.style}; // Inject column style (while making it possible to override)
  return new BasicElementNode({tagName: "div", attributes, ...properties }); 
};


function copyArray(array) {
  const result = [];
  array.forEach(element => result.push(element));
  return result;
}

/**
 * 1:1 HTML 
 */
export class BasicFlow extends Flow {

  constructor(...parameters) {
    const me = super(...copyArray(parameters));
    let properties = readFlowProperties2(parameters); 
    // if (!this.key) throw new Error("No key exception!");

    // Arguments
    properties.key = "domFlow"
    me.flowProperties = properties; 
  }
}


 export class BasicElementNode extends BasicFlow { 
  toString() {
    return "BasicElementNode:" + this.tagName + ":" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.elementNode("domNode", this.flowProperties);
  }
}

export function elementNode() { 
  return new BasicElementNode(readFlowProperties(arguments)) 
};


function targetOrBasicText(properties) {
  if (properties.target) {
    return properties.target.textNode(properties);
  } else {
    return new BasicTextNode(properties) 
  }
} 

export class BasicTextNode extends BasicFlow {
  toString() {
    return "BasicTextNode:" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.textNode("textNode", this.flowProperties);
  }
}



export class BasicModalNode extends BasicFlow { 
  toString() {
    return "BasicModalNode:" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  build()  {
    return this.target.modalNode(this.flowProperties);
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
