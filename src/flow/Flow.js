import getWorld from "../causality/causality.js";

export const world = getWorld({
  useNonObservablesAsValues: true,
  warnOnNestedRepeater: false,
  emitReBuildEvents: true, 
  priorityLevels: 3,
  // onEventGlobal: event => collectEvent(event)
  onFinishedPriorityLevel: onFinishedPriorityLevel
});
export const {
  transaction,
  observable,
  deeplyObservable,
  isObservable, 
  repeat,
  finalize,
  withoutRecording,
  sameAsPreviousDeep,
  workOnPriorityLevel,
} = world;
export const model = deeplyObservable;
const log = console.log;
window.sameAsPreviousDeep = sameAsPreviousDeep;
window.world = world;
window.observable = observable;
export let creators = [];


export const configuration = {
  warnWhenNoKey: false,
  traceReactivity: false,
  defaultTransitionAnimations: null,
  onFinishReBuildingFlowCallbacks: [],
  onFinishReBuildingDOMCallbacks:  [],

}

export let trace = false;
export let activeTrace = false; 
export const activeTraceModel = model({
  on: false 
})
window.activeTrace = activeTraceModel;
repeat(() => {
  activeTrace = activeTraceModel.on;
})

export function setFlowConfiguration(newConfiguration) {
  Object.assign(configuration, newConfiguration);
  trace = configuration.traceReactivity;
}

function onFinishedPriorityLevel(level, finishedAllLevels) {
  if (trace) log("<<<finished priority: " + level + ">>>");
  if (finishedAllLevels) log("no more repeaters...");

  // Finished re building flow with expanded primitives. Measure bounds and style before FLIP animation. 
  if (level === 1) {
    configuration.onFinishReBuildingFlowCallbacks.forEach(callback => callback())
  }

  // Let flow rebuild the DOM, while not removing nodes of animated flows (they might move if inserted elsewhere)

  // Finished re building DOM, proceed with animations.  
  if (level === 2) {
    configuration.onFinishReBuildingDOMCallbacks.forEach(callback => callback())
  }
}

window.allFlows = {};
export class Flow {
  get id() {
    return this.causality.id;
  }

  get unobservable() {
    if (!this.causality.unobservable) this.causality.unobservable = this.initialUnobservables();
    return this.causality.unobservable;
  }

  initialUnobservables() {
    return {
      removed: {},
      added: {},
      resident: {},
      incoming: {},
      outgoing: {}
    };
  }

  constructor(...parameters) {
    let properties = findKeyInProperties(readFlowProperties(parameters));
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

  inherit(property) {
    if (typeof(this[property]) !== "undefined") {
      return this[property]
    } else if (this.creator) {
      return this.creator.inherit(property);
    }
    return null;
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
    if (!this.derriveRepeaters) {
      this.derriveRepeaters = [];
    }
    this.derriveRepeaters.push(repeat(action));
  }

  ensureEstablished() {
    if (!this.unobservable.established) {
      this.onEstablish();
    }
  }

  onEstablish() {
    this.causality.established = true; 
    this.unobservable.established = true; 
    window.allFlows[this.causality.id] = this;
    creators.push(this);
    this.setState();
    creators.pop();
    if (trace) log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc.
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process.
  }

  onRemoveFromFlowTarget() {
    if (this.onClose) {
      this.onClose();
    }
  }

  onDispose() {
    delete window.allFlows[this.causality.id];
    // Dispose created by repeater in call. 
    if (trace) log("Disposed:" + this.toString());
    if (this.buildRepeater) {
      this.buildRepeater.notifyDisposeToCreatedObjects();
      this.buildRepeater.dispose();
    }
    if (this.derriveRepeaters) this.derriveRepeaters.map(repeater => repeater.dispose()); // Do you want a disposed repeater to nullify all its writed values? Probably not....
    this.disposeState();
  }

  visibilitySet(visibility) {
    // Called if the visibility is changed for this component. 
    // Since Flow allows hidden component that maintain their state but are not disposed, 
    // this is how you know if your component is visible.  
  }

  className() {
    let result;
    withoutRecording(() => {
      result = this.constructor.name;
    });
    return result;
  }

  toString() {
    let classNameOverride;
    withoutRecording(() => {
      classNameOverride = this.classNameOverride;
    });

    let classDescription = classNameOverride ? classNameOverride : this.className();
    if (classDescription === "Flow" && this.description)
      classDescription = this.description;
    return (
      classDescription +
      ":" +
      this.causality.id +
      this.buildUniqueName()
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
      result = this.key ? this.key : null;
    });
    if (!result) return "";
    return "(" + result + ")";
  }

  findChild(key) {
    if (this.key === key) return this;
    const primitive = this.getPrimitive();
    if (primitive instanceof Array) {
      for (let fragment of primitive) {
        const result = fragment.findChild();
        if (result) return result; 
      }
      return null;
    } else {
      return primitive.findChild(key);
    }
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

  ensureBuiltRecursive() {
    workOnPriorityLevel(1, () => this.getPrimitive(null).ensureBuiltRecursive());
    return this.getPrimitive();
  }

  getPrimitive(parentPrimitive) {
    // log("getPrimitive")
    const me = this;
    const name = this.toString(); // For chrome debugger.
    this.parentPrimitive = parentPrimitive;

    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat(
        this.toString() + ".buildRepeater",
        (repeater) => {
          if (trace) console.group(repeater.causalityString());
          
          // Pushing
          creators.push(me);

          // Build and rebuild
          me.newBuild = me.build(repeater);
          repeater.finishRebuilding();
          me.newBuild = repeater.establishedShapeRoot;

          // Establish relationship between equivalent child and this (its creator).
          if (me.newBuild !== null) {
            if (me.newBuild instanceof Array) {
              for (let fragment of me.newBuild) {
                fragment.equivalentCreator = me;
              }
            } else {
              me.newBuild.equivalentCreator = me;
            }
            me.equivalentChild = me.newBuild;
          }
          
          // Popping
          creators.pop();
         
          // Recursive call
          if (!me.newBuild) {
            me.primitive = null; 
          } else if (!(me.newBuild instanceof Array)) {
            me.primitive = me.newBuild.getPrimitive(parentPrimitive) 
          } else {
            me.primitive = me.newBuild
              .map(fragment => fragment.getPrimitive(parentPrimitive))
              .reduce((result, childPrimitive) => {
                if (childPrimitive instanceof Array) {
                  childPrimitive.forEach(fragment => result.push(fragment));
                } else {
                  result.push(childPrimitive);
                }
              }, []);
          }

          if (trace) console.groupEnd();
        }, 
        {
          priority: 1, 
          rebuildShapeAnalysis: {
            allowMatch: (establishedFlow, newFlow) => {
              // log(establishedFlow instanceof Flow);
              // log(newFlow instanceof Flow);
              // log(newFlow.className() === establishedFlow.className());
              // log(newFlow.classNameOverride === establishedFlow.classNameOverride);
              return (establishedFlow instanceof Flow && newFlow instanceof Flow  
                && (newFlow.className() === establishedFlow.className()) 
                && (newFlow.classNameOverride === establishedFlow.classNameOverride));
            },
            shapeRoot: () => me.newBuild,
            slotsIterator: function*(establishedObject, newObject, hasKey) {
              if (establishedObject instanceof Array && newObject instanceof Array) {
                let newIndex = 0;
                let establishedIndex = 0;
                while(newIndex < newObject.length) {
                  while(hasKey(newObject[newIndex]) && newIndex < newObject.length) newIndex++;
                  while(hasKey(establishedObject[establishedIndex]) && establishedIndex < establishedObject.length) establishedIndex++;
                  const establishedChild = establishedObject[establishedIndex];
                  const newChild = newObject[newIndex]

                  if (isObservable(newChild) && isObservable(establishedChild)) {
                    yield [establishedChild, newChild];
                  }

                  newIndex++;
                  establishedIndex++;
                }  
              } else if (establishedObject instanceof Flow && newObject instanceof Flow) {
                for (let property in newObject) {
                  if (property === "children") {
                    yield * this.slotsIterator(
                      establishedObject[property], 
                      newObject[property],
                      hasKey
                    )
                  } else {
                    const establishedChild = establishedObject[property];
                    const newChild = newObject[property]
  
                    if (isObservable(newChild) && isObservable(establishedChild)) {
                      yield [establishedChild, newChild];
                    }
                  }
                }
              }
            },
            translateReferences: (flow, translateReference) => {
              for (let property in flow) {
                flow[property] = translateReference(flow[property]); 
              }
              const children = flow.children;
              if (children instanceof Array) {
                let index = 0;
                while(index < children.length) {
                  children[index] = translateReference(children[index]);
                  index++;
                }
              }
            }
          }
        }
      );
    } else {
      // If parent primitive was null on first call.
      if (me.newBuild) me.newBuild.getPrimitive(parentPrimitive);
    }
    return me.primitive;
  }
  
  dimensions() {
    if (!this.key) console.warn("It is considered unsafe to use dimensions on a flow without a key. The reason is that a call to dimensions from a parent build function will finalize the flow early, and without a key, causality cannot send proper onEstablish event to your flow component before it is built");
    const primitive = this.getPrimitive();
    if (primitive instanceof Array) throw new Error("Dimensions not supported for fragmented components.");
    return primitive ? primitive.dimensions() : null;
  }

  getEquivalentRoot() {
    if (!this.equivalentCreator) return this;
    return this.equivalentCreator.getEquivalentRoot();
  }

  inherit(property) {
    if (!this[property]) {
      this[property] = this.creator.inherit(property);
    }
    return this[property];
  }

  inheritPropertyFromEquivalent(property) {
    const propertyValue = this[property];
    if (typeof(propertyValue) !== "undefined") {
      return propertyValue;
    } else if (this.equivalentCreator) {
      return this.equivalentCreator.inheritPropertyFromEquivalent(property);
    } else {
      return null;
    }
  }

  show(value) {
    return value ? this : null; 
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

export function findKeyInProperties(properties) {
  if (!properties.stringsAndNumbers) return properties;
  if (properties.stringsAndNumbers.length) {
    properties.key = properties.stringsAndNumbers.pop();
  }
  if (properties.stringsAndNumbers.length) {
    throw new Error("Found too many loose strings in flow parameters");
  }
  delete properties.stringsAndNumbers;
  return properties; 
}

export function findTextAndKeyInProperties(properties) {
  log("findText and... ")
  console.log(properties)
  if (!properties.stringsAndNumbers) return properties;
  if (properties.stringsAndNumbers.length) {
    properties.text = properties.stringsAndNumbers.pop();
  }
  if (properties.stringsAndNumbers.length) {
    properties.key = properties.stringsAndNumbers.pop();
  }
  if (properties.stringsAndNumbers.length) {
    throw new Error("Found too many loose strings in flow parameters");
  }
  delete properties.stringsAndNumbers;
  return properties;
}

export function findTextKeyAndOnClickInProperties(properties) {
  log("-------------------")
  findTextAndKeyInProperties(properties);
  log({...properties});
  if (!properties.functions) return properties;
  if (properties.functions.length) {
    properties.onClick = properties.functions.pop();
  }
  if (properties.functions.length) {
    throw new Error("Found too many loose functions in flow parameters");
  }
  delete properties.functions;
  return properties;
}

export function findBuildInProperties(properties) {
  findKeyInProperties(properties);
  if (!properties.functions) return properties;
  if (properties.functions.length) {
    properties.buildFunction = properties.functions.pop();
  }
  if (properties.functions.length) {
    throw new Error("Found too many loose functions in flow parameters");
  }
  delete properties.functions;
  return properties;
}

export function readFlowProperties(arglist, config) {
  // Shortcut if argument is a properties object
  if (arglist[0] !== null && typeof(arglist[0]) === "object" && !isObservable(arglist[0]) && typeof(arglist[1]) === "undefined") {
    return arglist[0];
  }

  // The long way
  let properties = {};
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function" && !arglist[0].causality) {
      if (!properties.functions) {
        properties.functions = [];
      }
      properties.functions.push(arglist.shift());
    }

    // String or numbers
    if ((typeof arglist[0] === "string" || typeof arglist[0] === "number") && !arglist[0].causality) {
      if (!properties.stringsAndNumbers) {
        properties.stringsAndNumbers = [];
      }
      properties.stringsAndNumbers.push(arglist.shift());
    }

    // No argument, skip!
    if (!arglist[0]) {
      arglist.shift();
      continue;
    }

    if (arglist[0] === true) {
      throw new Error("Could not make sense of flow parameter 'true'");
    }

    // Not a flow object
    if (typeof arglist[0] === "object" && !arglist[0].causality) {
      if (arglist[0] instanceof Array) {
        if (!properties.children) properties.children = [];
        for (let child of arglist.shift()) {
          properties.children.push(child);
        }
      } else {
        Object.assign(properties, arglist.shift());
      }
    }

    // A flow object
    if (typeof arglist[0] === "object" && arglist[0].causality) {
      if (!properties.children) properties.children = [];
      properties.children.push(arglist.shift());
    }
    //if (properties.children && !(typeof(properties.children) instanceof Array)) properties.children = [properties.children];
  }
  return properties;
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
  function flowBuilder(...parameters) {
    const properties = findKeyInProperties(readFlowProperties(parameters));
    properties.buildFunction = buildFunction;
    const flow = new Flow(properties);
    if (description) flow.description = description;
    return flow;
  }
  return flowBuilder;
}

export function getTarget() {
  return creators[creators.length - 1].target;
}
