import { flowChanges } from "../flow.DOMTarget/DOMAnimation.js";
import { standardAnimation } from "../flow.DOMTarget/DOMFlowAnimation.js";
import { configuration, finalize, Flow, readFlowProperties, repeat, trace } from "./Flow.js";
import { colorLog } from "./utility.js";

const log = console.log;

export class FlowPrimitive extends Flow {
    
  constructor(...parameters) {
    super(readFlowProperties(parameters));
  }
  
  findChild(key) {
    if (this.key === key) return this;
    // TODO: Use iterator!
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
    if (parentPrimitive && this.parentPrimitive !== parentPrimitive) {
      if (this.parentPrimitive) {
        log("FlowPrimitive.getPrimitive");
        log(this.parentPrimitive);
        log("-->")
        log(parentPrimitive)
        console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
      }
      this.parentPrimitive = parentPrimitive
    } 
    return this;
  }

  ensureBuiltRecursive(flowTarget, parentPrimitive) {
    const name = this.toString(); // For chrome debugger
    
    if (flowTarget) this.visibleOnTarget = flowTarget;
    if (parentPrimitive && this.parentPrimitive !== parentPrimitive) {
      if (this.parentPrimitive) {
        log("FlowPrimitive.ensureBuiltRecursive");
        log(this.parentPrimitive);
        log("-->")
        log(parentPrimitive)
        console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
        if (parentPrimitive === this) throw new Error("What the fuck just happened. ");
      }
      this.parentPrimitive = parentPrimitive
    } 

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
            this.previousParentPrimitive = this.parentPrimitive;
            this.parentPrimitive = null;
          }
        }

        // Populate portals and stuff
        let scan = this.equivalentCreator; 
        while(scan) {
          if (scan.visibleOnTarget === this.visibleOnTarget) {
            scan = null; 
          } else {
            if (this.parentPrimitive && this.parentPrimitive !== scan.parentPrimitive) {
              if (this.parentPrimitive) {
                log("FlowPrimitive, scanning equivalent creators");
                log(scan.parentPrimitive);
                log("-->")
                log(this.parentPrimitive)
                console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
              }
              scan.parentPrimitive = this.parentPrimitive
            }         
            scan.parentPrimitive = this.parentPrimitive; 
            scan.visibleOnTarget = this.visibleOnTarget;
            scan.isVisible = !!this.visibleOnTarget
            scan.onVisibilityWillChange(scan.isVisible);
            scan = scan.equivalentCreator;
          }
        }

        // This will trigger getPrimitive on abstract child flows. 
        this.childPrimitives = this.getPrimitiveChildren();

        // Expand known children (do as much as possible before integration)
        for (let childPrimitive of this.childPrimitives) { 
          childPrimitive.ensureBuiltRecursive(flowTarget, this);
        }
      
        if (trace) console.groupEnd();
      }, {priority: 1});
    }
    return this; 
  }
  
  onVisibilityWillChange() {}


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
    return (!flowChanges.globallyAdded[this.id] || this.animateChildrenWhenThisAppears) && (!this.primitiveParent || this.primitiveParent.isStable());
  }

  getAnimation() {
    // return null;
    let result; 
    if (this.parentPrimitive && !this.parentPrimitive.isStable()) {
      result = null; 
    } else {
      result = this.inheritFromEquivalentCreator("animate"); 
  
      if (!result && this.parentPrimitive) {
        result = this.parentPrimitive.inheritFromEquivalentCreator("animateChildren");   
      }      
      
      if (!result && this.previousParentPrimitive) {
        result = this.previousParentPrimitive.inheritFromEquivalentCreator("animateChildren");   
      }
    }
    if (result === true) result = standardAnimation;
    this.animation = result; // for quick access after call is made
    return result;   
  }
}
  
