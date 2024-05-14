import { flowChanges } from "../flow.DOMTarget/DOMAnimation.js";
import { configuration, finalize, Flow, invalidateOnChange, repeat, state, trace } from "./Flow.js";
import { readFlowProperties, findTextAndKeyInProperties } from "../flow/flowParameters";
import { logMark } from "./utility.js";
import { standardAnimation } from "../flow.DOMTarget/ZoomFlyDOMNodeAnimation.js";

const log = console.log;

export class FlowPrimitive extends Flow {
    
  findKey(key) {
    if (this.key === key) return this;
    return this.findChild(key)
  }

  findChild(key) {
    // TODO: Use iterator!
    if (this.children) {
      for (let child of this.children) {
        if (child !== null) {
          let result = child.findKey(key);
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
        console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
        if (parentPrimitive === this) throw new Error("What the fuck just happened. ");
      }
      this.parentPrimitive = parentPrimitive
    } 

    finalize(this); // Finalize might not work if no key was used, it might not call onEstablish.
    if (!this.expandRepeater) {
      this.expandRepeater = repeat(this.toString() + ".expandRepeater", repeater => {
        if (trace) console.group(repeater.causalityString());
        if (trace) console.log([...state.workOnPriorityLevel]);

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

  inheritAnimation() {
    let result = this.inheritFromEquivalentCreator("animate"); 
  
    if (!result && this.parentPrimitive) {
      result = this.parentPrimitive.inheritFromEquivalentCreator("animateChildren");   
    }      
    
    if (!result && this.previousParentPrimitive) {
      result = this.previousParentPrimitive.inheritFromEquivalentCreator("animateChildren");   
    }
    
    if (result === true) result = standardAnimation;
    return result;
  }

  get animation() {
    if (!this.cachedAnimation) {
      invalidateOnChange(
        () => {
          this.cachedAnimation = this.inheritAnimation();
        },
        () => {
          logMark("deleting cache!!!!")
          delete this.cachedAnimation;
        }
      )
    } 
    return this.cachedAnimation; 
  }
}
  
