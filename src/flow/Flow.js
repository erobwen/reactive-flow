import getWorld from "../causality/causality.js";
import { logMark, isUpperCase } from "./utility.js";

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
  invalidateOnChange
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
  // if (finishedAllLevels) log("no more repeaters...");

  // Finished re building flow with expanded primitives. Measure bounds and style before FLIP animation. 
  if (level === 1) {
    // log(configuration.onFinishReBuildingFlowCallbacks)
    configuration.onFinishReBuildingFlowCallbacks.forEach(callback => callback())
  }

  // Let flow rebuild the DOM, while not removing nodes of animated flows (they might move if inserted elsewhere)

  // Finished re building DOM, proceed with animations.  
  if (level === 2) {
    configuration.onFinishReBuildingDOMCallbacks.forEach(callback => callback())
  }
}

window.flows = {};
export class Flow {
  get id() {
    return this.causality.id;
  }

  get get() {
    return this.causality.target;
  }

  get unobservable() {
    if (!this.causality.unobservable) this.causality.unobservable = this.initialUnobservables();
    return this.causality.unobservable;
  }

  initialUnobservables() {
    return {
      // removed: {},
      // added: {},
      // resident: {},
      // incoming: {},
      // outgoing: {}
    };
  }

  constructor(...parameters) {
    let properties = findKeyInProperties(readFlowProperties(parameters));
    // log("Flow constructor: " + this.className() + "." + properties.key);

    this._ = null; // For debug purposes, this makes it easier to identify flows when they are proxies in the debugger. 

    // Key & Creator
    if (!this.key) this.key = properties.key ? properties.key : null;
    delete properties.key;
    this.creator = creators.length > 0 ? creators[creators.length - 1] : null; // Note this can only be done in constructor!
    // this.flowDepth = this.creator ? this.creator.flowDepth + 1 : 0;

    // Set properties by bypassing setProperties
    for (let property in properties) {
      let destination = property;
      if (property === "build") destination = "buildFunction";
      this[destination] = properties[property];
    }

    // Inherit target from parent. TODO: Use general inheritance mechanism instead or let this be? 
    this.target = this.creator ? this.creator.target : null;


    // Create observable
    let me = observable(this, this.key);

    me._ = me.toString(); 

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

  ensure() {
    // Component worker here.
  }

  onDidDisplayFirstFrame() {
    // Component was drawn for the first animation frame, 
    // If you want to change an animated property on entry, now is the time. 
  }
  
  disposeState() {
    // throw new Error("Not implemented yet");
  }

  inherit(property) {
    const result = this.inheritCached(property);
    withoutRecording(()=> {
      // log("inherit: " + property + " result: " + result);
    })
    return result; 
  }

  inheritCached(property) {
    const context = this.getContext();
    if (typeof(context[property]) === "undefined") {
      invalidateOnChange(
        () => {
          // log("caching")
          context[property] = this.inheritUncached(property);
          withoutRecording(()=> {
            // log(context[property]);
          });
        },
        () => {
          // log('%c Invalidate!!! ', 'background: #222; color: #bada55');
          delete context[property];
        }
      )
    }
    return context[property];
  }

  inheritUncached(property) {
    const context = this.getContext();
    if (typeof(context[property]) !== "undefined") {
      return context[property] 
    } else if (this.equivalentCreator) {
      return this.equivalentCreator.inheritUncached(property); 
    } else if (this.parentPrimitive) {
      // This is to ensure inheritance works over component compositions, so that children can inherit properties from parent in compositions like parent({children: child() }). 
       return this.parentPrimitive.inheritUncached(property); 
    } else if (this.creator) {
      // This might be useful for maintaining inheritance while a child component is decoupled from the visible tree. 
      // But it cannot be as the first option as inheritance would then skip over the parentPrimitive structure. 
      // Note that a composed component might not have an equivalent creator, and if not visible it has no parentPrimitive.
      return this.creator.inheritUncached(property); 
    } else {
      console.warn("Could not find inherited property: " + property);
    }
  }
  
  inheritFromParentContainer(property) {
    if (this[property]) {
      return this[property];
    } else if (this.parentPrimitive) {
      const valueFromEquivalent = this.parentPrimitive.inheritFromEquivalentCreator(property);
      if (valueFromEquivalent) {
        return valueFromEquivalent;
      }
      return this.parentPrimitive.inheritFromParentContainer(property)
    } else {
      return null; 
    }
  }

  inheritFromEquivalentCreator(property) {
    const propertyValue = this[property];
    if (typeof(propertyValue) !== "undefined") {
      return propertyValue;
    } else if (this.equivalentCreator) {
      // log(this.equivalentCreator)
      return this.equivalentCreator.inheritFromEquivalentCreator(property);
    } else {
      return null;
    }
  }


  getContext() {
    return this; 
  }

  withdraw() {
    return [];
  }

  build(repeater) {
    if (this.buildFunction) {
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
    window.flows[this.causality.id] = this;
    creators.push(this);
    this.setState();
    creators.pop();
    this.startGeneralEnsure();
    if (trace) log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc.
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process.
  }

  startGeneralEnsure() {
    if (!this.generalEnsureRepeater) {
      this.generalEnsureRepeater = repeat(
        this.toString() + ".generalRepeater",
        (repeater) => {
          // if (trace) console.group(repeater.causalityString());
          this.ensure();
          // if (trace) console.groupEnd();
        });
    }
  }

  onRemoveFromFlowTarget() {
    if (this.onClose) {
      this.onClose();
    }
  }

  onDispose() {
    console.log("DISPOSING: " + this.toString());
    delete window.flows[this.causality.id];
    // Dispose created by repeater in call. 
    if (trace) log("Disposed:" + this.toString());
    if (this.buildRepeater) {
      this.buildRepeater.notifyDisposeToCreatedObjects();
      this.buildRepeater.dispose();
      this.buildRepeater.repeaterAction = () => {};
    }
    if (this.derriveRepeaters) this.derriveRepeaters.map(repeater => repeater.dispose()); // Do you want a disposed repeater to nullify all its writed values? Probably not....
    this.disposeState();
  }

  onVisibilityWillChange(visibility) {
    // log("onVisibilityWillChange: " + this.toString() + ".visibility = " + visibility);
    // Called if the visibility is changed for this component. 
    // Since Flow allows hidden component that maintain their state but are not disposed, 
    // this is how you know if your component is visible.  
    // Tips: It might be better do do a derrive and simply reading isVisible instead of 
    // overloading this method. 
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

  ensureBuiltRecursive(flowTarget, parentPrimitive) {
    if (parentPrimitive && this.parentPrimitive !== parentPrimitive) {
      if (this.parentPrimitive) {
        log("Flow.ensureBuiltRecursive");
        console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
      }
      this.parentPrimitive = parentPrimitive
    } 
    workOnPriorityLevel(1, () => this.getPrimitive().ensureBuiltRecursive(flowTarget, parentPrimitive));
    return this.getPrimitive(parentPrimitive);
  }

  getPrimitive(parentPrimitive) {
    // if (parentPrimitive && this.parentPrimitive && this.parentPrimitive !== parentPrimitive) console.warn("Changed parent primitive for " + this.toString());
    if (parentPrimitive && this.parentPrimitive !== parentPrimitive) {
      if (this.parentPrimitive) {
        log("getPrimitive");
        console.warn("Changed parent primitive for " + this.toString() + ":" + this.parentPrimitive.toString() + " --> " + parentPrimitive.toString());
      }
      this.parentPrimitive = parentPrimitive
    } 
    // log("getPrimitive")
    const me = this;
    const name = this.toString(); // For chrome debugger.
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
            me.primitive = me.newBuild.getPrimitive(this.parentPrimitive)  // Use object if it changed from outside, but do not observe primitive as this is the role of the expanderRepeater! 
          } else {
            me.primitive = me.newBuild
              .map(fragment => fragment.getPrimitive(this.parentPrimitive))
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
            slotsIterator: function*(establishedObject, newObject, hasKey, childrenProperty=false) {
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
                if (childrenProperty) yield [establishedObject, newObject];
                for (let property in newObject) {
                  if (property === "children") {
                    yield * this.slotsIterator(
                      establishedObject[property], 
                      newObject[property],
                      hasKey,
                      true
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
              const children = flow.children; // TODO: use iterator! 
              if (children instanceof Array) {
                let index = 0;
                while(index < children.length) {
                  children[index] = translateReference(children[index]);
                  index++;
                }
              } else if (children instanceof Flow) {
                flow.children = translateReference(children);
              }
            }
          }
        }
      );
    }
    return me.primitive;
  }
  
  *iterateChildren() {
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

  dimensions(contextNode) {
    if (!this.key) console.warn("It is considered unsafe to use dimensions on a flow without a key. The reason is that a call to dimensions from a parent build function will finalize the flow early, and without a key, causality cannot send proper onEstablish event to your flow component before it is built");
    const primitive = this.getPrimitive();
    if (primitive instanceof Array) throw new Error("Dimensions not supported for fragmented components.");
    return primitive ? primitive.dimensions(contextNode) : null;
  }

  getEquivalentRoot() {
    if (!this.equivalentCreator) return this;
    return this.equivalentCreator.getEquivalentRoot();
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

export function addDefaultStyleToProperties(properties, defaultStyle) {
  properties.style = Object.assign({}, defaultStyle, properties.style);
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
  // console.log(properties)
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

export function findTextAndKeyInPropertiesUsingCase(properties) {
  // console.log(properties)
  if (!properties.stringsAndNumbers) return properties;
  while(properties.stringsAndNumbers.length) {
    const string = properties.stringsAndNumbers.pop();
    if (properties.text && !properties.key) {
      // only key left
      properties.key = string; 
    } else if (properties.key && !properties.text) {
      // only text left
      properties.text = string; 
    } else if (/[a-z0-9]/.test(string[0]+"") && !properties.key) { //!(/[A-Z]|\s/.test(string[0] + "")
      // We assume this is a key
      properties.key = string;
    } else if (!properties.text){
      // Big character, assume it is a text.
      properties.text = string; 
    } else {
      throw new Error("Could not match loose strings in flow parameters, add them to properties.");
    }
  }
  delete properties.stringsAndNumbers;
  return properties;
}

export function findTextKeyAndOnClickInProperties(properties) {
  findTextAndKeyInPropertiesUsingCase(properties);
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
  if (arglist[0] !== null && typeof(arglist[0]) === "object" && !(arglist[0] instanceof Array) && !isObservable(arglist[0]) && typeof(arglist[1]) === "undefined") {
    return arglist[0];
  }

  // The long way
  let properties = {};
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function") {
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
        for (let child of arglist.shift()) { // TODO: Use iterator! 
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

export function callback(callback, key) {
  return observable(callback, key);
}


function *iterateChildren(properties) {
  if (properties.children instanceof Array) {
    for (let child of properties.children) {
      if (child instanceof Flow && child !== null) {
        yield child;
      }
    }
  } else if (properties.children instanceof Flow  && properties.children !== null) {
    yield properties.children;
  }
}