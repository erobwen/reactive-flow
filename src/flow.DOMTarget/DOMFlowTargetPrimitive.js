import { repeat, Flow, FlowTargetPrimitive, trace, configuration } from "../flow/Flow";

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
 export class DOMFlowTargetPrimitive extends FlowTargetPrimitive {

  dimensions() {
    const domNode = this.getDomNode(true).cloneNode(true);;
    document.body.appendChild(domNode);
    // console.log(domNode.clientHeight);
    // console.log(domNode.offsetHeight);
    // console.log(domNode.offsetWidth);
    // console.log(domNode.scrollHeight);
    const result = {width: domNode.offsetWidth, height: domNode.offsetHeight }; 
    document.body.removeChild(domNode);
    //this.domNode = null; this.domNode = domNode; // Trigger change for parent 
    return result; 
    return null;
  }
  
  getDomNode() {
    if (!this.buildElementRepeater) {
      // this.buildElementRepeater = repeat(mostAbstractFlow(this).toString() + ".buildElementRepeater", (repeater) => {
      this.buildElementRepeater = repeat(this.toString() + ".buildElementRepeater", (repeater) => {
        if (trace) console.group(repeater.causalityString());
        
        this.ensureDomNodeCreated();
        this.reBuildDomNodeWithChildren();
        if (trace) console.groupEnd();  
      });
    }
    return this.domNode;
  }

  createEmptyDomNode() {
    throw new Error("Not implemented yet!");
  }

  reBuildDomNodeWithChildren() {
    const node = this.domNode;
    log("reBuildDomNodeWithChildren");
    console.log(node);
    this.reBuildDomNode(node);
    if (!(node instanceof Element)) return;
    const newChildNodes = this.getChildNodes(node);
    
    function allElements(nodeList) {
      if (!nodeList) return false;
      let result = true;
      nodeList.forEach(child => {if (!(child instanceof Element)) result = false; });
      return result;
    }
    
    if ((this.transitionAnimation || configuration.animationsByDefault) && allElements(node.childNodes) && allElements(newChildNodes)) {
      this.reBuildDomNodeWithChildrenAnimated(node, newChildNodes)
    } else {
      this.reBuildDomNodeWithChildrenWithoutAnimation(node, newChildNodes)
    }
  }

  reBuildDomNodeWithChildrenWithoutAnimation(node, newChildNodes) {
    // Removal pass
    let index = node.childNodes.length - 1;
    while(0 <= index) {
      const existingChild = node.childNodes[index];
      if (!newChildNodes.includes(existingChild)) {
        node.removeChild(existingChild);
      }
      index--;
    }
    
    // Adding pass
    index = 0;
    while(index < newChildNodes.length) {
      const existingChild = node.childNodes[index];
      if (newChildNodes[index] !== existingChild) {
        node.insertBefore(newChildNodes[index], existingChild);
      }
      index++;
    }
  }

  reBuildDomNodeWithChildrenAnimated(node, newChildNodes) {
    log([...newChildNodes]);
    log([...node.childNodes]);
    const childNodes = [...node.childNodes];
    let index;

    function setupTransitionCleanup(node, alsoRemoveNode) {
      
      function onTransitionEnd(event) {
        node.style.transition = "";
        node.removeEventListener("transitionend", onTransitionEnd);
        if (alsoRemoveNode) {
          node.parentNode.removeChild(node);
        }
      }

      node.addEventListener("transitionend", onTransitionEnd);
    }

    // Measure current bounds
    const boundsBefore = childNodes.reduce(
      (result, node) => { 
        result[node.equivalentCreator.causality.id] = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect"; 
        return result; 
      }, 
      {}
    );
    log("boundsBefore:");
    log(boundsBefore);

    // Reintroduced removed, as to be removed
    index = 0;
    const removed = [];
    while(index < node.childNodes.length) {
      const existingChild = node.childNodes[index];
      if (!newChildNodes.includes(existingChild)) {
        newChildNodes.splice(index, 0, existingChild); // Heuristic, introduce at old index
        removed.push(existingChild);
      }
      index++;
    }
    log("removed:");
    log(removed);
    
    // Adding pass
    index = 0;
    const added = [];
    while(index < newChildNodes.length) {
      const existingChild = node.childNodes[index];
      const newChild = newChildNodes[index];
      if (!childNodes.includes(newChild)) {
        added.push(newChild);
        // newChild.style.transform = "scale(0)";
        newChild.style.width = "0px";
        newChild.style.height = "0px";
        newChild.style.opacity = "0";
      } 
      if (newChild !== existingChild) {
        node.insertBefore(newChild, existingChild);
      }
      index++;
    }
    log("added:");
    log(added);
   
    // Measure new bounds
    const boundsAfter = newChildNodes.reduce(
      (result, node) => { 
        result[node.equivalentCreator.causality.id] = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect"; 
        return result; 
      }, 
      {}
    );
    log("boundsAfter:");
    log(boundsAfter);

    requestAnimationFrame(() => {
      log("Translate to old position!!!!")

      // Translate all except added to their old position (added should have a scale=0 transform)
      index = 0;
      while(index < newChildNodes.length) {
        const node = newChildNodes[index];
        if (!added.includes(node) && !removed.includes(node)) {
          const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
          const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
          const deltaX = boundAfter.left - boundBefore.left;
          const deltaY = boundAfter.top - boundBefore.top;
          console.log("translate(" + -deltaX + "px, " + -deltaY + "px)")
          node.style.transform = "translate(" + -deltaX + "px, " + -deltaY + "px)";
        }
        index++;
      }

      // Activate animations 
      requestAnimationFrame(() => {
        log("Activate animations!!!!")

        // Transition all except removed to new position by removing translation
        // Minimize removed by adding scale = 0 transform and at the same time removing the translation
        newChildNodes.forEach(node => {
          if (node instanceof Element) {
            if (!removed.includes(node)) {
              log("OTHER")
              node.style.transition = "0.4s ease-in";
              node.style.transform = "";
              node.style.width = "";
              node.style.height = "";
              node.style.opacity = "";
              setupTransitionCleanup(node, false);
            } else {
              log("REMOVED")
              node.style.transition = "0.4s ease-in";
              node.style.width = "0px";
              node.style.height = "0px";
              // node.style.transform = "scale(0)";
              setupTransitionCleanup(node, true);
            }      
          }
        });
      });  
    });
  }

  getChildNodes() {
    const result = [];
    if (this.children instanceof Array) {
      for (let child of this.children) {
        if (child) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive) {
            result.push(childPrimitive.getDomNode());
          }
        }
      }
    } else if (this.children instanceof Flow) {
      const childPrimitive = this.children.getPrimitive();
      if (childPrimitive) {
        result.push(childPrimitive.getDomNode());
      }
    }  
    return result;
  }

  ensureDomNodeCreated() { 
    if (!this.createElementRepeater) {
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
      });
    }
    return this.domNode;
  }

  reBuildDomNode(element) {
    throw new Error("Not implemented yet!");
  }
}



