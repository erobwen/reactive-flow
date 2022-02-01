import getWorld from "../causality/causality.js";
export const world = getWorld({useNonObservablesAsValues: true, warnOnNestedRepeater: false});
export const { observable, repeat, finalize, withoutRecording } = world;
const log = console.log;

let parents = [];

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
    me.setProperties(properties);
    if (!this.parent) me.onReBuildCreate();
    return me;
  }

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

  description() {
    return this.className() + ":" + this.uniqueName(); 
  }

  uniqueName() {
    return (this.key ? (this.key + ":") : "") + this.causality.id
  }

  getChild(key) {
    if (typeof(this.buildRepeater.buildIdObjectMap[key]) === 'undefined') return null;
    return this.buildRepeater.buildIdObjectMap[key]
  }

  render() {
    this.integratePrimitive();
  }

  integratePrimitive() {
    const me = this; 
    me.getPrimitive();
    if (!me.integrationRepeater) {
      me.integrationRepeater = repeat("integrationRepeater", () => {
        me.target.integrate(me, me.primitive);
      });
    }
  }

  getPrimitive() {
    const me = this; 
    finalize(me);
    if (!me.buildRepeater) {
      me.buildRepeater = repeat("buildRepeater", () => {
        log("re-building: " + this.description());
        // Recursivley build down to primitives
        parents.push(me);
        me.primitive = me.build().getPrimitive();
        parents.pop();

        // Expand known children (do as much as possible before integration)
        for(let id in me.causality.buildIdObjectMap) {
          me.causality.buildIdObjectMap[id].getPrimitive();
        }
      });  
    }
    return me.primitive;
  }

  build() {
    throw new Error("Not implemented yet")
  }
}

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