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
    let properties = readFlowProperties(arguments); 

    // Key & Parent
    if (!this.key) this.key = properties.key ? properties.key : null;
    delete properties.key;
    this.parent = parents.length > 0 ? parents[parents.length - 1] : null; // Note this can only be done in constructor! 
    // this.flowDepth = this.parent ? this.parent.flowDepth + 1 : 0; 
     
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
    // log("id: " + me.causality.id)
    
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

  // allNonProvidedProperties() {
  //   const result = []
  //   for (let property in this.properties) {
  //     if (!this.providedProperties[property]) {
  //       result.push(property);
  //     } 
  //   }
  //   return result;
  // }

  provide() { // Cannot be called within an if statement! 
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
    let classDescription = this.className();
    if (classDescription === "Flow" && this.description) classDescription = this.description;
    return classDescription + ":" + this.causality.id + "(" + this.buildUniqueName() + ")";     
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

  findChild(key) { 
    if (this.key === key) return this;
    return this.getPrimitive().findChild(key);
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
        //log(repeater.description + ":" + repeater.creationString());
      });
    }
    return me.primitive;
  }

  build(repeater) {
    if (this.buildFunction) {
      //log("-----------------")
      return this.buildFunction(this)
    }
    throw new Error("Not implemented yet")
  }

  button() {
    return this.target.button(readFlowProperties(arguments));
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

export function readFlowProperties(functionArguments) {
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
    if (arglist[0] === null) {
      arglist.shift();
    }    
    if (typeof(arglist[0]) === "object" && !arglist[0].causality) {
      Object.assign(properties, arglist.shift());
    }
    if (typeof(arglist[0]) === "object" && arglist[0].causality) {
      if (!properties.children) properties.children = [];
      properties.children.push(arglist.shift());
    }
    //if (properties.children && !(typeof(properties.children) instanceof Array)) properties.children = [properties.children];
  }
  return properties;
}

export function readFlowProperties2(arglist) {
  // Shortcut
  //if (typeof(arglist[0]) === "object" && !arglist[0].causality && typeof(arglist[1]) === "undefined") return arglist[0]
  
  // The long way
  let properties = {};
  while (arglist.length > 0) {
    if (typeof(arglist[0]) === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }  
    if (typeof(arglist[0]) === "string" && !arglist[0].causality) {
      properties.key = arglist.shift();
    }
    if (arglist[0] === null) {
      arglist.shift();
    }     
    if (typeof(arglist[0]) === "object" && !arglist[0].causality) {
      Object.assign(properties, arglist.shift());
    }
    if (typeof(arglist[0]) === "object" && arglist[0].causality) {
      if (!properties.children) properties.children = [];
      properties.children.push(arglist.shift());
    }
    //if (properties.children && !(typeof(properties.children) instanceof Array)) properties.children = [properties.children];
  }
  return properties;
}


export class FlowTargetPrimitive extends Flow {
  
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
    // me.primitive = me;
    
    // finalize(me);
    // if (!me.expandRepeater) {
    //   me.expandRepeater = repeat(me.toString() + ".expandRepeater", repeater => {
  
    //     // Expand known children (do as much as possible before integration)
    //     if (me.children) {
    //       for (let child of me.children) {
    //         if (child !== null) {
    //           child.getPrimitive();
    //         }
    //       }
    //     }
    //   });
    // }
  
    return me;
  }  
}

