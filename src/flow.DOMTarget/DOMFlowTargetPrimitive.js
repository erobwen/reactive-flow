import { observable, world, repeat, readFlowProperties, Flow, FlowTargetPrimitive } from "../flow/Flow";

const log = console.log;


function mostAbstractFlow(flow) {
  while (flow.equivalentParent) flow = flow.equivalentParent;
  return flow; 
}

function aggregateToString(flow) {
  let id = [];
  let scan = flow;
  while (scan) {
    if (!(scan instanceof FlowTargetPrimitive)) {
      // Dont display flow target primitive.       
      id.unshift(scan.toString());
    }
    scan = scan.equivalentParent;
  }
  return id.join(" | ");
}

function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}

/**
 * DOM Flow Base class
 */
 export class DOMFlowTargetPrimitive extends FlowTargetPrimitive {

  
  getDomNode(domTarget) {
    const me = domTarget; 
    const you = this;
    if (!you.buildElementRepeater) {
      you.buildElementRepeater = repeat(mostAbstractFlow(you).toString() + ".buildElementRepeater", (repeater) => {
        log(repeater.causalityString());

        you.getEmptyDomNode(me);
        you.buildDomNodeWithChildren(me);  
      });
    }
    return you.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  buildDomNodeWithChildren(domTarget) {
    const me = domTarget; 
    const you = this;
    const node = you.domNode;
    you.buildDomNode(node);
    
    if (you.children instanceof Array) {
      clearNode(node);
      for (let child of you.children) {
        if (child !== null) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive !== null) {
            node.appendChild(childPrimitive.getDomNode(me));
          }
        }
      }
    } else if (you.children instanceof Flow) {
      clearNode(node);
      const childPrimitive = you.children.getPrimitive();
      if (childPrimitive !== null) {
        node.appendChild(childPrimitive.getDomNode(me));
      }
    }  
  }

  getEmptyDomNode(domTarget) {
    const me = domTarget; 
    const you = this;
    if (!you.createElementRepeater) {
      you.createElementRepeater = repeat(mostAbstractFlow(you).toString() + ".createElementRepeater", (repeater) => {
        log(repeater.causalityString());

        // Create empty dom node
        you.domNode = you.createEmptyDomNode();
        you.domNode.id = aggregateToString(you);
        // you.domNode.id = mostAbstractFlow(you).toString()
        
        // Decorate all equivalent flows
        let scanFlow = you.equivalentParent;
        while (scanFlow != null) {
          scanFlow.domNode = you.domNode;
          scanFlow = scanFlow.equivalentParent;
        }
      });
    }
    return you.domNode;
  }

  buildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}

/**
 * DOM Flow Target Primitive
 */
export class DOMElementNode extends DOMFlowTargetPrimitive {
  setProperties({children, tagName, attributes}) {
    this.children = children;
    this.tagName =  tagName ? tagName : "div";
    this.attributes = attributes ? attributes : {};
  }

  setState() {
    this.previouslySetStyles = {};
    this.newPreviouslySetAttributes = {};
  }

  createEmptyDomNode() {
    return document.createElement(this.tagName);
  }
  
  buildDomNode(element) {
    const newAttributes = this.attributes;
    const newPreviouslySetAttributes = {};
    if (this.tagName.toUpperCase() !== element.tagName) {
      throw new Error("Too high expectations error. Cannot change tagName of existing HTML element. Please do not change the tagName property once set!");
    }

    // Clear out styles that will no longer be modified
    for (let property in this.newPreviouslySetAttributes) {
      if (typeof(newAttributes[property]) === "undefined") {
        if (property === "style") {
          this.updateStyle(element, {}); // Clear style
        } else {
          element[property] = "";
        }
      }
    }

    // Set styles if changed
    for (let property in newAttributes) {
      if (property === "style") {
        this.updateStyle(element, newAttributes[property]);
      } else {
        if (element[property] !== newAttributes[property]) {
          element[property] = newAttributes[property];
        }
        newPreviouslySetAttributes[property] = true;  
      }
    }

    this.newPreviouslySetAttributes = newPreviouslySetAttributes; // Note: Causality will prevent this from self triggering repeater.
  }

  updateStyle(element, newStyle) {
    const elementStyle = element.style;
    const newPreviouslySetStyles = {};

    // Clear out styles that will no longer be modified
    for (let property in this.previouslySetStyles) {
      if (typeof(newStyle[property]) === "undefined") {
        elementStyle[property] = "";
      }
    }

    // Set styles if changed
    for (let property in newStyle) {
      if (elementStyle[property] !== newStyle[property]) {
        elementStyle[property] = newStyle[property];
      }
      newPreviouslySetStyles[property] = true;
    }

    this.previouslySetStyles = newPreviouslySetStyles; // Note: Causality will prevent this from self triggering repeater.     
  }
}

export class DOMTextNode extends DOMFlowTargetPrimitive {
  setProperties({text}) {
    this.text = text;
  }
  
  createEmptyDomNode() {
    return document.createTextNode("");
  }

  buildDomNode(element) {
    element.nodeValue = this.text; // toString()
  }
}

export class DOMModalNode extends DOMFlowTargetPrimitive {
  setProperties({children}) {
    this.children = children;
  }

  setState({}) {
    // Create the new flow target?
  }
  
  createEmptyDomNode() {
    // Do nothing.
  }

  buildDomNode(element) {
    // Do nothing.
  }

  getPrimitive() {
    const me = this;
    me.primitive = me;
    
    finalize(me);
    if (!me.mountRepeater) {
      me.mountRepeater = repeat(me.toString() + ".mountRepeater", repeater => {

        // TODO: somehow mount 
  
        // Expand known children (do as much as possible before integration)
        // if (me.children) {
        //   for (let child of me.children) {
        //     if (child !== null) {
        //       child.getPrimitive();
        //     }
        //   }
        // }
      });
    }
  
    return me;
  }  
}



