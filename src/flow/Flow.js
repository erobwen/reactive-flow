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
  constructor(keyOrProperties, possiblyProperties) {
    // Arguments
    let properties; 
    if (typeof(keyOrProperties) === "string") {
      this.key = keyOrProperties;
      properties = possiblyProperties
    } else {
      properties = keyOrProperties;
    }
    if (!properties) properties = {};

    // Key & Parent
    if (!this.key) this.key = properties.key ? properties.key : null;
    delete properties.key;
    if (this.key === null) console.warn("Component with no key, add key for better performance.")
    this.parent = parents.length > 0 ? parents[parents.length - 1] : null; // Note this can only be done in constructor! 

    // Target propagation
    this.target = properties.target ? properties.target : this.parent.target;
    
    // Set properties by bypassing setProperties
    for (let property in properties) {
      let destination = property;
      if (property === "build") {
        destination = "buildFunction";
      }
      this[destination] = properties[property];
    }
    
    // Create observable
    let me = observable(this, this.key);
    
    // Set properties through interface
    me.setProperties(properties); // Set default values here
    if (!this.parent) {
      log("no parent!")
      me.onEstablish();
    }

    // Debug
    window.allFlows[me.causality.id] = me;
    return me;
  }

  setProperties() {
    // throw new Error("Not implemented yet");
  }

  // requireProperties() {
  //   throw new Error("Not implemented yet");
  // }

  onEstablish() {
    // log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc. 
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process. 
  }
  
  onDispose() {
    // log("Removed:" + this.toString());
    if (this.buildRepeater) this.buildRepeater.dispose();
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

  activate() {
    // this.target.integrate(this, this.getPrimitive());
    this.target.integrate(this);
    return this;
  }

  getPrimitive() {
    // log("getPrimitive")
    const me = this;

    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat(this.toString() + ".buildRepeater", repeater => {
        log(repeater.causalityString());
        
        // Build this one step
        parents.push(me);
        const build = me.build(repeater);
        parents.pop();

        // Establish relationship between child, parent.
        build.equivalentParent = me;
        me.equivalentChild = build;

        // Recursive call
        me.primitive = build.getPrimitive();
        log(repeater.description + ":" + repeater.creationString());
      });
    }
    return me.primitive;
  }

  build(repeater) {
    if (this.buildFunction) {
      this.buildFunction(repeater)
    }
    throw new Error("Not implemented yet")
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

function argumentsToArray(functionArguments) {
  return Array.prototype.slice.call(functionArguments);
};

export function readArguments(functionArguments) {
  const arglist = argumentsToArray(functionArguments);
  let properties = {};
  if (typeof(arglist[0]) === "string" && !arglist[0].causality) {
    properties.key = arglist.shift();
  }
  if (typeof(arglist[0]) === "object" && !arglist[0].causality) {
    Object.assign(properties, arglist.shift());
  }
  if (arglist.length > 0) {
    if (!properties) properties = {};
    properties.children = arglist;
  }
  return properties;
}
