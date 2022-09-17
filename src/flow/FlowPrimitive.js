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

  getPrimitive() {
    this.ensureBuiltRecursive();
    return this;
  }

  ensureBuiltRecursive() {
    const name = this.toString(); // For chrome debugger
    finalize(this); // Finalize might not work if no key was used, it might not call onEstablish.
    if (!this.expandRepeater) {
      this.expandRepeater = repeat(this.toString() + ".expandRepeater", repeater => {
        if (trace) console.group(repeater.causalityString());

        // Initialize state if needed
        if (!this.unobservable.childPrimitives) {
          this.unobservable.childPrimitives = [];
          this.unobservable.flowBuildNumber = null;
        } 
        
        // Accumulate diffs from previous update
        if (this.unobservable.flowBuildNumber !== configuration.flowBuildNumber) {
          this.unobservable.flowBuildNumber = configuration.flowBuildNumber;
          this.unobservable.previousChildPrimitives = this.unobservable.childPrimitives;
        } else {
          console.warn("Multiple updates of same primitive!");
        }
        const childPrimitives = this.getPrimitiveChildren(); // Will trigger recursive call once it reaches primitive
        this.unobservable.childPrimitives = childPrimitives;
        Object.assign(this.unobservable, analyzeAddedRemovedResident(this.unobservable.previousChildPrimitives, childPrimitives));
        log(this.unobservable);

        // Expand known children (do as much as possible before integration)
        for (let childPrimitive of childPrimitives) { 
          childPrimitive.parentPrimitive = this; 
        }
      
        if (trace) console.groupEnd();
      }, {priority: 1});
    }
  }
  
  * iterateChildren() {
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
      let primitive = child.getPrimitive();
      if (primitive) yield primitive;
    }
  }

  getChildren() {
    return [...this.iterateChildren()];
  }

  getPrimitiveChildren() {
    return [...this.iteratePrimitiveChildren()];
  }

  isStable() {
    return !flowChanges.globallyAdded[this.id] && (!this.primitiveParent || this.primitiveParent.isStable());
  }

  getAnimation() {
    let result; 
    if (!this.primitiveParent || !this.primitiveParent.isStable()) {
      result = null; 
    } else {
      result = this.inheritPropertyFromEquivalent("animate"); 
  
      if (!result && this.parentPrimitive) {
        result = this.parentPrimitive.inheritPropertyFromEquivalent("animateChildren");   
      }
  
    }
    if (result === true) result = standardAnimation;
    this.animation = result; // for quick access after call is made
    return result;   
  }
}
  


export function analyzeAddedRemovedResident(oldList, newList) {
  const removed = {};
  const added = {};
  const resident = {};
  const incoming = {};
  const outgoing = {};
  let index = 0;
  while(index < oldList.length) {
    const existingChild = oldList[index];
    if (!newList.includes(existingChild)) {
      removed[existingChild.id] = existingChild;
    }
    index++;
  }
  for(let newChild of newList) {
    if (!oldList.includes(newChild)) {
      added[newChild.id] = newChild;
    } else if(!removed[newChild.id]) {
      resident[newChild.id] = newChild;
    }
  }
  return {removed, added, resident, incoming, outgoing};
}