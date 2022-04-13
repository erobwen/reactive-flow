import { observable, repeat, finalize, Flow, flow, withoutRecording, sameAsPreviousDeep, readFlowProperties } from "./Flow.js";
const log = console.log;


/**
 * Target Acccess Flows
 */
export class ElementNode extends Flow {
  build()  {
    return this.target.elementNode(this.properties);
  }
}

export function elementNode() { 
  return new ElementNode(readFlowProperties(arguments)) 
};


export class TextNode extends Flow {
  build()  {
    return this.target.textNode(this.properties);
  }
}

export function textNode() { 
  return new TextNode(readFlowProperties(arguments)) 
};


/**
 * Convenience 
 */
export function text() {
  return new TextNode(readFlowProperties(arguments));
}

export function button() { 
  const properties = readFlowProperties(arguments);
  const text = properties.text; delete properties.text; 
  if (text && !properties.children) {
    properties.children = [new TextNode({text})]; 
  }
  return new ElementNode({tag: "button", ...properties}) 
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
  flexDirection: "row", 
  ...flexContainerStyle
};

export const columnStyle = {
  flexDirection: "row", 
  ...flexContainerStyle
};

export function row() { 
  const properties = readFlowProperties(arguments); 
  const style = properties.style; delete properties.style; 
  return new ElementNode({tag: "div", style: {rowStyle, ...style}, ...properties }); 
};

export function column() { 
  const properties = readFlowProperties(arguments); 
  const style = properties.style; delete properties.style; 
  return new ElementNode({tag: "div", style: {columnStyle, ...style}, ...properties }); 
};



