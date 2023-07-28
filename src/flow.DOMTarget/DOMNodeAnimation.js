
// cubic-bezier(0.42,0,1,1)

import { draw, insertAfter, logMark } from "../flow/utility";
import { camelCase, changeType, extractProperties, flowChanges, getHeightIncludingMargin, getWidthIncludingMargin, logProperties, sameBounds } from "./DOMAnimation";
import { getWrapper, movedPrimitives } from "./DOMNode";

const log = console.log;
const animationTime = 5;

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
   * General helpers
   */

  repurposeLeaderOrTrailer(node) {
    const bounds = node.getBoundingClientRect();
    // Fixate size, it might get reset after setting display none! 
    node.style.width = bounds.width + "px";
    node.style.height = bounds.height + "px";

    node.removeEventListener("transitionend", node.hasCleanupEventListener);
    delete node.hasCleanupEventListener;
    return node;
  }
  
  createNewTrailerOrLeader(id) {
    // Create a new leader
    const node = document.createElement("div");
    node.id = id; 
    node.isControlledByAnimation = true; 
    node.style.position = "relative";
    node.style.overflow = "visible"    
    
    node.style.fontSize = "0px"; // For correctly positioning of buttons? 
    return node; 
  }

  hide(node) {
    node.style.display = "none"; // For now! this will be removed after measuring target bounds.  
  }

  show(node) {
    node.style.display = ""; // For now! this will be removed after measuring target bounds.  
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

    // Add trailers for removed to keep a reference of their position, since dom building will remove them. 
    switch (flow.changes.type) {
      case changeType.moved:
      case changeType.removed:
        this.addTrailersForMovedAndRemovedBeforeDomBuilding(node);
        break;
    }

    // Prepare added and moved for correct target size measurement (in case they are in a chained animation) 
    switch (flow.changes.type) {
      case changeType.added:
      case changeType.moved:
        this.neutralizeTransformationsAndPosition(node);
        break;
    }    
  }

  addTrailersForMovedAndRemovedBeforeDomBuilding(node) {
    let trailer; 
    
    if (node.parentNode.isControlledByAnimation) {
      // Repurpose existing leader as trailer.
      const leader = node.parentNode;
      trailer = this.repurposeLeaderOrTrailer(leader);
    } else {
      // Create new trailer.
      trailer = this.createNewTrailerOrLeader("trailer");
      // Note: We set width/height at this point because here we know if the leader was reused or not. If we do it later, we wont know that.  
      trailer.style.width = node.originalDimensions.widthIncludingMargin + "px"; // This will not be in effect until display != none  
      trailer.style.height = node.originalDimensions.heightIncludingMargin + "px";  
      insertAfter(trailer, node);
    }

    // We hide it for now, to get more accurate target measures, as if removed and moved nodes has already moved out of their place
    this.hide(trailer);

    // Debugging
    trailer.style.backgroundColor = "rgba(170, 170, 255, 0.5)";
    
    node.trailer = trailer; 
  }
  
  neutralizeTransformationsAndPosition(node) {
    node.style.position = "";
    node.style.transform = "";
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
    log("setOriginalStyleAndFootprintForAdded")
    // Get a leader for the added, this is either a new one, or a reused one from a remove. 
    let leader;

    // Find a leader for added, either borrow one, or create a new one.   
    let previous = node.previousSibling;
    log(previous) 
    log(previous && previous.isControlledByAnimation) 
    while (previous && previous.isControlledByAnimation && !previous.hasChildNodes()) {
      log("found leader...")
      leader = previous; 
      previous = previous.previousSibling;
    }
    if (leader) {
      // Found an existing leader. 
      log("repurpose existing leader")
      this.repurposeLeaderOrTrailer(leader);
      leader.appendChild(node);
    } else {
      // Create new leader.
      log("create a new leader")
      leader = this.createNewTrailerOrLeader("leader");
      // Note: We set width/height at this point because here we know if the leader was reused or not. If we do it later, we wont know that.  
      leader.style.width = "0px"; 
      leader.style.height = "0px";
      leader.style.opacity = "1";  
      insertAfter(leader, node);
      leader.appendChild(node);
    }
    node.leader = leader;
    log("leader;")
    log(leader);
        
    // Debugging
    leader.style.backgroundColor = "rgba(255, 170, 170, 0.5)";

    // Only if we are starting a chained animation, minimize the node
    if (!node.changes.previous) {
      log("A new animation, zoom from zero!");

      // Prepare for animation, do at a later stage perhaps? 
      Object.assign(node.style, {
        position: "absolute", 
        transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        // This is to make the absolute positioned added node to have the right size.
        width: node.targetDimensions.widthWithoutMargin + "px", 
        height: node.targetDimensions.heightWithoutMargin + "px",
        opacity: "0",
      });
    } else {
      log("Chained animation, keep existing transform and opacity");
      // Note, transition animations will allways start from the previously set style, even if the actual style is something different. Therefore we need to hard-reset the style here for a correct starting point.  
      Object.assign(node.style, {
        position: "absolute", 
        transform: node.computedOriginalStyle.transform,//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        opacity: node.computedOriginalStyle.opacity,
      });

      log(node.style.transform);
    }
  }
    
  setOriginalStyleAndFootprintForRemoved(node) { // TODO: Should actually inflate it instead... Because we want to aquire target dimensions with removed things out of the way. 
    const trailer = node.trailer; // Should have one at this point. 
    
    // Add back to trailer.
    if (node.parentNode !== trailer) {
      trailer.appendChild(node);
    }
    
    // Make trailer visible (should already have the right measurements)
    this.show(trailer);

    // Prepare for animation, do at a later stage perhaps? 
    if (!node.changes.previous) {
      Object.assign(node.style, {
        transform: "matrix(1, 0, 0, 1, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        position: "absolute", 
        // This is to make the absolute positioned added node to have the right size.
        width: node.originalDimensions.widthWithoutMargin + "px", 
        height: node.originalDimensions.heightWithoutMargin + "px",
        opacity: "1",
      });
    } else {
      Object.assign(node.style, {
        position: "absolute", 
        transform: "matrix(1, 0, 0, 1, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        // This is to make the absolute positioned added node to have the right size.
        transform: node.computedOriginalStyle.transform,//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        opacity: node.computedOriginalStyle.opacity,
      });
    }
  }

  
  setOriginalStyleAndFootprintForMoved(node) { // TODO: Should actually inflate it instead... Because we want to aquire target dimensions with removed things out of the way. 
    const trailer = node.trailer; // Should have one at this point. 

    // Make trailer visible (should already have the right measurements)
    this.show(trailer);

    // Find a leader for moved, either borrow one, or create a new one.  
    let leader; 
    let previous = node.previousSibling; 
    while (previous && previous.isControlledByAnimation && !previous.hasChildNodes()) {
      leader = previous; 
      previous = previous.previousSibling;
    }
    if (leader) {
      // Found an existing leader. 
      this.repurposeLeaderOrTrailer(leader);
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
    leader.style.backgroundColor = "rgba(255, 170, 170, 0.5)";

    // TODO: This code needs changes.

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

        Object.assign(flow.domNode.style, extractProperties(computedStyle, this.animatedProperties));

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
    if (node.leader) {
      log(`leader: `);
      logProperties(node.leader.style, this.typicalAnimatedProperties);
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
    delete node.leader; 
    if (leader) {
      log("animate leader")
      leader.style.transition = this.leaderTransition();
      Object.assign(leader.style, {
        width: node.targetDimensions.widthIncludingMargin + "px",
        height: node.targetDimensions.heightIncludingMargin + "px"
      })
    }

    // Animate trailer 
    const trailer = node.trailer; 
    delete node.trailer; // Only keep a trailer linked until it has been animated. 
    if (trailer) {
      log("animate trailer")
      trailer.style.transition = this.leaderTransition();
      Object.assign(trailer.style, {
        width: "0px",
        height: "0px"
      });
    }

    log("final properties: ");
    logProperties(flow.domNode.style, this.typicalAnimatedProperties);
    if (leader) {
      log(`leader: `);
      logProperties(leader.style, this.typicalAnimatedProperties);
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
              if (node.parentNode === trailer) {
                trailer.removeChild(node);
                trailer.parentNode.removeChild(trailer);
              }
              break;
            case changeType.added:
            case changeType.moved:
              if (node.parentNode === leader) {
                node.style.position = "";
                leader.removeChild(node);
                leader.parentNode.replaceChild(node, leader);
              }
              break; 
          }
        }

        // Just in case cleanup
        // if(node.trailer ) {
        // }

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