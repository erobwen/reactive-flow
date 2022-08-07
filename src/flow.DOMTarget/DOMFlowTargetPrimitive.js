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
    this.reBuildDomNode(node);

    
    if (this.transitionAnimation || configuration.animationsByDefault) {
      reBuildDomNodeWithChildrenAnimated()
    } else {
      const newChildNodes = this.getChildNodes();
  
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
  }
  
  reBuildDomNodeWithChildrenAnimated() {
    const newChildNodes = this.getChildNodes();
    let index;

    function setupTransitionCleanup(node) {
      
      function onTransitionEnd(event) {
        node.style.transition = "";
        node.removeEventListener("transitionend", onTransitionEnd);
      }

      node.addEventListener("transitionend", onTransitionEnd);
    }

    // Measure current bounds
    const boundsBefore = node.childNodes.reduce((result, node) => result.push(node.getBoundingClientRect()), []);

    // Removal pass
    index = node.childNodes.length - 1;
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

    // Measure new bounds
    const boundsAfter = newChildNodes.reduce((result, node) => result.push(node.getBoundingClientRect()), []);

    requestAnimationFrame(() => {
      // Translate to old position
      index = 0;
      while(index < newChildNodes) {
        const node = newChildNodes[index];
        const boundBefore = boundsBefore[index];
        const boundAfter = boundsAfter[index];
        const deltaX = boundAfter.left - boundBefore.left;
        const deltaY = boundAfter.top - boundBefore.top;
        node.style.transform = "translate(" + -deltaX + "px, " + -deltaY + "px)";
      }
      
      // Activate animations 
      requestAnimationFrame(() => {
        // Transition to new position
        newChildNodes.forEach(node => {
          node.style.transition = "1s ease-in";
          node.style.transform = "";
          setupTransitionCleanup(node);
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



