
// cubic-bezier(0.42,0,1,1)

import { draw, logMark } from "../flow/utility";
import { camelCase, changeType, extractProperties, flowChanges, getHeightIncludingMargin, getWidthIncludingMargin, logProperties, sameBounds, typicalAnimatedProperties } from "./DOMAnimation";
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

  wrapperTransition() {
    return `width ${animationTime}s ease-in-out, height ${animationTime}s ease-in-out`
  }

  removeTransition() {
    return `all ${animationTime}s ease-in-out, opacity ${animationTime}s cubic-bezier(0.33, 0.05, 0, 1)`
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
   */
  recordOriginalBoundsAndStyle(flow) {
    const node = flow.domNode; 

    node.offsetBounds = {
      height: node.offsetHeight,
      width: node.offsetWidth
    }
    node.originalBounds = node.getBoundingClientRect();
    const wrapper = getWrapper(node);
    if (wrapper !== node) {
      wrapper.originalBounds = wrapper.getBoundingClientRect();
    }
    draw(node.originalBounds);
    node.originalStyle = {...node.style}
    node.computedOriginalStyle = {...getComputedStyle(node)}; // TODO: Remove or optimize if not needed fully. 
  }
  
  getOriginalMeasuresIncludingMargin(node) {
    const measures = {
      marginTop: parseInt(node.computedOriginalStyle.marginTop, 10),
      marginBottom: parseInt(node.computedOriginalStyle.marginBottom, 10),
      marginLeft: parseInt(node.computedOriginalStyle.marginLeft, 10),
      marginRight: parseInt(node.computedOriginalStyle.marginRight, 10),
      width: node.originalBounds.width,
      height: node.originalBounds.height
    }
    measures.totalHeight = measures.height + measures.marginTop + measures.marginBottom;
    measures.totalWidth = measures.width + measures.marginLeft + measures.marginRight;
    return measures; 
  }

  /**
   * -------------------------------------------------------------------------------------
   * 
   *                               Prepare for DOM building
   * 
   * -------------------------------------------------------------------------------------
   */

  /**
   * Prepare for DOM building. At this stage, your node should have trailers and leaders, so the dom building process can place these right.
   */
  prepareForDOMBuilding(flow) {
    const node = flow.domNode;

    // Add all trailers. 
    if (node.changes.type === changeType.moved) {
      const parentNode = getWrapper(node).parentNode;
      const trailer = this.getFadingTrailer(node);
      // Note: If a reused wrapper is already in place, so do nothing.
      if (trailer.parentNode !== parentNode) {
        // Note insert trailers here, before the DOM building moves the node and makes it impossible to know its original location. 
        parentNode.insertBefore(trailer, node);
      } 
    }

    // Add all leaders 
    if ([
        changeType.moved, 
        changeType.added, 
        changeType.removed
      ].includes(node.changes.type)) {
      
      // Store away old wrapper
      if (node.wrapper) {
        const oldWrapper = node.wrapper;
        if (flow.changes && flow.changes.previous && flow.changes.previous.type === changeType.removed) {
          //  oldWrapper.parentNode === flow.parentPrimitive.domNode
          // Reuse old wrapper
          logMark("reuse old wrapper")
          const dimensions = node.wrapper.getBoundingClientRect() 
          log(node.wrapper.getBoundingClientRect());
          node.wrapper.style.width = dimensions.width + "px";
          node.wrapper.style.height = dimensions.height + "px";
          oldWrapper.reusedWrapper = true; 
        } else {
          // Dispose old wrapper
          node.wrapper.isOldWrapper = true; 
          if (!node.oldWrappers) {
            node.oldWrappers = [];
          }
          node.oldWrappers.push(node.wrapper);
          node.wrapper = null; 
        }
      }
        
      if (!node.wrapper) {
        const wrapper = document.createElement("div");
        node.wrapper = wrapper;
        wrapper.wrapped = node;
        // wrapper.appendChild(flow.getDomNode());
        wrapper.id = "wrapper";
        wrapper.style.fontSize = "0px"; // For correctly positioning of buttons? 
        wrapper.style.backgroundColor = "#bbbbff";
        wrapper.style.overflow = "visible";
      }
    }
  }

  getFadingTrailer(node) {
    let trailer; 

    // Reuse wrapper if existing, as it is already in right place
    if (node.wrapper) {
      trailer = node.wrapper;
      trailer.removeEventListener("transitionend", trailer.hasCleanupEventListener);
      delete trailer.hasCleanupEventListener;
      // delete trailer.purpose; 
      trailer.wasWrapper = true; 
      delete trailer.wrapped;
      delete node.wrapper;  
    } else {
      trailer = document.createElement("div");
    }
    log(trailer);
    log(trailer.style.fontSize);
    log(trailer.style.backgroundColor);
    trailer.style.fontSize = "0px"; // For correctly positioning of buttons? 
    trailer.style.backgroundColor = "#ffaaaa";
    trailer.style.overflow = "visible; "

    const changes = {
      number: flowChanges.number,
      type: changeType.removed,
      previous: null
    };

    trailer.owner = node; 
    trailer.changes = changes; 
    node.fadingTrailerOnChanges = flowChanges.number;
    node.fadingTrailer = trailer;
    trailer.id = "trailer"
    return trailer;  
  }


  /**
   * -------------------------------------------------------------------------------------
   * 
   *                               Measure target sizes
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
        this.calculateTargetDimensionsAndStyleForAdded(flow.parentPrimitive.domNode, flow.domNode);
        break;
      case changeType.moved:
        this.measureMovedFinalSize(flow.domNode);
        break;
    }
  }

  measureMovedFinalSize(node) {
    node.movedFinalSize = {
      width: node.offsetWidth, 
      height: node.offsetHeight
    }
  }

  calculateTargetDimensionsAndStyleForAdded(contextNode, node) {
    node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this!
    node.targetStyle = {...node.style}
    node.computedTargetStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully.
  }


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
        this.setOriginalMinimizedStyleForAdded(flow.domNode);
        break; 
      case changeType.removed: 
        this.fixateRemoved(flow);
        break;
      case changeType.moved: 
        this.inflateFadingTrailer(flow.domNode);
        this.minimizeIncomingFootprint(flow.domNode);
    }
  }

  setOriginalMinimizedStyleForAdded(node) {
    log("setOriginalMinimizedStyleForAdded");
    log(node);
    log(node.wrapper);
    if (node.equivalentCreator.changes.previous && node.equivalentCreator.changes.previous.type === changeType.removed) {
      log("reusing removal wrapper")
      const wrapper = node.wrapper;
      if (node.wrapper) {
        const wrapperOriginalStyle = {...getComputedStyle(node.wrapper)};
        log(node.wrapper.getBoundingClientRect())
        log("What the hell is going on here!!!");
        log(node.computedOriginalStyle.transform);
        node.style.transform = node.computedOriginalStyle.transform; 
        log(wrapperOriginalStyle.width);
        // wrapper.style.height = wrapperOriginalStyle.height;
        // wrapper.style.width = wrapperOriginalStyle.width;
        wrapper.style.overflow = "visible";
        wrapper.style.position = "relative";
      }
    } else {
      log("setting up a minimized wrapper")
      const wrapper = node.wrapper;
      if (node.wrapper) {
        wrapper.style.height = "0px";
        wrapper.style.width = "0px";
        wrapper.style.overflow = "visible";
        wrapper.style.position = "relative";
      }
  
      // Prepare for animation, do at a later stage perhaps? 
      Object.assign(node.style, {
        transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        position: "absolute", 
        width: node.targetDimensions.widthWithoutMargin + "px", // EH? here really? target dimensions? 
        height: node.targetDimensions.heightWithoutMargin + "px",
        opacity: "0",
      });
      console.log(node.style.transform);
    }
  }
    
  fixateRemoved(flow) { // TODO: Should actually inflate it instead... Because we want to aquire target dimensions with removed things out of the way. 
    const node = flow.domNode; 
    
    if (flow.changes.previous && flow.changes.previous.type === changeType.added) {
      return; 
    }

    if (node.wrapper) {
      node.wrapper.style.transition = node.equivalentCreator.animation.wrapperTransition(node);
      
      // log(getWidthIncludingMargin(node));
      // log(getHeightIncludingMargin(node))
      node.wrapper.style.width = getWidthIncludingMargin(node) + "px";
      node.wrapper.style.height = getHeightIncludingMargin(node) + "px";
      
      node.wrapper.style.position = "relative";
      node.wrapper.style.overflow = "visible";
      // log(node.wrapper);
      // debugger; 
    }
    node.style.position = "absolute";
    node.style.transform = "matrix(1, 0, 0, 1, 0, 0)";
    node.style.width = node.computedOriginalStyle.width; 
    node.style.height = node.computedOriginalStyle.height; 
  }

  inflateFadingTrailer(node) {
    const trailer = node.fadingTrailer;
    // if (!trailer.wasWrapper) {
    //   const verticalMargins = parseInt(node.computedOriginalStyle.marginTop) + parseInt(node.computedOriginalStyle.marginBottom);
    //   const horizontalMargins = parseInt(node.computedOriginalStyle.marginLeft) + parseInt(node.computedOriginalStyle.marginRight);
    //   trailer.style.marginTop = (node.originalBounds.height + verticalMargins) + "px";
    //   trailer.style.marginLeft = (node.originalBounds.width + horizontalMargins) + "px";
    //   trailer.style.opacity = "0";
    // } else {
      const bounds = trailer.originalBounds ? trailer.originalBounds : node.offsetBounds;
      trailer.style.width = bounds.width + "px"; 
      trailer.style.height = bounds.height + "px"; 
      trailer.style.maxWidth = trailer.style.width; 
      trailer.style.maxHeight = trailer.style.height;
    // }
  }

  minimizeIncomingFootprint(node) {
    logMark("minimizedStyleForMoved");
    log(node);
    log(node.wrapper);
    const wrapper = node.wrapper;
    log(node.wrapper.reusedWrapper)
    if (node.wrapper && !node.wrapper.reusedWrapper) {
      wrapper.style.height = "0px";
      wrapper.style.width = "0px";
      wrapper.style.overflow = "visible";
      // wrapper.style.position = "relative";
    }
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

  /**
   * Activate animation 
   */
  activateAnimation(flow, currentFlowChanges) {
    const node = flow.domNode;
    const changes = flow.changes; 
    
    console.group("Activate for " + flow.changes.type + ": " + flow.toString());
    log(`original properties: `);
    logProperties(flow.domNode.style, typicalAnimatedProperties);

    if (changes.type !== changeType.removed) {
      delete currentFlowChanges.beingRemovedMap[flow.id];
    }

    switch(flow.changes.type) {
      case changeType.added:
        this.setupFinalStyleForAdded(node);
        break;

      case changeType.resident: 
        if (flow.animateInChanges === currentFlowChanges.number) {
          this.setupFinalStyleForResident(node);
          flow.synchronizeDomNodeStyle(animatedProperties); // Really?
        }
        break;

      case changeType.moved:
        this.setupFinalStyleForMoved(node);
        flow.synchronizeDomNodeStyle(animatedProperties);
        break; 
        
      case changeType.removed: 
        flow.animation.setupFinalStyleForRemoved(flow.domNode);
        break; 
    }

    this.setupAnimationCleanup(flow.domNode, flow.domNode.changes);

    log("final properties: ");
    logProperties(flow.domNode.style, typicalAnimatedProperties);
    console.groupEnd();
  }

  /**
   * Final styles, the styles elements have at the end of the, before cleanup. 
   */
  setupFinalStyleForAdded(node) {
    node.style.transition = this.addedTransition(node);
    console.log("setupFinalStyleForAdded");
    console.log(node.wrapper);
    console.log(node.targetDimensions);
    if (node.wrapper && node.targetDimensions) {
      const targetDimensions = node.targetDimensions;
      Object.assign(node.wrapper.style, {
        transition: this.wrapperTransition(node),
        width: targetDimensions.widthIncludingMargin + "px",
        height: targetDimensions.heightIncludingMargin + "px"
      })
    }
    Object.assign(node.style, {
      transform: "matrix(1, 0, 0, 1, 0, 0)",
      opacity: "1"
    });
  }

  setupFinalStyleForResident(node) {
    node.style.transition = this.residentTransition(node);
    Object.assign(node.style, this.residentFinalStyle(node));
  }

  setupFinalStyleForMoved(node) {
    const wrapper = node.wrapper;
    node.style.transition = this.residentTransition(node);
    Object.assign(node.style, this.residentFinalStyle(node));
    if (wrapper) {
      // debugger; 
      wrapper.style.transition = this.residentTransition(node);
      wrapper.style.height = node.movedFinalSize.height + "px";
      wrapper.style.width = node.movedFinalSize.width + "px"; 
      // log(wrapper);
      // log(wrapper.style.width);
      // debugger; 
    }
    if (node.fadingTrailer && node.fadingTrailerOnChanges === flowChanges.number) {
      // debugger;
      node.fadingTrailer.style.transition = this.residentTransition(node);
      Object.assign(node.fadingTrailer.style, {
        width: "0px",
        height: "0px",
        maxWidth: "0px",
        maxHeight: "0px",
      });
    }
  }

  setupFinalStyleForRemoved(node) {
    node.style.transition = this.removeTransition();
    if (node.wrapper) {
      node.wrapper.style.transition = this.wrapperTransition(node);
      node.wrapper.style.width = "0px";
      node.wrapper.style.height = "0px";
    }
    Object.assign(node.style, this.removedFinalStyle(node));
  }

  residentTransition() {
    return this.defaultTransition();
  }

  
  getAnimatedProperties(computedStyle) {
    const result = {};
    animatedProperties.forEach(property => {
      if (typeof property === "string") {
        result[property] = computedStyle[property]
      } else {
        property.partial.forEach(partialProperty => {
          result[partialProperty] = computedStyle[partialProperty]
        });
      }
    });
    return result; 
  }

  residentFinalStyle(node) {
    // const targetStyle = node.targetStyle;// delete node.targetStyle;

    // const result = this.getAnimatedProperties(node.computedTargetStyle);
    const result = {};
    result.transform = "matrix(1, 0, 0, 1, 0, 0)";
    // delete result.maxHeight;
    // delete result.maxWidth;
    // result.margin = targetStyle.margin;
    // result.padding = targetStyle.padding;
    return result;
  }

  removedFinalStyle(node) {
    // const position = [Math.round(node.offsetWidth / 2), Math.round(node.offsetHeight / 2)];
    // const transform = "translate(" + position[0] + "px, " + position[1] + "px) matrix(0.0001, 0, 0, 0.0001, 0, 0) translate(" + -position[0] + "px, " + -position[1] + "px)"; // Not quite working as intended... but ok?
    return {
      transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)", //  transform,
      opacity: "0.001",
    }
  }

  /**
   * -------------------------------------------------------------------------------------
   * 
   *                           Animation cleanup
   * 
   * -------------------------------------------------------------------------------------
   */

  setupAnimationCleanup(node) {
    log("setupAnimationCleanup");
    log(node);
    if (node.wrapper) {
      log("wrapper")
      this.setupWrapperCleanup(node.wrapper)
    }
    if (node.fadingTrailer) {
      log("trailer")
      this.setupFadingTrailerCleanup(node.fadingTrailer)
    }

    // There can be only one
    if (node.hasCleanupEventListener) return; 
    
    function onTransitionEnd(event) {
      if (!node.changes) return;
      const propertyName = camelCase(event.propertyName); 

      console.group("cleanup: " + node.changes.type + " from changes number " + node.changes.number);
      log(node);
      log(event.propertyName);
      console.groupEnd();

      // Synch properties that was transitioned. 
      node.equivalentCreator.synchronizeDomNodeStyle([propertyName, "transition", "transform", "width", "height"]);
      
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
    node.addEventListener("transitionend", onTransitionEnd);
    node.hasCleanupEventListener = onTransitionEnd; 
  }
    
  setupFadingTrailerCleanup(node) {
    // There can be only one
    if (node.hasCleanupEventListener) return; 
    
    // On cleanup, synchronize transitioned style property
    const me = this; 
    log("setupAnimationCleanup: ");
    log(node)
    // log(node)
    
    function onTransitionEnd2(event) {
      // event.preventDefault();
      // event.stopPropagation();
      if (event.target !== node) return; 
      
      // if (changes === node.changes) {
      const propertyName = camelCase(event.propertyName); 

      console.group("cleanup trailer");
      log(node);
      log(event.propertyName);
      log(camelCase(event.propertyName));
      console.groupEnd();

      if (["width", "height", "maxHeight", "maxWidth"].includes(propertyName)) {
        node.parentNode.removeChild(node);

        // Finish animation
        node.removeEventListener("transitionend", onTransitionEnd2);
        delete node.hasCleanupEventListener;
      }
    }
    node.addEventListener("transitionend", onTransitionEnd2);
    node.hasCleanupEventListener = onTransitionEnd2; 
  }

  setupWrapperCleanup(wrapper) {
    const node = wrapper.wrapped; 
    // log("setupWrapperCleanup")
    // log(wrapper)
    // There can be only one
    if (wrapper.hasCleanupEventListener) return; 
    
    // On cleanup, synchronize transitioned style property
    const me = this; 
    // log("setupAnimationCleanup: " + inAnimationType + " " + frameNumber);
    // log(node)

    function onTransitionEnd(event) {
      // event.preventDefault();
      // event.stopPropagation();
      if (event.target !== wrapper) return; 

      // if (changes === node.changes) {
      const propertyName = camelCase(event.propertyName); 

      console.group("cleanup wrapper");
      log(node);
      log(event.propertyName);
      log(camelCase(event.propertyName));
      console.groupEnd();

      if (["width", "height"].includes(propertyName) && wrapper.wrapped) {
        // log(node.equivalentCreator.parentPrimitive.causality.target);
        log(wrapper.parentNode.equivalentCreator.causality.target);
        log(node.equivalentCreator.causality.target)
        if (node.parentNode === wrapper &&
          node.equivalentCreator.parentPrimitive === wrapper.parentNode.equivalentCreator) {
          const wrapped = wrapper.wrapped; 
          const container = wrapper.parentNode; 
          wrapper.removeChild(wrapped);
          container.replaceChild(wrapped, wrapper);
          node.equivalentCreator.synchronizeDomNodeStyle("position");
        } else {
          wrapper.parentNode.removeChild(wrapper);
        }

        // Remove Wrapper Relation
        if (wrapper.wrapped) {


          if (wrapper.wrapped.oldWrappers) {
            wrapper.wrapped.oldWrappers.remove(wrapper);
          }
          delete wrapper.wrapped.wrapper;
          delete wrapper.wrapped;
        }

        // Finish animation
        wrapper.removeEventListener("transitionend", onTransitionEnd);
        delete wrapper.hasCleanupEventListener;
      }
    }
    wrapper.addEventListener("transitionend", onTransitionEnd);
    wrapper.hasCleanupEventListener = onTransitionEnd; 
  }
}

export const standardAnimation = new DOMNodeAnimation();
  

export const animatedProperties = [
  // "transform",
  // "maxHeight",
  // "maxWidth",
  {compound: "margin", partial: ["marginBottom", "marginBottom", "marginLeft", "marginRight"]},
  {compound: "padding", partial: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]},
  "opacity",
  "color", 
  "fontSize",
];
