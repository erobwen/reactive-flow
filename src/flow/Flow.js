import { observable } from "./reactive-flow";
import getWorld from "./causality/causality.js";
export const world = getWorld({useNonObservablesAsValues: true});
export const { observable, repeat, finalize } = world;

let parents = [];


export class Flow {
  constructor(properties) {
    this.buildRepeater = null;
    this.result = null; 

    this.integrationRepeater = null;
    this.target = null;
    
    let key = properties.key;  
    delete properties.key;
    for (property in properties) {
      this[property] = properties[property];
    }
    setProperties(properties);
    return observable(this, key);
  }
   
  getChild(key) {
    if (typeof(this.buildRepeater.buildIdObjectMap[key]) === 'undefined') return null;
    return this.buildRepeater.buildIdObjectMap[key]
  }

  getResult() {
    finalize(this);
    if (this.buildRepeater === null) {
      this.buildRepeater = repeat(() => {
        this.result = this.build();
        this.bubbleBounds()
      });  
    }
    return this.result;
  }

  integrateResult() {
    if (this.integrationRepeater === null) {
      this.integrationRepeater = repeat(() => {
        let use = this.result;
        let alsoUse = this.target;

        // Merge them. 
      });
    }
  }

  build() {
    throw new Error("Not implemented yet")
  }

  render() { 
    this.getResult();
    this.integrateResult();
  }

  bubbleBounds() {
    if (this.target.type === "html") {
      this.width = this.children.getWidthFromTemplateResultSomehow();
      this.height = this.children.getHeightFromTemplateResultSomehow();
    }
  }
}
