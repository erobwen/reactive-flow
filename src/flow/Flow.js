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

  getChild(key) {
    if (typeof(this.buildRepeater.buildIdObjectMap[key]) === 'undefined') return null;
    return this.buildRepeater.buildIdObjectMap[key]
  }

  render() {
    this.target.integrate(this, this.getPrimitive());
  }

  getPrimitive() {
    // log("getPrimitive")
    const me = this;
    
    me.equivalentParent = parents.length > 0 ? parents[parents.length - 1] : null;
    if (me.equivalentParent) me.equivalentParent.equivalentChild = me;

    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat(this.toString() + ".buildRepeater", repeater => {
        if (!repeater.firstTime) log(repeater.causalityString());

        // Recursivley build down to primitives
        parents.push(me);
        me.primitive = me.build().getPrimitive();
        parents.pop();
      });
      // Expand known children (do as much as possible before integration)
      // Do this outside repeater so we do not observe all child relations!
      function getPrimitives(flow) {
        flow.getPrimitive();
        if (flow.children) {
          for (let child of flow.children) {
            getPrimitives(child);
          }
        }
      }
      getPrimitives(me.primitive);
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
    this.primitive = this; 
    return this;
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
    this.onClick = onClick;
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
    if (condition()) {
      operation();
    }
  });
}
