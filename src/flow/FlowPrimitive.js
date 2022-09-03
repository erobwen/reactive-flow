import { standardAnimation } from "../flow.DOMTarget/DOMFlipAnimation.js";
import { configuration, finalize, Flow, readFlowProperties, repeat, trace } from "./Flow.js";

const log = console.log;

export class FlowPrimitive extends Flow {
    
  constructor(...parameters) {
    super(readFlowProperties(parameters));
  }
  
  unobservable() {
    if (!this.causality.unobservable) {
      this.causality.unobservable = {
        lastChildren: [],
        flowBuildNumber: -1
      };
    } 
    return this.causality.unobservable;
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
    const me = this;

    finalize(me);
    if (!me.expandRepeater) {
      me.expandRepeater = repeat(me.toString() + ".expandRepeater", repeater => {
        if (trace) console.group(repeater.causalityString());

        // Expand known children (do as much as possible before integration)
        for (let child of me.iterateChildren()) {
          const childPrimitive = child.getPrimitive();
          if (childPrimitive) {
            childPrimitive.parentPrimitive = this; 
          }
        }

        // Accumulate diffs from previous update
        if (this.unobservable().flowBuildNumber !== configuration.flowBuildNumber) {
          this.unobservable().flowBuildNumber = configuration.flowBuildNumber;
          this.unobservable().lastChildrenBackup = this.unobservable().lastChildren;

          const children = this.getPrimitiveChildren();
          Object.assign(this.unobservable(), analyzeAddedRemovedResident(this.unobservable().lastChildren, children));
          this.unobservable().lastChildren = children;
        } else {
          const children = this.getPrimitiveChildren();
          Object.assign(this.unobservable(), analyzeAddedRemovedResident(this.unobservable().lastChildrenBackup, children));
          this.unobservable().lastChildren = children;

          console.warn("Multiple updates of same primitive!");
        }
        
        if (trace) console.groupEnd();
      }, {priority: 1});
    }

    return me;
  }

  dimensions() {
    return this.getPrimitive().dimensions();
  }

  * iterateChildren() {
    if (this.children instanceof Array) {
      for (let child of this.children) {
        if (child instanceof Flow && child !== null) {
          yield child;
        }
      }
    } else if (this.children instanceof Flow  && child !== null) {
      yield child;
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

  getAnimation() {
    let result = this.inheritPropertyFromEquivalent("animate"); 

    if (!result && this.parentPrimitive) {
      result = this.parentPrimitive.inheritPropertyFromEquivalent("animateChildren");   
    }

    return (result === true) ? standardAnimation : result;  
  }
}
  


export function analyzeAddedRemovedResident(oldList, newList) {
  const removed = [];
  const added = [];
  const resident = [];
  let index = 0;
  while(index < oldList.length) {
    const existingChild = oldList[index];
    if (!newList.includes(existingChild)) {
      removed.push(existingChild);
    }
    index++;
  }
  for(let newChild of newList) {
    if (!oldList.includes(newChild)) {
      added.push(newChild);
    } else if(!removed.includes(newChild)) {
      resident.push(newChild);
    }
  }
  return {removed, added, resident};
}