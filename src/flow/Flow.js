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
  constructor() {   
    // Arguments
    let properties = readFlowArguments(arguments); 
    
    // Key & Parent
    if (!this.key) this.key = properties.key ? properties.key : null;
    delete properties.key;
    this.parent = parents.length > 0 ? parents[parents.length - 1] : null; // Note this can only be done in constructor! 
    
    //Provided/Inherited properties
    this.providedProperties = {target: true};
    if (this.parent) {
      for (let property in this.parent.providedProperties) {
        this.providedProperties[property] = true;
        this[property] = this.parent[property];
      }
    }
    
    // Set properties by bypassing setProperties
    for (let property in properties) {
      let destination = property;
      if (property === "build") destination = "buildFunction";
      this[destination] = properties[property];
    }
    
    // Create observable
    let me = observable(this, this.key);
    
    // Set properties through interface
    me.setProperties(properties); // Set default values here
    
    // Emulate onEstablish for top element.
    if (!this.parent) {
      me.onEstablish();
    }
    
    // Debug & warning
    window.allFlows[me.causality.id] = me;
    if (me.key === null && me.parent) console.warn("Component " + me.toString() + " with no key, add key for better performance.")

    return me;
  }

  provide() {
    const provided = argumentsToArray(arguments)
    for (let property of provided) {
      this.providedProperties[property] = true;
    }
  }

  unprovide() {
    const provided = argumentsToArray(arguments)
    for (let property of provided) {
      delete this.providedProperties[property];
    }
  }

  setProperties() {
    // throw new Error("Not implemented yet");
  }

  setState() {
    // throw new Error("Not implemented yet");
  }
  
  disposeState() {
    // throw new Error("Not implemented yet");
  }

  onEstablish() {
    this.setState();
    // log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc. 
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process. 
  }
  
  onDispose() {
    // log("Disposed:" + this.toString());
    if (this.buildRepeater) this.buildRepeater.dispose();
    this.disposeState();
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
        if (build !== null) {
          build.equivalentParent = me;
          me.equivalentChild = build;
        }

        // Recursive call
        me.primitive = (build !== null) ? build.getPrimitive() : null;
        log(repeater.description + ":" + repeater.creationString());
      });
    }
    return me.primitive;
  }

  build(repeater) {
    if (this.buildFunction) {
      log("-----------------")
      return this.buildFunction(this)
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

export function readFlowArguments(functionArguments) {
  // Shortcut
  if (typeof(functionArguments[0]) === "object" && !functionArguments[0].causality && typeof(functionArguments[1]) === "undefined") return functionArguments[0]
  
  // The long way
  const arglist = argumentsToArray(functionArguments);
  let properties = {};
  while (arglist.length > 0) {
    if (typeof(arglist[0]) === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }  
    if (typeof(arglist[0]) === "string" && !arglist[0].causality) {
      properties.key = arglist.shift();
    }
    if (typeof(arglist[0]) === "object" && !arglist[0].causality) {
      Object.assign(properties, arglist.shift());
    }
    if (typeof(arglist[0]) === "object" && arglist[0].causality) {
      if (!properties.children) properties.children = [];
      properties.children.push(arglist.shift());
    }
  }
  return properties;
}
