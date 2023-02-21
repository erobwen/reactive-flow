import { readFlowProperties, trace, getTarget, Flow, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, findKeyInProperties, transaction, creators } from "../flow/Flow.js";
const log = console.log;


/**
 * Basic HTML Node building 
 */

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
  return getTarget().elementNode({tagName: "div", key: properties.key, classNameOverride: "div", attributes, children: properties.children});
}

 function styledDiv(classNameOverride, style, parameters) { 
  const properties = findKeyInProperties(readFlowProperties(parameters));
  const attributes = extractAttributes(properties);
  attributes.style = {...style, ...attributes.style}; // Inject row style (while making it possible to override)
  return getTarget().elementNode({key: properties.key, classNameOverride, tagName: "div", attributes, ...properties }); 
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
export const wrapper = (...parameters) => styledDiv("wrapper", {}, parameters);
export const row = (...parameters) => styledDiv("row", rowStyle, parameters);
export const column = (...parameters) => styledDiv("column", columnStyle, parameters);
export const center = (...parameters) => styledDiv("center", centerStyle, parameters);
export const middle = (...parameters) => styledDiv("middle", middleStyle, parameters);
export const centerMiddle = (...parameters) => styledDiv("centerMiddle", centerMiddleStyle, parameters);

/**
 * Basic basic layout fillers
 */
export const filler = (...parameters) => styledDiv("filler", flexGrowShrinkStyle, parameters);


/**
 * Basic widget  
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


/**
 * Modal
 */
export function modal(...parameters) {
  const properties = readFlowProperties(parameters);
  const result = new Modal(properties);
  return result; 
}

export class Modal extends Flow {
  setProperties({children}) {
    if (children.length !== 1) throw new Error("Modal only accepts a single child!");
    this.content = children[0];
  }

  ensure() {
    this.modalFrame = this.inheritFromContainer("modalFrame")
    console.log("ENSURE");
    log(this.modalFrame)
    if (this.modalFrame) {
      log(this.isVisible)
      if (this.isVisible) {
        this.modalFrame.openModal(this.content);
      } else {
        this.modalFrame.closeModal(this.content);
      }
    }
  }

  build() {
    return div({style: {display: "none"}});
  }
}

export function modalFrame(...parameters) {
  // debugger; 
  const properties = readFlowProperties(parameters);
  const result = new ModalFrame(properties);
  log("----------------------------------------------------------------")
  log(result.target);
  return result; 
}

class ModalFrame extends Flow {
  setProperties({style, children}) {
    this.style = style; 
    this.children = children;  
    this.modalFrame = this;
    this.staticContent = children; 
  }

  setState() {
    this.modalContent = null;
    this.modalSubFrame = null;
    this.actualChildren = this.children;
  }

  updateChildren() {
    const newChildren = [...this.staticContent]
    if (this.modalSubFrame) newChildren.push(this.modalSubFrame);
    this.actualChildren = newChildren;  
  }

  openModal(modalContent) {
    this.setModalContent(modalContent)
  }

  closeModal(modalContent) {
    if (this.modalContent === modalContent) {
      this.setModalContent(null);
    }
  }

  setStaticContent(staticContent) {
    staticContent = staticContent instanceof Array ? staticContent : [staticContent]
    this.staticContent = staticContent;
    this.updateChildren();
  }

  setModalContent(modalContent) {
    log("OPEN MODAL")
    const previousContent = this.modalContent;

    transaction(() => {
      if (previousContent !== modalContent) {
        this.modalContent = modalContent;

        if (!modalContent) {
          // Remove modal
          this.disposeModalSubFrame();
          this.updateChildren();
        } else if (previousContent) {
          // Replace content
          this.modalSubFrame.setStaticContent(modalContent)
          modalContent.modalFrame = this.modalSubFrame;
        } else {
          // New content
          this.ensureModalSubFrame(this.modalContent);
          modalContent.modalFrame = this.modalSubFrame;
          this.updateChildren();
        }
      }
    });
  }

  ensureModalSubFrame(content) {
    if (!this.modalSubFrame) {
      creators.push(this);
      this.modalSubFrame = new ModalFrame(
        content, 
        { 
          style: {
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            pointerEvents: "none"
          }
        }
      ); 
      creators.pop();
    }
  }

  disposeModalSubFrame() {
    if (!this.modalSubFrame) {
      this.modalSubFrame.dispose();
      this.modalSubFrame = null;
    }
  }

  build() {
    return new div({style: this.style, children: this.actualChildren});
  }
}


/**
 * Portals
 */
export function portalEntrance(...parameters) {
  const properties = readFlowProperties(parameters);
  findKeyInProperties(properties);
  return new PortalEntrance(properties);
}

export class PortalEntrance extends Flow {
  setProperties({portalContent, portalExit}) {
    this.portalExit = portalExit; 
    this.portalContent = portalContent;
    this.derrive(() => {
      if (this.isVisible) {
        log("visible entrance..");
        // Note: check if children already set will cause infinite loop. This is unnecessary since it is built in to causality anyway. 
        this.portalExit.children = this.portalContent;
      } else {
        if (this.portalExit.children && this.portalExit.children === this.portalContent) {
          this.portalExit.children = null;
        }
      }
    });
  }

  build() {
    // return null;
    return text("[portal active]");
    // return this.children;
  }
}

export function portalExit(...parameters) {
  const properties = readFlowProperties(parameters);
  findKeyInProperties(properties);
  const attributes = extractAttributes(properties);
  return getTarget().elementNode(properties.key, 
    { 
      classNameOverride: "portalExit", 
      tagName: "div", 
      attributes, 
    }
  );
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
