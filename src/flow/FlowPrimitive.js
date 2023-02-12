import { flowChanges } from "../flow.DOMTarget/DOMAnimation.js";
import { standardAnimation } from "../flow.DOMTarget/DOMFlipAnimation.js";
import { configuration, finalize, Flow, readFlowProperties, repeat, trace } from "./Flow.js";

const log = console.log;

export class FlowPrimitive extends Flow {
    
  constructor(...parameters) {
    super(readFlowProperties(parameters));
  }
  
  findChild(key) {
    if (this.key === key) return this;
    if (this.children) {
      for (let child of this.children) {
        if (child !== null) {
          let result = child.findChild(key);
          if (result !== null) return result;
        }
      }
    }
    return null;
  }

  getPrimitive(parentPrimitive) {
    if (parentPrimitive) {
      this.parentPrimitive = parentPrimitive;
    }
    return this;
  }

  ensureBuiltRecursive(flowTarget) {
    const name = this.toString(); // For chrome debugger
    
    if (flowTarget) this.visibleOnTarget = flowTarget;

    finalize(this); // Finalize might not work if no key was used, it might not call onEstablish.
    if (!this.expandRepeater) {
      this.expandRepeater = repeat(this.toString() + ".expandRepeater", repeater => {
        if (trace) console.group(repeater.causalityString());

        // Check visibility
        if (this.parentPrimitive) {
          if (this.parentPrimitive.childPrimitives && this.parentPrimitive.childPrimitives.includes(this)) {
            this.visibleOnTarget = this.parentPrimitive.visibleOnTarget;
          } else {
            this.visibleOnTarget = null;
          }
        }

        // Populate portals and stuff
        let scan = this.equivalentCreator; 
        while(scan) {
          if (scan.visibleOnTarget === this.visibleOnTarget) {
            scan = null; 
          } else {
            scan.visibleOnTarget = this.visibleOnTarget;
            scan.onVisibilityWillChange(!!this.visibleOnTarget);
            scan = scan.equivalentCreator;
          }
        }

        // This will trigger getPrimitive on abstract child flows. 
        this.childPrimitives = this.getPrimitiveChildren();

        // Expand known children (do as much as possible before integration)
        for (let childPrimitive of this.childPrimitives) { 
          childPrimitive.ensureBuiltRecursive();
        }
      
        if (trace) console.groupEnd();
      }, {priority: 1});
    }
    return this; 
  }
  
  onVisibilityWillChange() {}

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

  *iteratePrimitiveChildren() {
    for(let child of this.iterateChildren()) {
      let primitive = child.getPrimitive(this);
      if (primitive instanceof Array) {
        for (let fragment of primitive) { 
          yield fragment; 
        }
      } else {
        if (primitive) yield primitive;
      }
    }
  }

  getChildren() {
    return [...this.iterateChildren()];
  }

  getPrimitiveChildren() {
    return [...this.iteratePrimitiveChildren()];
  }

  isStable() {
    // return true; 
    return !flowChanges.globallyAdded[this.id] && (!this.primitiveParent || this.primitiveParent.isStable());
  }

  getAnimation() {
    let result; 
    if (!this.parentPrimitive || !this.parentPrimitive.isStable()) {
      result = null; 
    } else {
      result = this.inheritPropertyFromEquivalent("animate"); 
  
      if (!result && this.parentPrimitive) {
        result = this.parentPrimitive.inheritPropertyFromEquivalent("animateChildren");   
      }
    }
    if (result === true) result = standardAnimation;
    this.animation = result; // for quick access after call is made
    // log(result)
    return result;   
  }
}
  
