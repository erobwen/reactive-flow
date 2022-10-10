
// cubic-bezier(0.42,0,1,1)

const log = console.log;

export class DOMFlipAnimation {
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
    node.originalStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully. 
  }
    
 /**
   * Dissapearing expander and contractors
   * When an element moves from one container to another, we do not want the new or previous container to suddenly change in size
   * For this reason the Flow framework adds extra elements to ajust for added or subtracted size, that gradually dissapear.  
   */
  getMeasures(node) {
    const measures = {
      marginTop: parseInt(node.originalStyle.marginTop, 10),
      marginBottom: parseInt(node.originalStyle.marginBottom, 10),
      marginLeft: parseInt(node.originalStyle.marginLeft, 10),
      marginRight: parseInt(node.originalStyle.marginRight, 10),
      width: node.originalBounds.width,
      height: node.originalBounds.height
    }
    measures.totalHeight = measures.height + measures.marginTop + measures.marginBottom;
    measures.totalWidth = measures.width + measures.marginLeft + measures.marginRight;
    return measures; 
  }

  getDisappearingReplacement(node) {
    const verticalMargins = parseInt(node.originalStyle.marginTop) + parseInt(node.originalStyle.marginBottom);
    const horizontalMargins = parseInt(node.originalStyle.marginLeft) + parseInt(node.originalStyle.marginRight);
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
      measures = this.getMeasures(node);
      node.savedIncomingMeasures = measures;
    }
    node.style.marginTop = (measures.marginTop - measures.totalHeight) + "px";
    node.style.marginLeft = (measures.marginLeft - measures.totalWidth) + "px";
  }


  /**
   * Initial styles, the styles elements have at the start of the animation 
   */

  measureInitialStyleForAdded(contextNode, node) {
    node.rememberedStyle = {...node.style}; // Remember so we can reset it later
    node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this! 
  }

  setupInitialStyleForAdded(node) {
    Object.assign(node.style, this.addedInitialStyle(node));
  }

  setupInitialStyleForResident(node) {
    Object.assign(node.style, this.residentInitialStyle());
  }


  setupInitialStyleForRemoved(node) {
    Object.assign(node.style, this.removedInitialStyle(node));
  }

  addedInitialStyle(node) {
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

  residentInitialStyle() {
    // If we could animate to auto, this would be a place to freeze the current style, so that we can animate from it. 
    // If the node has moved to another context, it might otherwise instantly change to a style of that context, 
    // And we want the change to be gradual. 
    return {
      transform: "scale(1)",
    }
  }
  
  removedInitialStyle(node) {
    // Add pre-set offset for fly-out effect in the opposite direction
    const style = node.originalStyle; delete node.originalStyle;
    return {
      transform: "scale(1)",
      opacity: "1",
      maxHeight: style.height,
      maxWidth: style.width
    }
  }


  /**
   * Record Initial bounds, measures after structure change using with initial style  
   */

  recordInitialBounds(node) {
    node.initialBounds = node.getBoundingClientRect();
  }


  /**
   * Translate to original position
   */

  translateAddedFromInitialToOriginalPosition(node) {
    // Potentially add pre-set offset for fly-in effect
  }

  translateResidentFromInitialToOriginalPosition(node) {
    this.translateFromInitialToOriginalPosition(node); 
  }

  translateRemovedFromInitialToOriginalPosition(node) {
    this.translateFromInitialToOriginalPosition(node); 
  }

  translateFromInitialToOriginalPosition(node) {
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
    Object.assign(node.style, this.residentFinalStyle());
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
    const rememberedStyle = node.rememberedStyle; delete node.rememberedStyle;
    const targetDimensions = node.targetDimensions; delete node.targetDimensions;

    return {
      transform: "scale(1)",
      opacity: "1",
      maxHeight: targetDimensions.height + "px",
      maxWidth: targetDimensions.width + "px",
      margin: rememberedStyle.margin, 
      marginTop: rememberedStyle.marginTop, 
      marginBottom: rememberedStyle.marginBottom, 
      marginLeft: rememberedStyle.marginLeft, 
      marginRight: rememberedStyle.marginRight, 
      padding: rememberedStyle.padding,
      paddingTop: rememberedStyle.paddingTop,
      paddingBottom: rememberedStyle.paddingBottom,
      paddingLeft: rememberedStyle.paddingLeft,
      paddingRight: rememberedStyle.paddingRight,
    } 
  }

  residentTransitionStyle() {
    return {
      transition: this.defaultTransition()
    }
  }

  residentFinalStyle() {
    return {
      transform: "scale(1)",
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
      node.removeEventListener("transitionend", onTransitionEnd);
    }

    node.addEventListener("transitionend", onTransitionEnd);
  }
}

export const standardAnimation = new DOMFlipAnimation();