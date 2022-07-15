import getWorld from "../causality/causality.js";
export const world = getWorld({
  useNonObservablesAsValues: true,
  warnOnNestedRepeater: false,
  emitReBuildEvents: true, 
  onEventGlobal: event => collectEvent(event)
});
export const {
  observable,
  isObservable, 
  repeat,
  finalize,
  withoutRecording,
  sameAsPreviousDeep,
} = world;
const log = console.log;
window.sameAsPreviousDeep = sameAsPreviousDeep;
window.world = world;
window.observable = observable;
let creators = [];

const configuration = {
  warnWhenNoKey: false
}

window.allFlows = {};
export class Flow {
  constructor() {
    let properties = readFlowProperties(arguments);
    // log("Flow constructor: " + this.className() + "." + properties.key);

    // Key & Creator
    if (!this.key) this.key = properties.key ? properties.key : null;
    delete properties.key;
    this.creator = creators.length > 0 ? creators[creators.length - 1] : null; // Note this can only be done in constructor!
    // this.flowDepth = this.creator ? this.creator.flowDepth + 1 : 0;

    //Provided/Inherited properties
    this.providedProperties = { target: true };
    if (this.creator) {
      for (let property in this.creator.providedProperties) {
        this.providedProperties[property] = true;
        this[property] = this.creator[property];
      }
    }
    for (let property of this.withdraw()) {
      delete this.providedProperties[property];
    }
    for (let property of this.provide()) {
      this.providedProperties[property] = true;
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

    // Emulate onEstablish for top element. This will be done anyway with the integrationRepeater...
    // however, what happens with flows without keys? Will they never get an establishing call? They should get one every time...
    // if (!me.creator) {
    //   me.onEstablish();
    // }

    // Debug & warning
    window.allFlows[me.causality.id] = me;
    if (configuration.warnWhenNoKey && me.key === null && me.creator)
      console.warn(
        "Component " +
          me.toString() +
          " with no key, add key for better performance."
      );

    return me;
  }

  /**
   * Lifecycle methods
   */

  setProperties() {
    // throw new Error("Not implemented yet");
  }

  setState() {
    // throw new Error("Not implemented yet");
    // Use this.derrive(action) to establish reactive relations here. 
  }

  disposeState() {
    // throw new Error("Not implemented yet");
  }

  provide() {
    return [];
  }

  withdraw() {
    return [];
  }

  build(repeater) {
    if (this.buildFunction) {
      //log("-----------------")
      return this.buildFunction(this);
    }
    throw new Error("Not implemented yet");
  }

  
  /**
   * Internal methods
   */

  derrive(action) {
    if (this.derriveRepeater) {
      throw new Error(
        "Only one derrive call in setState allowed! But you can do multiple things in that one. Use causality/repeat for more options"
      );
    }
    this.derriveRepeater = repeat(action);
  }

  onEstablish() {
    this.setState();
    // log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc.
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process.
  }

  onDispose() {
    if (this.buildRepeater) {
      if (this.buildRepeater.buildIdObjectMap) {
        for (let key in this.buildRepeater.buildIdObjectMap) {
          const object = this.buildRepeater.buildIdObjectMap[key]; 
          if (typeof(object.onDispose) === "function") object.onDispose();
        }
      }

      this.buildRepeater.dispose();
    } 
    if (this.derriveRepeater) this.derriveRepeater.dispose(); // Do you want a disposed repeater to nullify all its writed values? Probably not....

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
    if (classDescription === "Flow" && this.description)
      classDescription = this.description;
    return (
      classDescription +
      ":" +
      this.causality.id +
      "(" +
      this.buildUniqueName() +
      ")"
    );
  }

  uniqueName() {
    let result;
    withoutRecording(() => {
      result = (this.key ? this.key + ":" : "") + this.causality.id;
    });
    return result;
  }

  buildUniqueName() {
    let result;
    withoutRecording(() => {
      result = this.key ? this.key : this.causality.id;
    });
    return result;
  }

  findChild(key) {
    if (this.key === key) return this;
    return this.getPrimitive().findChild(key);
  }

  getChild(keyOrPath) {
    if (typeof keyOrPath === "string") {
      const key = keyOrPath;
      if (typeof this.buildRepeater.buildIdObjectMap[key] === "undefined")
        return null;
      return this.buildRepeater.buildIdObjectMap[key];
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
    if (!this.creator) {
      return [];
    } else {
      path = this.creator.getPath();
      path.push(tag);
      return path;
    }
  }

  activate() {
    // this.target.integrate(this, this.getPrimitive());
    this.target.integrate(this);
    return this;
  }

  findEquivalentAndReuse(establishedBuild, newBuild, creations) {
    function hasEquivalentThroughKey(object) {
      if (!object) return false; 
      return !!object.causality.forwardTo;
    }

    function findEquivalents(newFlowId, establishedFlow, newFlow) {
      if (!creations[newFlowId]) return; // Limit search! otherwise we could go off road!

      if (visited[newFlowId]) return; // Already done!
      visited[newFlowId] = 1;
    
      if (establishedFlow.className() === newFlow.className()) {
        newFlow.causality.copyToFlow = establishedFlow;
        findEquivalentsRecursive(newFlow.causality.id, establishedFlow.causality.target, newFlow.causality.target);
      }
    }
    
    function findEquivalentsRecursive(newFlowId, establishedTarget, newTarget) {
      if (!creations[newFlowId]) return; // Limit search! otherwise we could go off road!

      if (visited[newFlowId] === 2) return; // Already done!
      visited[newFlowId] = 2;

      for (let property in newTarget) {
        const newChildFlow = newTarget[property]; 
        if (isObservable(newChildFlow)) {
          if (hasEquivalentThroughKey(newChildFlow)) {
            findEquivalentsRecursive(newChildFlow.causality.id, target, newChildFlow.causality.forwardTo.causality.target);
          } else {
            findEquivalents(newChildFlow.causality.id, establishedTarget[property], newChildFlow);
          }
        }
      }
      const children = newTarget.children; 
      const establishedChildren = establishedTarget.children; 
      if (children instanceof Array && establishedChildren instanceof Array) {
        let index = 0;
        let establishedIndex = 0;

        while(index < children.length && establishedIndex < establishedChildren.length) {
          while(hasEquivalentThroughKey(children[index])) index++;
          while(hasEquivalentThroughKey(establishedChildren[establishedIndex])) establishedIndex++;
          const newChildFlow = children[index];
          const establishedChildFlow = establishedChildren[establishedIndex];
          if (newChildFlow instanceof Flow && establishedChildFlow instanceof Flow) {
            findEquivalents(newChildFlow.causality.id, establishedChildFlow, newChildFlow)
          }
          index++;
          establishedIndex++;
        }
      }
    }

    let visited = {};
    if (establishedBuild === newBuild) {
      findEquivalentsRecursive(newBuild.causality.id, establishedBuild.causality.target, newBuild.causality.forwardTo.causality.target);
    } else {
      findEquivalents(newBuild.causality.id, establishedBuild, newBuild);
    }
    
    function translateReference(reference) {
      if (reference instanceof Flow) {
        if (reference.causality.copyToFlow) {
          const result = reference.causality.copyToFlow;
          delete reference.causality.copyToFlow;
          return result; 
        }
      }
      return reference;
    }

    for (let id in creations) {
      const newFlow = creations[id]; 
      const newTarget = newFlow.causality.target; 
      if (newFlow.causality.copyToFlow) {
        const establishedFlow = newFlow.causality.copyToFlow;
        for (let property in newTarget) { // No observation! 
          establishedFlow[property] = translateReference(newTarget[property]); // Possibly trigger! 
        }
        const children = newTarget.children; // No observation!
        if (children instanceof Array) {
          let index = 0;
          while(index < children.length) {
            children[index] = translateReference(children[index]); // Possibly trigger! (will trigger later on final assignment) 
            index++;
          }
        }
      }
    }

    return establishedBuild;
  }

  getPrimitive() {
    // log("getPrimitive")
    const me = this;

    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat(
        this.toString() + ".buildRepeater",
        (repeater) => {
          console.group(repeater.causalityString());
          
          // Pushing
          collectingCreationsStack.push([]);
          targetStack.push(this.target);
          creators.push(me);

          let build = me.build(repeater);
          
          // Popping
          creators.pop();
          targetStack.pop();
          const creations = collectingCreationsStack.pop();

          // Reuse flows without keys depending on their placement in data structure.
          if (me.previousBuild) {
            build = me.findEquivalentAndReuse(me.previousBuild, build, creations);
          }
          me.previousBuild = build;

          // Establish relationship between equivalent child, creator.
          if (build !== null) {
            build.equivalentCreator = me;
            me.equivalentChild = build;
          }

          // Recursive call
          me.primitive = build !== null ? build.getPrimitive() : null;
          //log(repeater.description + ":" + repeater.creationString());
          console.groupEnd();
        }
      );
    }
    return me.primitive;
  }
}

export function when(condition, operation) {
  return repeat(() => {
    const value = condition();
    if (value) {
      operation(value);
    }
  });
}

function argumentsToArray(functionArguments) {
  return Array.prototype.slice.call(functionArguments);
}

export function readFlowProperties(functionArguments) {
  // Shortcut
  if (
    typeof functionArguments[0] === "object" &&  
    functionArguments[0] !== null &&
    !functionArguments[0].causality &&
    typeof functionArguments[1] === "undefined"
  )
    return functionArguments[0];

  // The long way
  const arglist = argumentsToArray(functionArguments);
  let properties = {};
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }
    if (typeof arglist[0] === "string" && !arglist[0].causality) {
      properties.key = arglist.shift();
    }
    if (arglist[0] === null) {
      arglist.shift();
    }
    if (typeof arglist[0] === "object" && !arglist[0].causality) {
      Object.assign(properties, arglist.shift());
    }
    if (typeof arglist[0] === "object" && arglist[0].causality) {
      if (!properties.children) properties.children = [];
      properties.children.push(arglist.shift());
    }
    //if (properties.children && !(typeof(properties.children) instanceof Array)) properties.children = [properties.children];
  }
  return properties;
}

export function readFlowProperties2(arglist, config) {
  let singleStringAsText = config ? config.singleStringAsText : null;
  // Shortcut
  //if (typeof(arglist[0]) === "object" && !arglist[0].causality && typeof(arglist[1]) === "undefined") return arglist[0]

  // The long way
  let properties = {};
  let readOneString = false; 
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }
    if (typeof arglist[0] === "string" && !arglist[0].causality) {
      if (singleStringAsText) {
        if (!readOneString) {
          properties.text = arglist.shift();
        } else {
          properties.key = properties.text; 
          properties.text = arglist.shift();
        }
      } else {
        properties.key = arglist.shift();
      }
      readOneString = true;
    }
    if (arglist[0] === null) {
      arglist.shift();
    }
    if (typeof arglist[0] === "object" && !arglist[0].causality) {
      Object.assign(properties, arglist.shift());
    }
    if (typeof arglist[0] === "object" && arglist[0].causality) {
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

  dimensions() {
    // Should return an object of the form {width: _, height: _}
  }
}

export function flow(descriptionOrBuildFunction, possibleBuildFunction) {
  let description;
  let buildFunction;
  if (typeof descriptionOrBuildFunction === "string") {
    description = descriptionOrBuildFunction;
    buildFunction = possibleBuildFunction;
  } else {
    buildFunction = descriptionOrBuildFunction;
  }
  function flowBuilder() {
    const flow = new Flow(readFlowProperties(arguments), buildFunction);
    if (description) flow.description = description;
    return flow;
  }
  return flowBuilder;
}

let collectingCreationsStack = [] 
function collectEvent(event) {
  // log("pre collect event..." + event.type);
  if (collectingCreationsStack.length > 0 && (event.type === "create"  || event.type === "reCreate")) {
    // log("collectEvent:")
    // log(event)
    const collectingCreations = collectingCreationsStack[collectingCreationsStack.length - 1];
    const object = event.object;
    collectingCreations[object.causality.id] = object;
  }
}


let targetStack = [];
