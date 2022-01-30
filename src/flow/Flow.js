import getWorld from "../causality/causality.js";
export const world = getWorld({useNonObservablesAsValues: true, warnOnNestedRepeater: false});
export const { observable, repeat, finalize, withoutRecording } = world;
const log = console.log;

let parents = [];

export class Flow {
  constructor(properties) {
    this.parent = parents[parents.length - 1]; // Note this can only be done in constructor! 
    
    this.buildRepeater = null;
    this.primitive = null; 
    
    this.integrationRepeater = null;
    // log("in constructor: " + this.className());
    // log(parents);
    // log(properties.target)
    // log(this.parent.target);
    this.target = properties.target ? properties.target : this.parent.target;
    // log("target")
    // log(this.target);
    let key = properties.key;  
    delete properties.key;
    for (let property in properties) {
      this[property] = properties[property];
    }
    this.setProperties(properties);
    return observable(this, key);
  }

  uniqueName() {
    let result; 
    withoutRecording(() => {
      result = this.constructor.name + ":" + this.causality.id;
      result = this.constructor.name + ":" + this.causality.id;
    });
    return result; 
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
    if (me.integrationRepeater === null) {
      // log("new repeater")
      me.integrationRepeater = repeat("integrationRepeater", () => {
        // log("integrationRepeater:" + me.uniqueName())
        me.target.integrate(me, me.primitive);
      });
    }
  }

  getPrimitive() {
    const me = this; 
    finalize(me);
    if (me.buildRepeater === null) {
      me.buildRepeater = repeat("buildRepeater", () => {
        parents.push(me);
        me.primitive = me.build().getPrimitive();
        parents.pop();
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