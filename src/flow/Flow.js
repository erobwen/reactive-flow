import getWorld from "../causality/causality.js";
export const world = getWorld({useNonObservablesAsValues: true});
export const { observable, repeat, finalize } = world;

let parents = [];

export class Flow {
  constructor(properties) {
    this.parent = parents[parents.length - 1];
    
    this.buildRepeater = null;
    this.result = null; 
    
    this.integrationRepeater = null;
    this.target = properties.target ? properties.target : parent.target;
    
    let key = properties.key;  
    delete properties.key;
    for (let property in properties) {
      this[property] = properties[property];
    }
    this.setProperties(properties);
    return observable(this, key);
  }

  render() { 
    this.getResult();
    this.integrateResult();
  }

  getChild(key) {
    if (typeof(this.buildRepeater.buildIdObjectMap[key]) === 'undefined') return null;
    return this.buildRepeater.buildIdObjectMap[key]
  }

  getResult() {
    finalize(this);
    if (this.buildRepeater === null) {
      this.buildRepeater = repeat(() => {
        parents.push(this);
        this.result = this.build().getResult();
        parents.pop();
        this.bubbleBounds()
      });  
    }
    return this.result;
  }

  bubbleBounds() {
    if (this.target.type === "html") {
      this.width = this.result.getWidthFromTemplateResultSomehow();
      this.height = this.result.getHeightFromTemplateResultSomehow();
    }
  }

  integrateResult() {
    if (this.integrationRepeater === null) {
      this.integrationRepeater = repeat(() => {
        this.target.integrate(this, this.result);
      });
    }
  }

  build() {
    throw new Error("Not implemented yet")
  }
}
