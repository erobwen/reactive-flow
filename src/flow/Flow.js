import getWorld from "../causality/causality.js";
export const world = getWorld({useNonObservablesAsValues: true, warnOnNestedRepeater: false});
export const { observable, repeat, finalize, withoutRecording, sameAsPreviousDeep } = world;
const log = console.log;
window.sameAsPreviousDeep = sameAsPreviousDeep;
window.world = world;
window.observable = observable;
let parents = [];


window.allFlows = {};

export class Flow {
  constructor(properties) {
    this.parent = parents.length > 0 ? parents[parents.length - 1] : null; // Note this can only be done in constructor! 
    this.target = properties.target ? properties.target : this.parent.target;
    this.key = properties.key ? properties.key : null;  
    delete properties.key;
    if (this.key === null) console.warn("Component with no key, add key for better performance.")
    for (let property in properties) {
      this[property] = properties[property];
    }
    
    let me = observable(this, this.key);
    me.setProperties(properties); // Set default values here
    if (!this.parent) {
      log("no parent!")
      me.onReBuildCreate();
    }
    window.allFlows[me.causality.id] = me;
    return me;
  }

  setProperties() {
    // throw new Error("Not implemented yet");
  }

  // requireProperties() {
  //   throw new Error("Not implemented yet");
  // }

  onReBuildCreate() {
    log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc. 
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process. 
  }

  onReBuildRemove() {
    if (this.buildRepeater) this.buildRepeater.dispose();
    if (this.integrationRepeater) this.integrationRepeater.dispose();
  }

  className() {
    let result; 
    withoutRecording(() => {
      result = this.constructor.name;
    });
    return result;    
  }

  toString() {
    return this.className() + ":" + this.causality.id + "(" + this.buildUniqueName() + ")";     
  }

  uniqueName() {
    let result;
    withoutRecording(() => {
      result = (this.key ? (this.key + ":") : "") + this.causality.id;
    });
    return result
  }

  buildUniqueName() {
    let result;
    withoutRecording(() => {
      result = this.key ? this.key : this.causality.id;
    });
    return result
  }

  getChild(keyOrPath) {
    if (typeof(keyOrPath) === "string") {
      const key = keyOrPath; 
      if (typeof(this.buildRepeater.buildIdObjectMap[key]) === 'undefined') return null;
      return this.buildRepeater.buildIdObjectMap[key]
    } else {
      const path = keyOrPath;
      const child = this.getChild(path.shift());
      if (path.length === 0) {
        return child;
      } else {
        return child.getChild(path);
      }
    }
  }

  getPath() {
    const tag = this.key ? this.key : "<no-tag>";
    let path;
    if (!this.parent) {
      return [];
    } else {
      path = this.parent.getPath();
      path.push(tag);
      return path; 
    }
  }

  render() {
    this.target.integrate(this, this.getPrimitive());
    return this;
  }

  getPrimitive() {
    // log("getPrimitive")
    const me = this;
    
    me.equivalentParent = parents.length > 0 ? parents[parents.length - 1] : null;
    if (me.equivalentParent) me.equivalentParent.equivalentChild = me;

    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat(this.toString() + ".buildRepeater", repeater => {
        log(repeater.causalityString());

        // Recursivley build down to primitives
        parents.push(me);
        me.primitive = me.build(repeater).getPrimitive();
        parents.pop();
      });
    }
    return me.primitive;
  }

  build() {
    throw new Error("Not implemented yet")
  }
}

/**
 * Primitive Flows
 */
export class PrimitiveFlow extends Flow {
  getPrimitive() {
    const me = this;
    me.primitive = me;
    
    finalize(me);
    if (!me.expandRepeater) {
      me.expandRepeater = repeat(me.toString() + ".expandRepeater", repeater => {

        // Expand known children (do as much as possible before integration)
        if (me.children) {
          for (let child of me.children) {
            child.getPrimitive();
          }
        }
      });
    }

    return me;
  }
}

export class Text extends PrimitiveFlow {
  setProperties({text}) {
    this.text = text;
  }
}

export class Row extends PrimitiveFlow {
  setProperties({children}) {
    this.children = children;
  }
}

export class Button extends PrimitiveFlow {
  setProperties({onClick, text}) {
    // log("button set properties");
    this.onClick = () => {
      console.log("clicked at: " + JSON.stringify(this.getPath()))
      onClick();
    }
    this.text = text; 
  }
}

export class HtmlElement extends PrimitiveFlow {
  setProperties({children, tagType}) {
    this.children = children;
    this.tagType =  tagType;
  }
}


export function when(condition, operation) {
  return repeat(() => {
    const value = condition() 
    if (value) {
      operation(value);
    }
  });
}
