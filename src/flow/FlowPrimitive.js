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
          childPrimitive.parentPrimitive = this; 
        }

        // Accumulate diffs from previous update
        if (this.unobservable().flowBuildNumber !== configuration.flowBuildNumber) {
          this.unobservable().flowBuildNumber = configuration.flowBuildNumber;
          const children = this.getChildren().map(flow => flow.getPrimitive());
          Object.assign(this.unobservable(), analyzeAddedRemovedResident(this.unobservable().lastChildren, children));
          this.unobservable().lastChildren = children;
          log("DIFF")
          log(this.unobservable());
        } else {
          log(this.unobservable().flowBuildNumber)
          log(configuration.flowBuildNumber)
          log(this.toString())
          throw new Error("Multiple updates! Not an error really, but it needs handling")
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
        if (child instanceof Flow) {
          yield child;
        }
      }
    } else if (this.children instanceof Flow) {
      yield child;
    }
  }

  getChildren() {
    return [...this.iterateChildren()];
  }

  getAnimation() {
    let result; 
    if (this.animate) {
      result = this.animate;
    } else if (this.parentPrimitive && this.parentPrimitive.animateChildren){
      result = this.parentPrimitive.animateChildren;
    } else {
      result = null; 
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