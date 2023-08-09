import { flow, workOnPriorityLevel } from "./Flow";

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
        this.flow = flow;
        flow.target = this;
        flow.ensureEstablished();
        workOnPriorityLevel(1, () => this.flow.ensureBuiltRecursive(this));
        if (flow.getPrimitive() instanceof Array) throw new Error("Cannot have fragments on the top level");
        flow.getPrimitive().givenDomNode = this.rootElement;
        workOnPriorityLevel(2, () => this.flow.getPrimitive().ensureDomNodeBuilt());
    }
    
    // General creation method, this is similar to a service locator in the service locator pattern. 
    // The purpose of this method is to choose what FlowPrimitive to use, given the configuration object.   
    create(configuration) {
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
    
    // dispose() {
    //     flowTargets.splice(flowTargets.indexOf(this), 1);
    // }
}
  