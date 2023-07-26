
// cubic-bezier(0.42,0,1,1)

import { draw, insertAfter, logMark } from "../flow/utility";
import { camelCase, changeType, extractProperties, flowChanges, getHeightIncludingMargin, getWidthIncludingMargin, logProperties, sameBounds } from "./DOMAnimation";
import { getWrapper, movedPrimitives } from "./DOMNode";

const log = console.log;
const animationTime = 9;

export class DOMNodeAnimation {
  /**
   * Default transitions
   */
  defaultTransition() {
    return `all ${animationTime}s ease-in-out, opacity ${animationTime}s cubic-bezier(1, 0, 0.42, 0.93)`
  }

  addedTransition() {
    return `transform ${animationTime}s ease-in-out, opacity ${animationTime}s cubic-bezier(1, 0, 0.42, 0.93)`
  }

  leaderTransition() {
    return `width ${animationTime}s ease-in-out, height ${animationTime}s ease-in-out`
  }

  removeTransition() {
    return `all ${animationTime}s ease-in-out, opacity ${animationTime}s cubic-bezier(0.33, 0.05, 0, 1)`
  }


  /**
   * Dimensions helper
   */

  getDimensionsIncludingMargin(node) {
    const bounds = node.getBoundingClientRect();
    const style = getComputedStyle(node); 
    return this.calculateDimensionsIncludingMargin(bounds, style);
  }
  
  calculateDimensionsIncludingMargin(bounds, style) {
    const dimensions = {
      marginTop: parseInt(style.marginTop, 10),
      marginBottom: parseInt(style.marginBottom, 10),
      marginLeft: parseInt(style.marginLeft, 10),
      marginRight: parseInt(style.marginRight, 10),
      width: bounds.width,
      height: bounds.height
    }
    dimensions.widthWithoutMargin = dimensions.width; 
    dimensions.heightWithoutMargin = dimensions.height; 
    dimensions.heightIncludingMargin = dimensions.height + dimensions.marginTop + dimensions.marginBottom;
    dimensions.widthIncludingMargin = dimensions.width + dimensions.marginLeft + dimensions.marginRight;
    return dimensions; 
  }

  /**
   * -------------------------------------------------------------------------------------
   * 
   *                               Record original bounds
   * 
   * -------------------------------------------------------------------------------------
   */

  /**
   * Record original bounds, before anything in the dome has changed
   * Bounds do not include margin. See this:  
   * https://stackoverflow.com/questions/50657526/does-getboundingclientrect-width-and-height-includes-paddings-and-borders-of-e
   * Also offset width and height do not include margin. 
   */
  recordOriginalBoundsAndStyle(flow) {
    const node = flow.domNode; 

    // Bounds (excludes margins)
    node.originalBounds = node.getBoundingClientRect();
  
    // Styles
    node.originalStyle = {...node.style}
    node.computedOriginalStyle = {...getComputedStyle(node)}; // TODO: Remove or optimize if not needed fully. 

    // Dimensions (with and without margins)
    node.originalDimensions = this.calculateDimensionsIncludingMargin(node.originalBounds, node.computedOriginalStyle);
  }
  

  /**
   * -------------------------------------------------------------------------------------
   * 
   *                               Prepare for DOM building
   * 
   * -------------------------------------------------------------------------------------
   */

  /**
   * Prepare for DOM building. 
   */
  prepareForDOMBuilding(flow) {
    const node = flow.domNode;

    // Add leaders and trailers to keep a reference of their position, since dom building will remove them. 

    switch (flow.changes.type) {
      case changeType.moved:
      case changeType.removed:
        this.prepareMovedAndRemovedForDOMBuilding(node);
        break; 
    }
  }

  prepareMovedAndRemovedForDOMBuilding(node) {
    let trailer; 
    
    if (node.parentNode.isControlledByAnimation) {
      // Repurpose existing leader as trailer.
      trailer = this.repurposeLeader(node.parentNode);
    } else {
      // Create new trailer.
      trailer = this.createNewTrailerOrLeader("trailer");
      // Note: We set width/height at this point because here we know if the leader was reused or not. If we do it later, we wont know that.  
      trailer.style.width = node.originalDimensions.widthIncludingMargin + "px"; // This will not be in effect until display != none  
      trailer.style.height = node.originalDimensions.heightIncludingMargin + "px";  
      insertAfter(trailer, node);
    }

    // Debugging
    trailer.style.backgroundColor = "#aaaaff";
    // trailer.style.backgroundColor = "rgba(0, 0, 0, 0)";
    
    node.trailer = trailer; 
  }
  
  repurposeLeader(leader) {
    leader.removeEventListener("transitionend", leader.hasCleanupEventListener);
    delete leader.hasCleanupEventListener;
    return this.resetLeader(leader);
  }
  
  createNewTrailerOrLeader(id) {
    // Create a new leader
    const trailer = document.createElement("div");
    trailer.id = id; 
    trailer.isControlledByAnimation = true; 
    trailer.style.position = "relative";
    trailer.style.overflow = "visible"    
    
    trailer.style.fontSize = "0px"; // For correctly positioning of buttons? 
    return this.resetLeader(trailer);
  }

  resetLeader(leader) {
    leader.style.display = "none"; // For now! this will be removed after measuring target bounds.  
    return leader;
  }


  /**
   * -------------------------------------------------------------------------------------
   * 
   *                               Measure target sizes for leaders
   *                               (should include final size and margins)
   * 
   * -------------------------------------------------------------------------------------
   */

  /**
   * DOM just rebuilt, it could be a good idea to measure target sizes at this stage, 
   * since it is the closest we will be to the actual end result. 
   * However, removed nodes are still present at this point... maybe we should ensure added leaders for removed ones start out minimized?
   * Trailers should also be minimized at this point.
   */
  domJustRebuiltMeasureTargetSizes(flow) {
    const node = flow.domNode;
    
    switch (flow.changes.type) {
      case changeType.added:
      case changeType.moved:
        // Bounds (excludes margins)
        node.targetBounds = node.getBoundingClientRect();
      
        // Styles
        node.targetStyle = {...node.style}
        node.computedTargetStyle = {...getComputedStyle(node)}; // TODO: Remove or optimize if not needed fully. 

        // Dimensions (with and without margins)
        node.targetDimensions = this.calculateDimensionsIncludingMargin(node.targetBounds, node.computedTargetStyle);
    }
  }

  // Note: There could be resident nodes moving around and changing size. We cant do anything about it. Shoulw we try to emulate their end state?
  // But then again, their end state might occur at a different point in time from the end of this target. So... 
  // It might be impossible to get the correct target size for every situation. It just aims to be good enough.


  /**
   * -------------------------------------------------------------------------------------
   * 
   *                            Emulate original styles and footprints
   * 
   * -------------------------------------------------------------------------------------
   */


  /**
   * Emulate the original styles and footprints of all animated
   * nodes. This is for a smooth transition from their original position. 
   */
  emulateOriginalFootprints(flow) {
    const node = flow.domNode;
    switch (flow.changes.type) {
      case changeType.added: 
        this.setOriginalStyleAndFootprintForAdded(node);
        break; 
      case changeType.removed: 
        this.setOriginalStyleAndFootprintForRemoved(node);
        break;
      case changeType.moved: 
        this.setOriginalStyleAndFootprintForMoved(node);
        break; 
      case changeType.resident: // Do nothing! 
        break;  
    }
  }

  setOriginalStyleAndFootprintForAdded(node) {
    // Get a leader for the added, this is either a new one, or a reused one from a remove. 
    let leader;

    // Find a leader for added, either borrow one, or create a new one.   
    let previous = node.previousSibling; 
    while (previous && previous.isControlledByAnimation && !previous.hasChildNodes()) {
      leader = previous; 
      previous = node.previousSibling;
    }
    if (leader) {
      // Found an existing leader. 
      leader.appendChild(node);
    } else {
      // Create new leader.
      leader = this.createNewTrailerOrLeader("leader");
      // Note: We set width/height at this point because here we know if the leader was reused or not. If we do it later, we wont know that.  
      leader.style.width = "0px"; 
      leader.style.height = "0px";
      leader.style.opacity = "1";  
      insertAfter(leader, node);
      leader.appendChild(node);
    }
    node.leader = leader;
        
    // Debugging
    leader.style.backgroundColor = "#ffaaaa";

    // Add node to leader and make it visible (it should already have correct size). 
    Object.assign(leader.style, {
      // Note: width and height should be set at this point.
      display: ""
    })

    // Prepare for animation, do at a later stage perhaps? 
    Object.assign(node.style, {
      transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
      position: "absolute", 
      // This is to make the absolute positioned added node to have the right size.
      width: node.targetDimensions.widthWithoutMargin + "px", 
      height: node.targetDimensions.heightWithoutMargin + "px",
      opacity: "0",
    });
  }
    
  setOriginalStyleAndFootprintForRemoved(node) { // TODO: Should actually inflate it instead... Because we want to aquire target dimensions with removed things out of the way. 
    const trailer = node.trailer; // Should have one at this point. 
    
    // Add back to trailer.
    if (node.parentNode !== trailer) {
      trailer.appendChild(node);
    }
    
    // Make trailer visible
    Object.assign(trailer.style, {
      // Note: width and height should be set at this point. 
      display: ""
    })

    // Prepare for animation, do at a later stage perhaps? 
    Object.assign(node.style, {
      transform: "matrix(1, 0, 0, 1, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
      position: "absolute", 
      // This is to make the absolute positioned added node to have the right size.
      width: node.originalDimensions.widthWithoutMargin + "px", 
      height: node.originalDimensions.heightWithoutMargin + "px",
      opacity: "1",
    });
  }

  
  setOriginalStyleAndFootprintForMoved(node) { // TODO: Should actually inflate it instead... Because we want to aquire target dimensions with removed things out of the way. 
    const trailer = node.trailer; // Should have one at this point. 
    
    // Make trailer visible.
    Object.assign(trailer.style, {
      // Note: width and height should be set at this point. 
      display: "",
      transition: this.leaderTransition(),
    });
    
    // Find a leader for moved, either borrow one, or create a new one.   
    let previous = node.previousSibling; 
    while (previous.isControlledByAnimation && !previous.hasChildNodes()) {
      leader = previous; 
      previous = node.previousSibling;
    }
    if (leader) {
      // Found an existing leader. 
      leader.appendChild(node);
    } else {
      // Create new leader.
      leader = this.createNewTrailerOrLeader("leader");
      // Note: We set width/height at this point because here we know if the leader was reused or not. If we do it later, we wont know that.  
      leader.style.width = "0px"; 
      leader.style.height = "0px";
      leader.style.opacity = "1";  
      insertAfter(leader, node);
      leader.appendChild(node);
    }
    node.leader = leader;
    
    // Debugging
    leader.style.backgroundColor = "#ffaaaa";

    // Prepare for animation
    Object.assign(node.style, {
      position: "absolute", 
      // This is to make the absolute positioned added node to have the right size.
      width: node.originalDimensions.widthWithoutMargin + "px", 
      height: node.originalDimensions.heightWithoutMargin + "px",
    });
  }
  
  
  /**
   * -------------------------------------------------------------------------------------
   * 
   *                            Emulate original bounds using transformations
   * 
   * -------------------------------------------------------------------------------------
   */

  /**
   * Emulate original bounds
   */
  emulateOriginalBounds(flow) {
    // Do the FLIP animation technique
    // Note: This will not happen for flows being removed (in earlier flowChanges.number). Should we include those here as well?
    this.recordBoundsInNewStructure(flow.domNode);
    switch(flow.changes.type) {
      case changeType.moved:
      case changeType.resident:
        this.translateToOriginalBoundsIfNeeded(flow);    
        break;
      default:
        break;  
    }
  }

  recordBoundsInNewStructure(node) {
    // node.style.transform = ""; // Cannot do here as some resident nodes will continue on same animation.
    node.newStructureBounds = node.getBoundingClientRect();
    movedPrimitives.push(node)
    draw(node.newStructureBounds, "red");
  }

  
  animatedProperties = [
    // "transform",
    // "maxHeight",
    // "maxWidth",
    {compound: "margin", partial: ["marginBottom", "marginBottom", "marginLeft", "marginRight"]},
    {compound: "padding", partial: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]},
    "opacity",
    "color", 
    "fontSize",
  ];


  translateToOriginalBoundsIfNeeded(flow) {
    // TODO: Translate parents first in case of cascading moves? 
    
    if (!sameBounds(flow.domNode.originalBounds, flow.domNode.newStructureBounds)) {
      // log("Not same bounds for " + flow.toString());     
      const computedStyle = getComputedStyle(flow.domNode);
      let currentTransform = getComputedStyle(flow.domNode).transform;
      // log(currentTransform);
      // This is for resident that have a transform already. In an animation already.
      if (!["none", "", " "].includes(currentTransform)) {
        // log("Already have transform for " + flow.toString());     
        // Freeze properties as we start a new animation.

        Object.assign(flow.domNode.style, extractProperties(computedStyle, animatedProperties));

        // Reset transform 
        flow.domNode.style.transition = "";
        flow.domNode.style.transform = "";
        currentTransform = getComputedStyle(flow.domNode).transform;
        this.recordBoundsInNewStructure(flow.domNode);

        // Mark in new animation
        flow.domNode.changes.number = flowChanges.number; 
        flow.domNode.changes.type = changeType.resident;
      }

      flow.animateInChanges = flowChanges.number; 
      this.translateFromNewToOriginalPosition(flow.domNode);

      // Reflow
      flow.domNode.getBoundingClientRect();
    }
  }

  translateFromNewToOriginalPosition(node) {
    node.style.transition = "";

    // // Origin bouds... really use?
    // const defaultOrigin = {top: 0, left: 0};
    // // const animationOriginNode = node.animationOriginNode; //delete node.animationOriginNode;
    // const originOriginalBounds = defaultOrigin; //animationOriginNode.originalBounds; //delete animationOriginNode.originalBounds;
    // const originInitialBounds = defaultOrigin; //animationOriginNode.newStructureBounds; //delete animationOriginNode.newStructureBounds;
    
    // const originalBounds = node.originalBounds; //delete node.originalBounds;
    // const newStructureBounds = node.newStructureBounds; //delete node.newStructureBounds;
    // const deltaX = (newStructureBounds.left - originInitialBounds.left) - (originalBounds.left - originOriginalBounds.left) //- node.animationStartTotalHeight;
    // const deltaY = (newStructureBounds.top - originInitialBounds.top) - (originalBounds.top - originOriginalBounds.top) //-  node.animationStartTotalWidth;
    // node.style.transform = "";

    const originalBounds = node.originalBounds; //delete node.originalBounds;
    const newStructureBounds = node.newStructureBounds; //delete node.newStructureBounds;
    const deltaX = newStructureBounds.left - originalBounds.left;  //- node.animationStartTotalHeight;
    const deltaY = newStructureBounds.top - originalBounds.top; //-  node.animationStartTotalWidth;
    // node.style.transform = "";
 
    const transform = "matrix(1, 0, 0, 1, " + -deltaX + ", " + -deltaY + ")";
    log(transform);
    node.style.transform = transform;
    log(node.style.transform)
    // log("transform:")
    // log(node.style.transform);
  }

 
  /**
   * -------------------------------------------------------------------------------------
   * 
   *                           Activate animations
   * 
   * -------------------------------------------------------------------------------------
   */

  typicalAnimatedProperties = [
    "transition", 
    "transform", 
    "width", 
    "height", 
    "maxWidth", 
    "maxHeight", 
    "margin", 
    "marginTop", 
    "padding", 
    "paddingTop"
  ]; 

  setupFinalStyleForAdded(node) {
    node.style.transition = this.addedTransition();
    Object.assign(node.style, {
      transform: "matrix(1, 0, 0, 1, 0, 0)",
      opacity: "1"
    });
  }

  setupFinalStyleForResident(node) {
    // No leader or trailer that needs animation. Just ensure we want to move to a resting place in case we got translated. Should we check this?  
    node.style.transition = this.defaultTransition(node);
    Object.assign(node.style, {
      transform: "matrix(1, 0, 0, 1, 0, 0)"
    });
  }
 
  setupFinalStyleForMoved(node) {
    node.style.transition = this.defaultTransition();
    Object.assign(node.style, {
      transform: "matrix(1, 0, 0, 1, 0, 0)"
    });
  }

  setupFinalStyleForRemoved(node) {
    node.style.transition = this.defaultTransition();
    Object.assign(node.style, {
      transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",
      opacity: "0.001"
    });
  }

  /**
   * Activate animation 
   */
  activateAnimation(flow, currentFlowChanges) {
    log("activateAnimation... ")
    const node = flow.domNode;
    const changes = flow.changes; 
    
    console.group("Activate for " + flow.changes.type + ": " + flow.toString());
    log(`original properties: `);
    logProperties(node.style, this.typicalAnimatedProperties);
    if (node.trailer) {
      log(`trailer: `);
      logProperties(node.trailer.style, this.typicalAnimatedProperties);
    }

    // Animate node
    switch(flow.changes.type) {
      case changeType.added:
        this.setupFinalStyleForAdded(node);
        break;

      case changeType.resident: 
        if (flow.animateInChanges === currentFlowChanges.number) { // In case we got nocked out of position. 
          this.setupFinalStyleForResident(node);
        }
        break;

      case changeType.moved:
        this.setupFinalStyleForMoved(node);
        break; 
        
      case changeType.removed: 
        this.setupFinalStyleForRemoved(node);
        break; 
    }

    // Animate leader
    const leader = node.leader;
    if (leader) {
      leader.style.transition = this.leaderTransition();
      Object.assign(leader.style, {
        width: node.targetDimensions.widthIncludingMargin + "px",
        height: node.targetDimensions.heightIncludingMargin + "px"
      })
    }

    // Animate trailer 
    const trailer = node.trailer; 
    if (trailer) {
      trailer.style.transition = this.leaderTransition();
      Object.assign(trailer.style, {
        width: "0px",
        height: "0px"
      });
    }

    log("final properties: ");
    logProperties(flow.domNode.style, this.typicalAnimatedProperties);
    if (node.trailer) {
      log(`trailer: `);
      logProperties(node.trailer.style, this.typicalAnimatedProperties);
    }
    console.groupEnd();
  }
  

  /**
   * -------------------------------------------------------------------------------------
   * 
   *                           Animation cleanup
   * 
   * -------------------------------------------------------------------------------------
   */

  // Setup animation cleanup

  // Setup animation cleanup
  setupAnimationCleanup(flow) {
    const node = flow.domNode;
    const leader = node.leader;
    const trailer = node.trailer; 
    
    this.setupNodeAnimationCleanup(node, {
      endingAction: (propertyName) => {
        // Synch properties that was transitioned. 
        log("Ending node animation");
        node.equivalentCreator.synchronizeDomNodeStyle([propertyName, "transition", "transform", "width", "height"]);
        if (node.parentNode.isControlledByAnimation) {
          // Note: This should really go in the cleanup code for the trailer/leader. If a leader is finished, 
          // it replaces its content. If a trailer is finished, it just removes itself. But for some weird reason
          // the oneventchange event on the trailer wont fire! TODO: Do more research and find out why! 
          switch(node.changes.type) {
            case changeType.removed:
              trailer.removeChild(node);
              trailer.parentNode.removeChild(trailer);
              break;
            case changeType.added:
            case changeType.moved:
              leader.removeChild(node);
              leader.parentNode.replaceChild(node, leader);
              break; 
          }
        }
        delete node.trailer; 
      }
    });
  
    if (leader) {
      this.setupNodeAnimationCleanup(node.leader, {
        endingProperties: ["width", "height"],
        endingAction: () => {
          // TODO: handle if things have already chagned...
          log("Ending leader animation"); 
          leader.removeChild(node);
          leader.parentNode.replaceChild(node, leader);
          node.equivalentCreator.synchronizeDomNodeStyle("position");
          delete node.leader;
        }
      })
    }
    
    if (trailer) {
      this.setupNodeAnimationCleanup(node.trailer, {
        endingProperties: ["width", "height"],
        endingAction: () => {
          log("Ending trailer animation"); 
          // TODO: handle if things have already changed?... if reused, the observer should have been removed? Right?... 
          trailer.parentNode.removeChild(trailer);
          delete node.trailer; 
        }
      })
    }  
  }


  setupNodeAnimationCleanup(node, {endingProperties, endingAction}) {
    log("setupNodeAnimationCleanup");
    log(node);

    // There can be only one
    if (node.hasCleanupEventListener) return; 
    log("...")
    
    function onTransitionEnd(event) {
      if (!node.changes) return;
      const propertyName = camelCase(event.propertyName); 

      console.group("cleanup: " + node.changes.type + " from changes number " + node.changes.number);
      log(node);
      log(event.propertyName);
      console.groupEnd();

      if (!endingProperties || endingProperties.includes(propertyName)) {
        endingAction(propertyName);

        // Remove changes.
        if (node.changes) {
          node.changes.finished = true; 
          const flow = node.equivalentCreator;
          flow.changes = null;
          node.changes = null;
        }
  
        // Finish animation
        node.removeEventListener("transitionend", onTransitionEnd);
        delete node.hasCleanupEventListener;
      }      
    }
    node.addEventListener("transitionend", onTransitionEnd);
    node.hasCleanupEventListener = onTransitionEnd; 
  }   
}

export const standardAnimation = new DOMNodeAnimation();
  




// getAnimatedProperties(computedStyle) {
//   const result = {};
//   animatedProperties.forEach(property => {
//     if (typeof property === "string") {
//       result[property] = computedStyle[property]
//     } else {
//       property.partial.forEach(partialProperty => {
//         result[partialProperty] = computedStyle[partialProperty]
//       });
//     }
//   });
//   return result; 
// }