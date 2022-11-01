
// cubic-bezier(0.42,0,1,1)

const log = console.log;

export class DOMFlipAnimation {
  /**
   * Default transition
   */
  defaultTransition() {
    return "all 5s ease-in-out, opacity 1s ease-in"
  }

  removeTransition() {
    return "all 5s ease-in-out, opacity 0.5s ease-out"
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
    let measures;
    if (node.savedIncomingMeasures) {
      measures = node.savedIncomingMeasures;  
    } else {
      measures = this.getOriginalMeasures(node);
      node.savedIncomingMeasures = measures;
    }
    node.style.marginTop = (measures.marginTop - measures.totalHeight) + "px";
    node.style.marginLeft = (measures.marginLeft - measures.totalWidth) + "px";
  }


  /**
   * Remember target styles 
   */

  rememberTargetStyle(node) {
    node.targetStyle = {...node.style}; // Remember so we can reset it later
    node.computedTargetStyle = {...getComputedStyle(node)};
    console.log(node.computedTargetStyle.fontSize);
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

  residentOriginalStyle(node) {
    // If we could animate to auto, this would be a place to freeze the current style, so that we can animate from it. 
    // If the node has moved to another context, it might otherwise instantly change to a style of that context, 
    // And we want the change to be gradual. 
    console.log("original: " + node.computedOriginalStyle.fontSize);
    return {
      transform: node.computedOriginalStyle.transform,
      color: node.computedOriginalStyle.color,
      fontSize: node.computedOriginalStyle.fontSize
    }
  }
  
  removedOriginalStyle(node) {
    // Add pre-set offset for fly-out effect in the opposite direction
    const style = node.computedOriginalStyle; delete node.computedOriginalStyle;
    return {
      transform: "scale(1)",
      opacity: "1",
      maxHeight: style.height,
      maxWidth: style.width
    }
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
    if (node.savedIncomingMeasures) {
      node.style.marginTop = node.savedIncomingMeasures.marginTop + "px";
      node.style.marginLeft =  node.savedIncomingMeasures.marginLeft + "px";
    }
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
    const targetStyle = node.targetStyle; delete node.targetStyle;
    const targetDimensions = node.targetDimensions; delete node.targetDimensions;

    return {
      transform: "scale(1)",
      opacity: "1",
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
    } 
  }

  residentTransitionStyle() {
    return {
      transition: this.defaultTransition()
    }
  }

  residentFinalStyle(node) {
    console.log("final: " + node.computedTargetStyle.fontSize);

    return {
      transform: "scale(1)",
      color: node.computedTargetStyle.color,
      fontSize: node.computedTargetStyle.fontSize
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
    this.setupAnimationCleanup(node)
  }

  setupResidentAnimationCleanup(node) {
    this.setupAnimationCleanup(node)
    if (node.disappearingExpander) {
      this.setupAnimationCleanup(node.disappearingExpander, true);
      delete node.disappearingExpander; 
    }
  }

  setupRemovedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, true)
  }

  setupAnimationCleanup(node, alsoRemoveNode) {
    function onTransitionEnd(event) {
      if (alsoRemoveNode) {
        node.parentNode.removeChild(node);
      }
      if (node.savedIncomingMeasures) {
        delete node.savedIncomingMeasures;
      }
      node.style.transition = "";
      node.style.width = "";
      node.style.height = "";
      node.style.maxWidth = "";
      node.style.maxHeight = "";
      node.style.opacity = "";
      node.style.color = "";
      node.style.fontSize = "";
      node.removeEventListener("transitionend", onTransitionEnd);
    }

    node.addEventListener("transitionend", onTransitionEnd);
  }
}

export const standardAnimation = new DOMFlipAnimation();