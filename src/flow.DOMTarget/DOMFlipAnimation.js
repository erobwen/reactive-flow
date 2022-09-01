


export class DOMFlipAnimation {
  /**
   * Record original bounds, before anything in the dome has changed
   */

  recordOriginalBoundsAndStyle(node) {
    node.originalBounds = node.getBoundingClientRect();
    node.originalStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully. 
  }
  

  /**
   * Initial styles, the styles elements have at the start of the animation 
   */

  setupInitialStyleForAdded(node) {
    node.rememberedStyle = {...node.style}; // Remember so we can reset it later
    node.targetDimensions = node.equivalentCreator.dimensions(); // Get a target size for animation, with initial styling. 
    Object.assign(node.style, this.addedInitialStyle());
  }

  setupInitialStyleForResident(node) {
    Object.assign(node.style, this.residentInitialStyle());
  }


  setupInitialStyleForRemoved(node) {
    Object.assign(node.style, this.removedInitialStyle(node));
  }

  addedInitialStyle() {
    return {
      transform: "scale(0)",
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
    const originalBounds = node.originalBounds; delete node.originalBounds;
    const initialBounds = node.initialBounds; delete node.initialBounds;
    const deltaX = initialBounds.left - originalBounds.left;
    const deltaY = initialBounds.top - originalBounds.top;
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
  }
  
  setupFinalStyleForRemoved(node) {
    Object.assign(node.style, this.removedFinalStyle());
    Object.assign(node.style, this.removedTransitionStyle(node));
  }
  
  addedTransitionStyle() {
    return {
      transition: "all 0.4s ease-in-out"
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
      transition: "all 0.4s ease-in-out"
    }
  }

  residentFinalStyle() {
    return {
      transform: "scale(1)",
    }
  }
  
  removedTransitionStyle() {
    return {
      transition: "all 0.4s ease-in-out"
    }
  }

  removedFinalStyle(node) {
    return {
      transition: "all 0.4s ease-in-out",
      maxHeight: "0px",
      maxWidth: "0px",
      transform: "scale(0) translate(0, 0)",
      opacity: "0",
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
  }

  setupRemovedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, true)
  }

  setupAnimationCleanup(node, alsoRemoveNode) {
    function onTransitionEnd(event) {
      if (alsoRemoveNode) {
        node.parentNode.removeChild(node);
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