
// cubic-bezier(0.42,0,1,1)

import { draw, logMark } from "../flow/utility";
import { changeType, flowChanges, logProperties, typicalAnimatedProperties } from "./DOMAnimation";
import { getWrapper, movedPrimitives } from "./DOMNode";

const log = console.log;
const animationTime = 9;

export class DOMNodeAnimation {
  /**
   * Default transition
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
          // debugger;
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


  /**
   * Measure inocming size 
   */
  measureMovedFinalSize(node) {
    node.movedFinalSize = {
      width: node.offsetWidth, 
      height: node.offsetHeight
    }
  }


  calculateTargetDimensionsAndStyleForAdded(contextNode, node) {
    
    // node.style.maxWidth = ""; // This causes bounce remove add to fail... we do not preserve the max sizes... 
    // node.style.maxHeight = "";    
    node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this!
    // It may not be possble to record style at this stage? Do after dom is rebuilt maybe? 
    // log("calculateTargetDimensionsAndStyleForAdded");
    // log(node.targetDimensions);
    this.recordTargetStyleForAdded(node);
  }

  recordTargetStyleForAdded(node) {
    node.targetStyle = {...node.style}
    node.computedTargetStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully.
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
  
      Object.assign(node.style, {
        transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",//transform, //"matrix(1, 0, 0, 1, 0, 0)", //
        position: "absolute", 
        width: node.targetDimensions.widthWithoutMargin + "px",
        height: node.targetDimensions.heightWithoutMargin + "px",
        opacity: "0",
      });
      console.log(node.style.transform);
    }
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

  
 /**
   * When an element moves from one container to another, we do not want the new or previous container to suddenly change in size
   * For this reason the Flow framework adds extra elements to ajust for added or subtracted size, that gradually dissapear.  
   */
  getFadingTrailer(node) {
    let trailer; 

    // Reuse wrapper if existing, as it is already in right place
    if (node.wrapper) {
      trailer = node.wrapper;
      trailer.removeEventListener(trailer.hasCleanupEventListener);
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

  fadingTrailerFinalStyle() {
    return {
      width: "0px",
      height: "0px",
      maxWidth: "0px",
      maxHeight: "0px",
    }
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
   * Record bounds, measures after structure change using original style  
   */

  recordBoundsInNewStructure(node) {
    // node.style.transform = ""; // Cannot do here as some resident nodes will continue on same animation.
    node.newStructureBounds = node.getBoundingClientRect();
    movedPrimitives.push(node)
    draw(node.newStructureBounds, "red");
  }


  /**
   * Translate to original position
   */

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
      Object.assign(node.fadingTrailer.style, this.fadingTrailerFinalStyle());
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
   * Setup animation cleanup 
   */
  setupAddedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, node.changes.type, flowChanges.number)
  }

  setupResidentAnimationCleanup(node) {
    this.setupAnimationCleanup(node, node.changes.type, flowChanges.number)
    if (node.fadingTrailer) {
      // node.fadingTrailer.changes.number = flowChanges.number;
      // node.fadingTrailer.changes.type = changeType.removed;
      this.setupRemovedAnimationCleanup(node.fadingTrailer, flowChanges.number);
      delete node.fadingTrailer; 
    }
  }

  setupRemovedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, node.changes.type, flowChanges.number)
  }

  setupAnimationCleanup(node, inAnimationType, frameNumber) {
    const me = this; 
    // log("setupAnimationCleanup: " + inAnimationType + " " + frameNumber);
    // log(node)
    function onTransitionEnd(event) {
      console.log("onTransitionEnd: " + inAnimationType + " " + frameNumber + " cleanup: " + frameNumber === node.changes.number);
      
      node.removeEventListener("transitionend", onTransitionEnd);

      if (frameNumber === node.changes.number && !node.changes.finished) {
        console.group("cleanup...")
        log(event.target);
        console.groupEnd();
          
        log("onTransitionEnd..." + node.changes.type);
        // log(frameNumber)
        // log(node.changes.number)
        // log(node.changes.type);
        event.preventDefault();
        event.stopPropagation();
        console.log(event);
        
        if (node.changes.type === changeType.removed) {
          // For trailer
          if (node.equivalentCreator) {
            delete flowChanges.beingRemovedMap[node.equivalentCreator.id];
          }
          node.parentNode.removeChild(node);
        }  
        
        node.style.transition = "";
        if (node.equivalentCreator) {
          node.equivalentCreator.synchronizeDomNodeStyle(animatedProperties);
          log(`cleanup properties: `);
          logProperties(node.style, typicalAnimatedProperties);
        }

        node.changes.finished = true; 
      }
    }

    // if (typeof(node.eventListenerFrameNumber) !== "undefined") {
    //   if (node.eventListenerFrameNumber !== frameNumber) {
    //     node.removeEventListener("transitionend", onTransitionEnd);
    //   }
    // }

    node.eventListenerFrameNumber = frameNumber; 
    node.addEventListener("transitionend", onTransitionEnd);
  }

  cleanupAnimation(node) {
    // All
    node.style.transition = "";

    // if (node.equivalentCreator) {
    //   node.equivalentCreator.synchronizeDomNodeStyle(animatedProperties);
    // }

    // // Added cleanup
    // node.style.width = "";
    // node.style.height = "";
    // node.style.maxWidth = "";
    // node.style.maxHeight = "";
    // node.style.opacity = "";
    
    // // Resident
    // node.style.color = "";
    // node.style.fontSize = "";

    // if (node.savedIncomingMeasures) {
    //   delete node.savedIncomingMeasures;
    // }
  }



}

export const standardAnimation = new DOMNodeAnimation();




  /**
   * Cleanup mid animation. 
  //  */
  // cleanupPossibleAnimation(node) {
  //   if (node.inAnimation) {
  //     this.cleanupMidAnimation(node);
  //   }
  // }

  // cleanupMidAnimation(node) {
  //   // node.style.transition = "";
  //   const computedStyle = window.getComputedStyle(node);
  //   for (let property of animatedProperties) {
  //     if (typeof property === "string") {
  //       node.style[property] = computedStyle[property]; 
  //     } else {
  //       for (let partialProperty of property.partial) {
  //         node.style[partialProperty] = computedStyle[partialProperty];
  //       }
  //     }
  //   }
  //   node.haltedInAnimation = true; 
  //   delete node.inAnimation; 


    // const previouslySetStyles = node.equivalentCreator && node.equivalentCreator.unobservable.previouslySetStyles;
    // if (previouslySetStyles) {
    //   log("this.cleanupAnimation");
    //   // log(node);
    //   // log({...node.style})
    //   let index = 0; 
    //   while (index < node.style.length) {
    //     const property = camelCased(node.style.item(index));
    //     const shorthandProperty = firstOfCamelCase(property);
    //     log("found " +  property);
    //     if (!previouslySetStyles[property] && !previouslySetStyles[shorthandProperty]) {
    //       log("REMOVE ALIEN STYLE:" + property);
    //       node.style[property] = node.targetStyle[property];
    //     }
    //     index++;
    //   }
    // } else {
    //   log("No previous set styles: ")
    //   console.log(node);
    // }
    // log({...node.style})
    // // All
    // node.style.transition = node.targetStyle.transition;
    // node.style.transform = node.targetStyle.transform;

    // // Added cleanup
    // node.style.width = node.targetStyle.width;
    // node.style.height = node.targetStyle.height;
    // node.style.maxWidth = node.targetStyle.maxWidth;
    // node.style.maxHeight = node.targetStyle.maxHeight;
    // node.style.opacity = node.targetStyle.opacity;
    
    // node.style.margin = node.targetStyle.margin;
    // node.style.marginTop = node.targetStyle.marginTop;
    // node.style.marginBottom = node.targetStyle.marginBottom;
    // node.style.marginLeft = node.targetStyle.marginLeft;
    // node.style.marginRight = node.targetStyle.marginRight;

    // Resident
    // node.style.color = "";
    // node.style.fontSize = "";

    // if (node.savedIncomingMeasures) {
    //   delete node.savedIncomingMeasures;
    // }
  // }
