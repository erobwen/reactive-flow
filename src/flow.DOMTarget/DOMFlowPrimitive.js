import { flexAutoStyle } from "../flow.components/Layout";
import { repeat, Flow, trace, configuration, readFlowProperties, finalize } from "../flow/Flow";
import { FlowPrimitive } from "../flow/FlowPrimitive";
import { flowChanges } from "./DOMAnimation";

const log = console.log;

export function mostAbstractFlow(flow) {
  while (flow.equivalentCreator) flow = flow.equivalentCreator;
  return flow; 
}

export function aggregateToString(flow) {
  let id = [];
  let scan = flow;
  while (scan) {
    // if (!(scan instanceof FlowTargetPrimitive)) {
      // Dont display flow target primitive.       
      id.unshift(scan.toString());
    // }
    scan = scan.equivalentCreator;
  }
  return id.join(" | ");
}
   
export function clearNode(node) {
  while (node.childNodes.length > 0) {
    node.removeChild(node.lastChild);
  }
}

/**
 * DOM Flow Base class
 */
 export class DOMFlowPrimitive extends FlowPrimitive {

  dimensions(contextNode) {
    //TODO: Research a way to isolate the reflow used in dimensions to a wecomponent?
    console.warn("Calls to dimensions() could lead to performance issues as it forces a reflow to measure the size of a dom-node. Note that transition animations may use dimensions() for measuring the size of added nodes"); 
    const domNode = this.ensureDomNodeBuilt(true).cloneNode(true);
    if (contextNode) {
      contextNode.appendChild(domNode);
    } else {
      domNode.style.position = "absolute"; 
      domNode.style.top = "0";
      domNode.style.left = "0";
      domNode.style.width = "auto";
      domNode.style.height = "auto";
      Object.assign(domNode.style, flexAutoStyle);
      document.body.appendChild(domNode);  
    }

    const result = {width: domNode.offsetWidth, height: domNode.offsetHeight }; 
    const original = this.ensureDomNodeBuilt(true)
    // log("dimensions " + this.toString() + " : " +  result.width + " x " +  result.height);
    // log(original);
    // debugger;
    if (contextNode) {
      contextNode.removeChild(domNode);
    } else {
      document.body.removeChild(domNode);
    }
    return result; 
  }

  getDomNode() {
    this.ensureDomNodeBuilt();
    return this.domNode; 
  }
  
  ensureDomNodeBuilt() {
    finalize(this);
    if (!this.buildDOMRepeater) {
      // this.buildDOMRepeater = repeat(mostAbstractFlow(this).toString() + ".buildDOMRepeater", (repeater) => {
      this.buildDOMRepeater = repeat("[" + aggregateToString(this) + "].buildDOMRepeater", (repeater) => {
        if (trace) console.group(repeater.causalityString());
        
        this.ensureDomNode();
        this.ensureDomNodeAttributesSet();
        this.ensureDomNodeChildrenInPlace();
        if (trace) console.groupEnd();  
      }, {priority: 2});
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  ensureDomNodeChildrenInPlace() {
    // Impose animation. CONSIDER: introduce this with more general mechanism?
    const node = this.domNode;
    if (!(node instanceof Element)) return;
    console.group("ensureDomNodeChildrenInPlace " + this.toString())
    // log(node)
    
    // Get new children list, this is the target
    const newChildren = this.getPrimitiveChildren(node);
    const newChildNodes = newChildren.map(child => child.ensureDomNodeBuilt()).filter(child => !!child);
    
    // Iterate and remove things that should be removed or outgoing
    let index = node.childNodes.length - 1;
    const existingPrimitives = {};
    while(index >= 0) {
      const existingChildNode = node.childNodes[index];
      const existingPrimitive = existingChildNode.equivalentCreator;
      if (!existingPrimitive) {
        // No creator, probably a disappearing replacement that we want to keep
        newChildNodes.splice(index, 0, existingChildNode);
      } else {
        existingPrimitives[existingPrimitive.id] = existingPrimitive; 
        const animation = existingPrimitive.getAnimation(); 
        if (!newChildNodes.includes(existingChildNode) && flowChanges && flowChanges.globallyRemoved && flowChanges.globallyRemoved[existingPrimitive.id]) {
          if (animation) {
            // Node will be removed locally, copy it back to leave it to wait for animation.
            newChildNodes.splice(index, 0, existingChildNode);
          } else {
            // Not animated, remove instantly!
            node.removeChild(existingChildNode);
          }
        } else if (existingPrimitive.parentPrimitive && existingPrimitive.parentPrimitive.id !== this.id) {
          // Child will move out from this node
          if (animation) {
            // outgoing could already be gone at this stage!
            if (!existingChildNode.disappearingExpander) {
              node.insertBefore(animation.getDisappearingReplacement(existingChildNode), existingChildNode);
              node.removeChild(existingChildNode);
            }
          } else {
            // No animation, just remove. (do not copy to new)
          }
        }  
      }
      index--;
    }

    // Arrange disappearing expander for incoming
    if (flowChanges && flowChanges.globallyAdded)  {
      for(let newPrimitive of newChildren) {
        if (!existingPrimitives[newPrimitive.id] && !flowChanges.globallyAdded[newPrimitive.id]) {
          // Incoming primitive. We have to replace it with a dissapearing replacement before we add it in this container, since ith will otherwise dissapear from that container without a chance to add the replacement.
          const animation = newPrimitive.getAnimation(); 
          if (animation) {
            const newPrimitiveDomNode = newPrimitive.domNode; 
            if (!newPrimitiveDomNode.disappearingExpander) {
              //&& newPrimitiveDomNode.parentNode
              newPrimitiveDomNode.parentNode.insertBefore(animation.getDisappearingReplacement(newPrimitiveDomNode), newPrimitiveDomNode);
              newPrimitiveDomNode.parentNode.removeChild(newPrimitiveDomNode);
            }
          }
        }
      }   
    }
      
    // Adding pass, will also rearrange moved elements
    index = 0;
    while(index < newChildNodes.length) {
      const existingChildNode = node.childNodes[index];
      if (newChildNodes[index] !== existingChildNode) {
        node.insertBefore(newChildNodes[index], existingChildNode);
      }
      index++;
    }

    console.groupEnd();
  }

  *iterateChildren() {
    if (this.children instanceof Array) {
      for (let child of this.children) {
        if (child instanceof Flow && child !== null) {
          yield child;
        }
      }
    } else if (this.children instanceof Flow  && this.children !== null) {
      yield this.children;
    }
  }

  getChildNodes() {
    return this.getPrimitiveChildren().map(child => child.ensureDomNodeBuilt())
  }

  ensureDomNode() { 
    if (this.givenDomNode) {
      this.domNode = this.givenDomNode;
      this.domNode.id = aggregateToString(this);
      this.domNode.equivalentCreator = this; 
    } else if (!this.createElementRepeater) {
      this.createElementRepeater = repeat(mostAbstractFlow(this).toString() + ".createElementRepeater", (repeater) => {
        if (trace) log(repeater.causalityString());

        // Create empty dom node
        this.domNode = this.createEmptyDomNode();
        this.domNode.id = aggregateToString(this);
        this.domNode.equivalentCreator = this; 
        // this.domNode.id = mostAbstractFlow(this).toString()
        
        // Decorate all equivalent flows
        let scanFlow = this.equivalentCreator;
        while (scanFlow != null) {
          scanFlow.domNode = this.domNode;
          scanFlow = scanFlow.equivalentCreator;
        }

        if (trace) log(this.domNode);
      }, {priority: 2});
    }
    return this.domNode;
  }

  ensureDomNodeAttributesSet() {
    // Ensure dom node attributes set. This method assumes that no one else has messed with the dom node. 
    throw new Error("Not implemented yet!");
  }

  synchronizeDomNodeStyle(properties) {
    // Enforce writing of all dom node style to the dom. This is used when the dom node is out of sync with the flow, for example after a halted animation.  
    throw new Error("Not implemented yet!");
  }
}



