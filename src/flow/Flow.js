import getWorld from "../causality/causality.js";
import { reBuildDomNodeWithChildrenAnimated } from "../flow.DOMTarget/DOMAnimation.js";
export const world = getWorld({
  useNonObservablesAsValues: true,
  warnOnNestedRepeater: false,
  emitReBuildEvents: true, 
  priorityLevels: 3,
  onFinishedPriorityLevel: (level, finishedAllLevels) => {
    if (trace) log("<<<finished priority: " + level + ">>>");
    if (finishedAllLevels) log("no more repeaters...");
  }
  // onEventGlobal: event => collectEvent(event)
});
export const {
  transaction,
  observable,
  observableDeepCopy,
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
export let creators = [];

export const configuration = {
  warnWhenNoKey: false,
  traceReactivity: false,
  defaultTransitionAnimations: null
  // defaultTransitionAnimations: reBuildDomNodeWithChildrenAnimated
}

export let trace = false;

export function setFlowConfiguration(newConfiguration) {
  Object.assign(configuration, newConfiguration);
  trace = configuration.traceReactivity;
}

window.allFlows = {};
export class Flow {
  constructor(...parameters) {
    let properties = readFlowProperties(parameters);
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
    if (!this.derriveRepeaters) {
      this.derriveRepeaters = [];
    }
    this.derriveRepeaters.push(repeat(action));
  }

  onEstablish() {
    creators.push(this);
    this.setState();
    creators.pop();
    if (trace) log("Established:" + this.toString());
    // Lifecycle, override to do expensive things. Like opening up connections etc.
    // However, this will not guarantee a mount. For that, just observe specific properties set by the integration process.
  }

  onDispose() {
    // Dispose created by repeater in call. 
    if (trace) log("Disposed:" + this.toString());
    if (this.buildRepeater) {
      if (this.buildRepeater.buildIdObjectMap) {
        for (let key in this.buildRepeater.buildIdObjectMap) {
          const object = this.buildRepeater.buildIdObjectMap[key]; 
          if (typeof(object.onDispose) === "function") object.onDispose();
        }
      }

      this.buildRepeater.dispose();
    } 
    if (this.derriveRepeaters) this.derriveRepeaters.map(repeater => repeater.dispose()); // Do you want a disposed repeater to nullify all its writed values? Probably not....

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
    this.onEstablish();
    this.target.integrate(this);
    return this;
  }

  getPrimitive() {
    // log("getPrimitive")
    const me = this;

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
            me.newBuild.equivalentCreator = me;
            me.equivalentChild = me.newBuild;
          }
          
          // Popping
          creators.pop();
         
          // Recursive call
          me.primitive = me.newBuild !== null ? me.newBuild.getPrimitive() : null;

          if (trace) console.groupEnd();
        }, 
        {
          priority: 1, 
          rebuildShapeAnalysis: {
            canMatch: (newFlow, establishedFlow) => (newFlow.className() === establishedFlow.className()) && (newFlow.classNameOverride === establishedFlow.classNameOverride),
            shapeRoot: () => me.newBuild,
            slotsIterator: function*(newFlow, optionalEstablishedFlow, canMatchAny) {
              for (let property in newFlow) {
                if (property !== "children") {
                  yield {
                    newSlot: newFlow[property],
                    establishedSlot: optionalEstablishedFlow ? optionalEstablishedFlow[property] : null
                  }
                } else {
                  let newIndex = 0;
                  let establishedIndex = 0;
                  if (newFlow.children instanceof Array) {
                    while(newIndex < newFlow.children.length) {
                      while(!canMatchAny(newFlow.children[newIndex]) && newIndex < newFlow.children.length) newIndex++;
                      if (optionalEstablishedFlow && optionalEstablishedFlow.children instanceof Array) {
                        while(!canMatchAny(optionalEstablishedFlow.children[establishedIndex]) && establishedIndex < optionalEstablishedFlow.children.length) establishedIndex++;
                      }
  
                      if (newIndex < newFlow.children.length) {
                        yield {
                          newSlot: newFlow.children[newIndex],
                          establishedSlot: (optionalEstablishedFlow && optionalEstablishedFlow.children instanceof Array) ? optionalEstablishedFlow.children[establishedIndex] : null
                        }
                      }
  
                      newIndex++;
                      establishedIndex++;
                    };  
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
    }
    return me.primitive;
  }
  
  dimensions() {
    const primitive = this.getPrimitive();
    return primitive ? primitive.dimensions() : null;
  }

  getEquivalentRoot() {
    if (!this.equivalentCreator) return this;
    return this.equivalentCreator.getEquivalentRoot();
  }

  getTransitionAnimations() {
    if (this.transitionAnimations) return this.transitionAnimations(this.getEquivalentRoot());
    if (this.getEquivalentRoot) return this.getEquivalentRoot.getTransitionAnimations();
    return configuration.defaultAnimations(this.getEquivalentRoot());
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

export function readFlowProperties(arglist, config) {
  let singleStringAsText = config ? config.singleStringAsText : null;
  // Shortcut if argument is a properties object
  if (arglist[0] !== null && typeof(arglist[0]) === "object" && !isObservable(arglist[0]) && typeof(arglist[1]) === "undefined") {
    return arglist[0];
  }

  // The long way
  let properties = {};
  let readOneString = false; 
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }

    // String or numbers
    if ((typeof arglist[0] === "string" || typeof arglist[0] === "number") && !arglist[0].causality) {
      if (singleStringAsText) {
        if (!readOneString) {
          properties.text = arglist.shift();
        } else {
          properties.key = properties.text; 
          properties.text = arglist.shift();
        }
      } else {
        properties.key = arglist.shift(); // Dissaloww... ? 
      }
      readOneString = true;
    }
    if (!arglist[0]) {
      arglist.shift();
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

    finalize(me);
    if (!me.expandRepeater) {
      me.expandRepeater = repeat(me.toString() + ".expandRepeater", repeater => {

        // Expand known children (do as much as possible before integration)
        if (me.children) {
          for (let child of me.children) {
            if (child !== null) {
              child.getPrimitive();
            }
          }
        }
      });
    }

    return me;
  }

  dimensions() {
    return this.getPrimitive().dimensions();
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
  function flowBuilder(...parameters) {
    const flow = new Flow(readFlowProperties(parameters), buildFunction);
    if (description) flow.description = description;
    return flow;
  }
  return flowBuilder;
}

export function getTarget() {
  return creators[creators.length - 1].target;
}