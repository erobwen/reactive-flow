/**
 * Implement any flow target that implements HTML Element Node and HTML Text Node. 
 * A flow target could implement just a subset of all HTML tags and attributes, but could instead be an approxiomation 
 */
export class FlowTarget {
    integrate(flow) {
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
}
  