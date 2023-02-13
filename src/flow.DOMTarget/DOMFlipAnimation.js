
// cubic-bezier(0.42,0,1,1)

import { currentFrameNumber } from "./DOMAnimation";

const log = console.log;

var camelCased = (myString) => myString.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
const sizeProperties = [];
const residentTransitionProperties = ["color", "fontSize"];


const firstOfCamelCase = (camelCase) => 
  camelCase.replace(/([A-Z])/g, " $1").split(" ")[0];

const animatedProperties = [
  "transform",
  "maxHeight",
  "maxWidth",
  {compound: "margin", partial: ["marginBottom", "marginBottom", "marginLeft", "marginRight"]},
  {compound: "padding", partial: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]},
  "opacity",
  "color", 
  "fontSize",
];


export class DOMFlipAnimation {
  animatedProperties = animatedProperties;

  /**
   * Default transition
   */
  defaultTransition() {
    return "all .5s ease-in-out, opacity 1s ease-in"
  }

  removeTransition() {
    return "all .5s ease-in-out, opacity 0.5s ease-out"
  }

  /**
   * Record original bounds, before anything in the dome has changed
   */
  recordOriginalBoundsAndStyle(node) {
    node.originalBounds = node.getBoundingClientRect();
    node.originalStyle = {...node.style}
    node.computedOriginalStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully. 
  }
  
  getOriginalMeasures(node) {
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
   * Cleanup mid animation. 
   */
  cleanupPossibleAnimation(node) {
    if (node.inAnimation) {
      this.cleanupMidAnimation(node);
    }
  }

  cleanupMidAnimation(node) {
    node.transition = "";
    const computedStyle = window.getComputedStyle(node);
    for (let property of animatedProperties) {
      if (typeof property === "string") {
        node.style[property] = computedStyle[property]; 
      } else {
        for (let partialProperty of property.partial) {
          node.style[partialProperty] = computedStyle[partialProperty];
        }
      }
    }
    node.haltedInAnimation = true; 
    delete node.inAnimation; 


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
  }



  /**
   * Remember target styles 
   */


  rememberTargetStyle(node) {
    node.targetStyle = {...node.style}; // Remember so we can reset it later
    node.computedTargetStyle = {...getComputedStyle(node)};
    // console.log(node.computedTargetStyle.fontSize);
  }

  calculateTargetDimensionsForAdded(contextNode, node) {
    node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this! 
  }

  
  /**
   * Reinstated original styles, the styles elements have at the start of the animation 
   */
  reinstateOriginalStyleForAdded(node) {
    Object.assign(node.style, this.addedOriginalStyle(node));
  }

  reinstateOriginalStyleForResident(node) {
    Object.assign(node.style, this.residentOriginalStyle(node));
  }

  reinstateOriginalStyleForRemoved(node) {
    Object.assign(node.style, this.removedOriginalStyle(node));
  }

  addedOriginalStyle(node) {
    const position = [Math.round(node.targetDimensions.width / 2), Math.round(node.targetDimensions.width / 2)];
    const transform = "translate(" + position[0] + "px, " + position[1] + "px) scale(0) translate(" + -position[0] + "px, " + -position[1] + "px)";// Not quite working as intended... but ok?
    return {
      transform: transform,
      maxHeight: "0px",
      maxWidth: "0px",
      margin: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      padding: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      opacity: "0"
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

  residentOriginalStyle(node) {
    // return {...node.computedOriginalStyle}; 
    // If we could animate to auto, this would be a place to freeze the current style, so that we can animate from it. 
    // If the node has moved to another context, it might otherwise instantly change to a style of that context, 
    // And we want the change to be gradual. 
    // console.log("original: " + node.computedOriginalStyle.fontSize);
    // console.log(node.computedOriginalStyle);
    
    return this.getAnimatedProperties(node.computedOriginalStyle);
  }
  
  removedOriginalStyle(node) {
    const style = node.computedOriginalStyle; delete node.computedOriginalStyle;
    const result = this.getAnimatedProperties(style);
    // result.transform = "scale(1)";
    result.maxHeight = style.height; 
    result.maxWidth = style.width; 
    return result; 
    // Add pre-set offset for fly-out effect in the opposite direction
    // const style = node.computedOriginalStyle; 
    // return style; 
    return {
      transform: "scale(1)",
      opacity: style.opacity,
      maxHeight: style.height,
      maxWidth: style.width
    }
  }

 /**
   * Reinstate original positions and container sizes.
   * Dissapearing expander and contractors
   * When an element moves from one container to another, we do not want the new or previous container to suddenly change in size
   * For this reason the Flow framework adds extra elements to ajust for added or subtracted size, that gradually dissapear.  
   */
  getDisappearingReplacement(node) {
    const verticalMargins = parseInt(node.computedOriginalStyle.marginTop) + parseInt(node.computedOriginalStyle.marginBottom);
    const horizontalMargins = parseInt(node.computedOriginalStyle.marginLeft) + parseInt(node.computedOriginalStyle.marginRight);
    const expander = document.createElement("div");
    expander.style.marginTop = (node.originalBounds.height + verticalMargins) + "px";
    expander.style.marginLeft = (node.originalBounds.width + horizontalMargins) + "px";
    expander.style.opacity = "0";
    expander.id = "expander"
    node.disappearingExpander = expander;
    return expander;
  }

  disappearingReplacementFinalStyle() {
    return {
      marginTop: "0px",
      marginLeft: "0px",
    }
  }

  minimizeIncomingFootprint(node) {
    // console.log("minimizeIncomingFootprint");
    const measures = this.getOriginalMeasures(node);
    
    node.animationStartTotalHeight = measures.totalHeight;
    node.animationStartMarginTop = measures.marginTop;
    node.animationStartAjustedMarginTop = measures.marginTop - measures.totalHeight;
    node.animationEndMarginTop = parseInt(node.computedTargetStyle.marginTop, 10);
    node.style.marginTop = node.animationStartAjustedMarginTop + "px";

    node.animationStartTotalWidth = measures.totalWidth;
    node.animationStartMarginLeft = measures.marginLeft;
    node.animationStartAjustedMarginLeft = measures.marginLeft - measures.totalWidth;
    node.animationEndMarginLeft = parseInt(node.computedTargetStyle.marginLeft, 10);
    node.style.marginLeft = node.animationStartAjustedMarginLeft + "px";

    // log(node.style.marginTop)
  }

  undoMinimizeIncomingFootprint(node) {
    // log("undoMinimizeIncomingFootprint")
    return; 
    // The following code was a failed attempt to chain animations...  TODO: find out why it failed and fix it. 
    
    // Calculate animation completeness
    const marginTop = parseInt(node.computedOriginalStyle.marginTop, 10); 
    const animationCompleteness = (marginTop - node.animationStartAjustedMarginTop) /
    (node.animationEndMarginTop - node.animationStartAjustedMarginTop);
    
    // Adjust original margin top
    const restoredMarginTop = node.animationStartMarginTop + 
    animationCompleteness * (node.animationEndMarginTop - node.animationStartMarginTop); 
    node.style.marginTop = restoredMarginTop + "px";
    node.computedOriginalStyle.marginTop =  restoredMarginTop + "px";
    const topDelta = restoredMarginTop - marginTop;
    
    // Adjust original margin left
    const marginLeft = parseInt(node.computedOriginalStyle.marginLeft, 10); 
    const restoredMarginLeft = node.animationStartMarginLeft + 
      animationCompleteness * (node.animationEndMarginLeft - node.animationStartMarginLeft); 
    node.style.marginLeft = restoredMarginLeft + "px";
    node.computedOriginalStyle.marginLeft =  restoredMarginLeft + "px";
    const leftDelta = restoredMarginLeft - marginLeft;

    // Ajust original bounds
    node.originalBounds = new DOMRect(
      node.originalBounds.left - leftDelta, 
      node.originalBounds.top - topDelta, 
      node.originalBounds.width + leftDelta, 
      node.originalBounds.height + topDelta);
  }


  /**
   * Record bounds, measures after structure change using original style  
   */

  recordBoundsInNewStructure(node) {
    node.initialBounds = node.getBoundingClientRect();
  }


  /**
   * Translate to original position
   */

  translateAddedFromNewToOriginalPosition(node) {
    // Potentially add pre-set offset for fly-in effect
  }

  translateResidentFromNewToOriginalPosition(node) {
    this.translateFromNewToOriginalPosition(node); 
  }

  translateRemovedFromNewToOriginalPosition(node) {
    this.translateFromNewToOriginalPosition(node); 
  }

  translateFromNewToOriginalPosition(node) {
    node.style.transition = "";
    const animationOriginNode = node.animationOriginNode; //delete node.animationOriginNode;
    const originOriginalBounds = animationOriginNode.originalBounds; //delete animationOriginNode.originalBounds;
    const originInitialBounds = animationOriginNode.initialBounds; //delete animationOriginNode.initialBounds;
    const originalBounds = node.originalBounds; //delete node.originalBounds;
    const initialBounds = node.initialBounds; //delete node.initialBounds;
    const deltaX = (initialBounds.left - originInitialBounds.left) - (originalBounds.left - originOriginalBounds.left);
    const deltaY = (initialBounds.top - originInitialBounds.top) - (originalBounds.top - originOriginalBounds.top);
    node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";
  }


  /**
   * Final styles, the styles elements have at the end of the, before cleanup. 
   */
  setupFinalStyleForAdded(node) {
    Object.assign(node.style, this.addedFinalStyle(node));
    Object.assign(node.style, this.addedTransitionStyle(node));
  }

  setupFinalStyleForResident(node) {
    Object.assign(node.style, this.residentFinalStyle(node));
    Object.assign(node.style, this.residentTransitionStyle(node));
    if (node.disappearingExpander) {
      Object.assign(node.disappearingExpander.style, this.residentTransitionStyle(node));
      Object.assign(node.disappearingExpander.style, this.disappearingReplacementFinalStyle());
    }
    // if (node.savedIncomingMeasures) {
    //   node.style.marginTop = node.savedIncomingMeasures.marginTop + "px";
    //   node.style.marginLeft =  node.savedIncomingMeasures.marginLeft + "px";
    // }
  }
  
  setupFinalStyleForRemoved(node) {
    Object.assign(node.style, this.removedFinalStyle(node));
    Object.assign(node.style, this.removedTransitionStyle(node));
  }
  
  addedTransitionStyle() {
    return {
      transition: this.defaultTransition()
    }
  }

  addedFinalStyle(node) {
    const targetStyle = node.targetStyle;// delete node.targetStyle;
    const targetDimensions = node.targetDimensions;// delete node.targetDimensions;

    return {
      transform: "scale(1)",
      maxHeight: targetDimensions.height + "px",
      maxWidth: targetDimensions.width + "px",
      margin: targetStyle.margin, 
      marginTop: targetStyle.marginTop, 
      marginBottom: targetStyle.marginBottom, 
      marginLeft: targetStyle.marginLeft, 
      marginRight: targetStyle.marginRight, 
      padding: targetStyle.padding,
      paddingTop: targetStyle.paddingTop,
      paddingBottom: targetStyle.paddingBottom,
      paddingLeft: targetStyle.paddingLeft,
      paddingRight: targetStyle.paddingRight,
      opacity: "1",
    } 
  }

  residentTransitionStyle() {
    return {
      transition: this.defaultTransition()
    }
  }

  residentFinalStyle(node) {
    const targetStyle = node.targetStyle;// delete node.targetStyle;
    const targetDimensions = node.targetDimensions;// delete node.targetDimensions;

    return {
      transform: "scale(1)",
      margin: targetStyle.margin, 
      marginTop: targetStyle.marginTop, 
      marginBottom: targetStyle.marginBottom, 
      marginLeft: targetStyle.marginLeft, 
      marginRight: targetStyle.marginRight, 
      padding: targetStyle.padding,
      paddingTop: targetStyle.paddingTop,
      paddingBottom: targetStyle.paddingBottom,
      paddingLeft: targetStyle.paddingLeft,
      paddingRight: targetStyle.paddingRight,
      color: node.computedTargetStyle.color,
      fontSize: node.computedTargetStyle.fontSize,
    }
  }
  
  removedTransitionStyle() {
    return {
      transition: this.removeTransition()
    }
  }

  removedFinalStyle(node) {
    const position = [Math.round(node.offsetWidth / 2), Math.round(node.offsetHeight / 2)];
    const transform = "translate(" + position[0] + "px, " + position[1] + "px) scale(0) translate(" + -position[0] + "px, " + -position[1] + "px)"; // Not quite working as intended... but ok?
    return {
      transition: this.defaultTransition(),
      maxHeight: "0px",
      maxWidth: "0px",
      transform: transform,
      opacity: "0.001",
      margin: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      padding: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
    }
  }

  /**
   * Setup animation cleanup 
   */
  setupAddedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, false, currentFrameNumber)
  }

  setupResidentAnimationCleanup(node) {
    this.setupAnimationCleanup(node, false, currentFrameNumber)
    if (node.disappearingExpander) {
      this.setupAnimationCleanup(node.disappearingExpander, true, currentFrameNumber);
      delete node.disappearingExpander; 
    }
  }

  setupRemovedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, true, currentFrameNumber)
  }

  setupAnimationCleanup(node, alsoRemoveNode, frameNumber) {
    const me = this; 
    function onTransitionEnd(event) {
      // console.log(event);
      if (frameNumber === currentFrameNumber) {
        delete node.inAnimation;

        node.removeEventListener("transitionend", onTransitionEnd);
        me.cleanupAnimation(node);
  
        if (alsoRemoveNode) {
          // For dissapearing replacement
          node.parentNode.removeChild(node);
        }  
      }
    }

    node.addEventListener("transitionend", onTransitionEnd);
  }

  cleanupAnimation(node) {
    // All
    node.style.transition = "";

    if (node.equivalentCreator) {
      node.equivalentCreator.synchronizeDomNodeStyle(animatedProperties);
    }

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

export const standardAnimation = new DOMFlipAnimation();


