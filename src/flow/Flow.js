import getWorld from "../causality/causality.js";
import { mostAbstractFlow } from "../flow.DOMTarget/DOMFlowTargetPrimitive.js";
export const world = getWorld({
  useNonObservablesAsValues: true,
  warnOnNestedRepeater: false,
  emitReBuildEvents: true, 
  onEventGlobal: event => collectEvent(event)
});
export const {
  transaction,
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
export let creators = [];

const configuration = {
  warnWhenNoKey: false,
  traceReactivity: false
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
      if (this.classNameOverride) {
        result = this.classNameOverride;
      } else {
        result = this.constructor.name;
      }
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

          // Establish relationship between equivalent child and this (its creator).
          if (me.newBuild !== null) {
            me.newBuild.equivalentCreator = me;
            me.equivalentChild = me.newBuild;
          }
          
          // Popping
          creators.pop();
         
          // Recursive call
          me.primitive = me.newBuild !== null ? me.newBuild.getPrimitive() : null;

          me.causality.previousBuild = me.newBuild;
          if (trace) console.groupEnd();
        }, 
        {
          rebuildShapeAnalysis: {
            canMatch: (newFlow, establishedFlow) => {
              return isObservable(newFlow) && isObservable(establishedFlow) &&
                newFlow.className() === establishedFlow.className() 
            },
            initialSlots: () => {
              return {
                newSlot: me.newBuild,
                establishedSlot: me.causality.previousBuild
              }
            },
            slotsIterator: function*(newFlow, optionalEstablishedFlow) {
              for (let property in newFlow) {
                if (property !== "children") {
                  yield {
                    newSlot: newFlow[property],
                    establishedSlot: optionalEstablishedFlow ? optionalEstablishedFlow[property] : null
                  }
                } else {
                  let index = 0;
                  while(index < newFlow.length()) {
                    yield {
                      newSlot: newFlow.children[index],
                      establishedSlot: optionalEstablishedFlow ? optionalEstablishedFlow.children[index] : null
                    }
                  };
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
  // Shortcut
  if (typeof(arglist[0]) === "object" && !isObservable(arglist[0]) && typeof(arglist[1]) === "undefined") return arglist[0]

  // The long way
  let properties = {};
  let readOneString = false; 
  while (arglist.length > 0) {
    if (typeof arglist[0] === "function" && !arglist[0].causality) {
      properties.build = arglist.shift();
    }
    if ((typeof arglist[0] === "string" || typeof arglist[0] === "number") && !arglist[0].causality) {
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
    throw new Error("Not implemented yet!");
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