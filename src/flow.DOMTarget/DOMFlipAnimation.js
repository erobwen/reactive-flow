
// cubic-bezier(0.42,0,1,1)

import { flowChanges } from "./DOMAnimation";
import { movedPrimitives } from "./DOMFlowPrimitive";

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



export function draw(bounds, color="black") {
  // const outline = window.document.createElement("div");
  // outline.style.position = "absolute";
  // outline.style.top = bounds.top + "px";
  // outline.style.left = bounds.left + "px";
  // outline.style.width = bounds.width + "px";
  // outline.style.height = bounds.height + "px";
  // outline.style.borderWidth = "1px";
  // outline.style.borderStyle = "solid";
  // outline.style.borderColor = color;
  // document.children[0].appendChild(outline);
}


export class DOMFlipAnimation {
  animatedProperties = animatedProperties;

  blockedPropertiesMap() {
    const result = animatedProperties.reduce((result, property) => {
      if(typeof (property) === "string") {
        result[property] = true;
      } else {
        result[property.compound] = true; 
        property.partial.forEach(partial => {
          result[partial] = true; 
        });
      }
      return result; 
    }, {});
    result.transition = true; 
    return result; 
  }

  /**
   * Default transition
   */
  defaultTransition() {
    return "all 1s ease-in-out, opacity 1s ease-in"
  }

  removeTransition() {
    return "all 1s ease-in-out, opacity 1s ease-out"
  }

  /**
   * Record original bounds, before anything in the dome has changed
   */
  recordOriginalBoundsAndStyle(node) {
    node.originalBounds = node.getBoundingClientRect();
    draw(node.originalBounds);
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
   * Preserve style 
   */
  preserveStyleForMoved(node, includeTransform=false) {
    for (let property of this.animatedProperties) {
      if (property === "transform" && !includeTransform) continue; 
      if (typeof(property) === "string") {
        node.style[property] = node.computedOriginalStyle[property];
      } else {
        const compoundProperty = property; 
        for (let partial of compoundProperty.partial) {
          node.style[partial] = node.computedOriginalStyle[partial];
        }
      }
    }
  }

  calculateTargetDimensionsAndStyleForAdded(contextNode, node) {
    
    node.style.maxWidth = "";
    node.style.maxHeight = "";    
    node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this!
    // It may not be possble to record style at this stage? Do after dom is rebuilt maybe? 
    this.recordTargetStyleForAdded(node);
  }

  recordTargetStyleForAdded(node) {
    // contextNode.appendChild(node);
    node.targetStyle = {...node.style}
    node.computedTargetStyle = {...getComputedStyle(node)}; // Remove or optimize if not needed fully.
    // contextNode.removeChild(node); 
  }

  setOriginalMinimizedStyleForAdded(node) {
    Object.assign(node.style, this.addedOriginalMinimizedStyle(node));
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

  addedOriginalMinimizedStyle(node) {
    // if (node.addADeletedNode) {
    //   delete node.addADeletedNode;
    //   // const result = this.getAnimatedProperties(node.computedOriginalStyle);
    //   result.maxHeight = "0px"; node.computedOriginalStyle.height;
    //   result.maxWidth = node.computedOriginalStyle.width;
    //   return result;
    // }
    // const position = [Math.round(node.targetDimensions.width / 2), Math.round(node.targetDimensions.width / 2)];
    // const transform = "translate(" + position[0] + "px, " + position[1] + "px) scale(0) translate(" + -position[0] + "px, " + -position[1] + "px)";// Not quite working as intended... but ok?
    return {
      // transition: this.defaultTransition(),
      transform: "scale(0)",//transform, //"scale(1)", //
      maxHeight: "0px",
      maxWidth: "0px",
      // margin: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      // padding: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      opacity: "0",
      // color, fontSize?
    } 
  }


  /**
   * Remember target styles 
   */
  // calculateTargetDimensionsForAdded(contextNode, node) {
  //   node.targetDimensions = node.equivalentCreator.dimensions(contextNode); // Get a target size for animation, with initial styling. NOTE: This will cause a silent reflow of the DOM (without rendering). If you know your target dimensions without it, you can optimize this! 
  // }

  
 /**
   * When an element moves from one container to another, we do not want the new or previous container to suddenly change in size
   * For this reason the Flow framework adds extra elements to ajust for added or subtracted size, that gradually dissapear.  
   */
  getFadingTrailer(node) {
    const verticalMargins = parseInt(node.computedOriginalStyle.marginTop) + parseInt(node.computedOriginalStyle.marginBottom);
    const horizontalMargins = parseInt(node.computedOriginalStyle.marginLeft) + parseInt(node.computedOriginalStyle.marginRight);
    const trailer = document.createElement("div");
    trailer.style.marginTop = (node.originalBounds.height + verticalMargins) + "px";
    trailer.style.marginLeft = (node.originalBounds.width + horizontalMargins) + "px";
    trailer.style.opacity = "0";
    trailer.id = "trailer"
    node.fadingTrailerOnChanges = flowChanges.number;
    node.fadingTrailer = trailer;
    return trailer;
  }

  disappearingReplacementFinalStyle() {
    return {
      marginTop: "0px",
      marginLeft: "0px",
    }
  }

  minimizeIncomingFootprint(node) {
    // return; 
    // console.log("minimizeIncomingFootprint");
    const measures = this.getOriginalMeasures(node);
    
    node.animationStartTotalHeight = measures.totalHeight;
    node.animationStartMarginTop = measures.marginTop;
    node.animationStartAjustedMarginTop = measures.marginTop - measures.totalHeight;
    // node.animationEndMarginTop = parseInt(node.computedTargetStyle.marginTop, 10);
    node.style.marginTop = node.animationStartAjustedMarginTop + "px";

    node.animationStartTotalWidth = measures.totalWidth;
    node.animationStartMarginLeft = measures.marginLeft;
    node.animationStartAjustedMarginLeft = measures.marginLeft - measures.totalWidth;
    // node.animationEndMarginLeft = parseInt(node.computedTargetStyle.marginLeft, 10);
    node.style.marginLeft = node.animationStartAjustedMarginLeft + "px";

    // log(node.style.marginTop)
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

    node.style.transform = "translate(" + -deltaX + "px, " + -deltaY + "px)";
  }


  /**
   * Final styles, the styles elements have at the end of the, before cleanup. 
   */
  setupFinalStyleForAdded(node, animatedFinishStyles) {
    node.style.transition = this.addedTransition(node);
    Object.assign(node.style, this.addedFinalStyle(node, animatedFinishStyles));
  }

  setupFinalStyleForResident(node) {
    node.style.transition = this.residentTransition(node);
    Object.assign(node.style, this.residentFinalStyle(node));
  }

  setupFinalStyleForMoved(node) {
    node.style.transition = this.residentTransition(node);
    Object.assign(node.style, this.residentFinalStyle(node));
    if (node.fadingTrailer && node.fadingTrailerOnChanges === flowChanges.number) {
      node.fadingTrailer.style.transition = this.residentTransition(node);
      Object.assign(node.fadingTrailer.style, this.disappearingReplacementFinalStyle());
    }
  }

  setupFinalStyleForRemoved(node) {
    node.style.transition = this.removeTransition();
    Object.assign(node.style, this.removedFinalStyle(node));
  }
  
  addedTransition() {
    return this.defaultTransition();
  }

  addedFinalStyle(node, finishStyles) {
    // const targetStyle = node.targetStyle;// delete node.targetStyle;
    const result = {...finishStyles}//this.getAnimatedProperties(node.targetStyle);
    result.transform = "none";

    const targetDimensions = node.targetDimensions;// delete node.targetDimensions;
    result.maxHeight = targetDimensions.height + "px";
    result.maxWidth =  targetDimensions.width + "px";
    result.opacity = "1";
    // result.margin = targetStyle.margin;
    // result.padding = targetStyle.padding;
    return result; 
  }

  // transform: "", //transform,
  // maxHeight: "0px",
  // maxWidth: "0px",
  // margin: "0px",
  // marginTop: "0px",
  // marginBottom: "0px",
  // marginLeft: "0px",
  // marginRight: "0px",
  // padding: "0px",
  // paddingTop: "0px",
  // paddingBottom: "0px",
  // paddingLeft: "0px",
  // paddingRight: "0px",
  // opacity: "0",


  residentTransition() {
    return this.defaultTransition();
  }

  residentFinalStyle(node) {
    // const targetStyle = node.targetStyle;// delete node.targetStyle;

    // const result = this.getAnimatedProperties(node.computedTargetStyle);
    const result = {};
    result.transform = "scale(1)";
    // delete result.maxHeight;
    // delete result.maxWidth;
    // result.margin = targetStyle.margin;
    // result.padding = targetStyle.padding;
    return result;
  }

  removedFinalStyle(node) {
    // const position = [Math.round(node.offsetWidth / 2), Math.round(node.offsetHeight / 2)];
    // const transform = "translate(" + position[0] + "px, " + position[1] + "px) scale(0) translate(" + -position[0] + "px, " + -position[1] + "px)"; // Not quite working as intended... but ok?
    return {
      maxHeight: "0px",
      maxWidth: "0px",
      transform: "scale(0)", //  transform,
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
  setupAddedAnimationCleanup(node, number) {
    this.setupAnimationCleanup(node, false, number)
  }

  setupResidentAnimationCleanup(node) {
    this.setupAnimationCleanup(node, false, flowChanges.number)
    if (node.fadingTrailer) {
      this.setupAnimationCleanup(node.fadingTrailer, true, flowChanges.number);
      delete node.fadingTrailer; 
    }
  }

  setupRemovedAnimationCleanup(node) {
    this.setupAnimationCleanup(node, true, flowChanges.number)
  }

  setupAnimationCleanup(node, alsoRemoveNode, frameNumber) {
    const me = this; 
    function onTransitionEnd(event) {
      log("onTransitionEnd..." + node.animationType);
      // log(frameNumber)
      // log(node.inAnimationNumber)
      // log(node.animationType);
      event.preventDefault();
      event.stopPropagation();
      console.log(event);
      if (frameNumber === node.inAnimationNumber) {
        
        delete node.inAnimationNumber;
        if (["move", "resident", "added"].includes(node.animationType)) {
          // log("resetting")
          node.style.transition = "";
          if (node.equivalentCreator) {
            node.equivalentCreator.synchronizeDomNodeStyle(animatedProperties);
          }
        }

        node.removeEventListener("transitionend", onTransitionEnd);
  
        if (node.animationType === "remove") {
          // For trailer
          delete flowChanges.beingRemovedMap[node.equivalentCreator.id];
          node.parentNode.removeChild(node);
        }  
      }
    }

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

export const standardAnimation = new DOMFlipAnimation();




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
