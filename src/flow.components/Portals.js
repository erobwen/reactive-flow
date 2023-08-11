import { extractAttributes } from "../flow.DOMTarget/domNodeAttributes.js";
import { Flow, transaction, creators } from "../flow/Flow.js";
import { getTarget } from "../flow/flowBuildContext.js";
import { readFlowProperties, findTextAndKeyInProperties, findTextKeyAndOnClickInProperties, addDefaultStyleToProperties, findKeyInProperties } from "../flow/flowParameters";
import { div, div2 } from "./BasicHtml.js";
import { text } from "./BasicWidgets.js";
const log = console.log;


/**
 * Portals
 */
export function portalEntrance(...parameters) {
  const properties = readFlowProperties(parameters);
  findKeyInProperties(properties);
  return new PortalEntrance(properties);
}

export class PortalEntrance extends Flow {
  setProperties({portalContent, portalExit}) {
    this.portalExit = portalExit; 
    this.portalContent = portalContent;
    this.derrive(() => {
      if (this.isVisible) {
        // Note: check if children already set will cause infinite loop. This is unnecessary since it is built in to causality anyway. 
        this.portalExit.children = this.portalContent;
      } else {
        if (this.portalExit.children && this.portalExit.children === this.portalContent) {
          this.portalExit.children = null;
        }
      }
    });
  }

  build() {
    // return null;
    return text("[portal active]");
    // return this.children;
  }
}

export function portalExit(...parameters) {
  const properties = readFlowProperties(parameters);
  findKeyInProperties(properties);
  const attributes = extractAttributes(properties);
  return getTarget().create(properties.key, 
    { 
      type: "dom.elementNode",
      classNameOverride: "portalExit", 
      tagName: "div", 
      attributes, 
    }
  );
}
