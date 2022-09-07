import { flow } from "./Flow";

/**
 * Implement any flow target that implements HTML Element Node and HTML Text Node. 
 * A flow target could implement just a subset of all HTML tags and attributes, but could instead be an approxiomation 
 */
// export const flowTargets = [];

export class FlowTarget {
    // constructor() {
    //     super();
    //     flowTargets.push(this);
    // }
    dispose() {}

    setContent(flow) {
      throw new Error("Not implemented yet!");
    }
    
    elementNode() {
        // Should return an object of the type: FlowTargetPrimitive
        throw new Error("Not implemented yet!");
    }

    textNode() {
        // Should return an object of the type: FlowTargetPrimitive
        throw new Error("Not implemented yet!");
    }

    modalNode() {
        // Should return an object of the type: FlowTargetPrimitive
        throw new Error("Not implemented yet!");
    }

    // dispose() {
    //     flowTargets.splice(flowTargets.indexOf(this), 1);
    // }
}
  