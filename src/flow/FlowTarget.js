import { clearNode } from "../flow.DOMTarget/DOMNode";
import { flow, repeat, trace, workOnPriorityLevel } from "./Flow";

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
		this.ensureContentInPlace();
		// flow.getPrimitive().givenDomNode = this.rootElement;
		// workOnPriorityLevel(2, () => this.flow.getPrimitive().ensureDomNodeBuilt());
	}
    
	ensureContentInPlace() {
		this.contentPlacementRepeater = repeat(this.toString() + ".contentPlacementRepeater", repeater => {
			if (trace) console.group(repeater.causalityString());
			clearNode(this.rootElement);
			this.flow.getPrimitive().givenDomNode = this.rootElement;
			workOnPriorityLevel(2, () => this.flow.getPrimitive().ensureDomNodeBuilt());

			
			if (trace) console.groupEnd();
		}, {priority: 2}); 
	}

	// General creation method, this is similar to a service locator in the service locator pattern. 
	// The purpose of this method is to choose what FlowPrimitive to create, given the properties object.
	// This makes it possible to create total custom FlowTargets that reinterprets the properties in 
	// new ways. For example, a DOMFlowTarget may create FlowPrimitive objects that renders a DOM in a web browsser.
	// But the same flow could be sent to a FlowTarget that renders a native app, or create contents for a printout, 
	// or create a server rendered page. The possibilities are endless!      
	create(...parameters) {
			const properties = readFlowProperties(parameters);
			throw new Error("Not implemented yet!");
	}
	
	// dispose() {
	//     flowTargets.splice(flowTargets.indexOf(this), 1);
	// }
}
  