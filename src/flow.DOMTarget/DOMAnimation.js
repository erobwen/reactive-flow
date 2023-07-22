import { repeat, Flow, trace, configuration, flow, activeTrace, creators } from "../flow/Flow";
import { DOMNodeAnimation, standardAnimation } from "./DOMNodeAnimation";
import { getWrapper } from "./DOMNode";
import { logMark, logAnimationFrame, logAnimationFrameEnd, logAnimationSeparator } from "../flow/utility";

const log = console.log;

/**
 * Installation
 */

export function installDOMAnimation() {
  configuration.onFinishReBuildingFlowCallbacks.push(onFinishReBuildingFlow);
  configuration.onFinishReBuildingDOMCallbacks.push(onFinishReBuildingDOM);
}


/**
 * DOM Flow Targets to animate
 */

const domFlowTargets = [];

export function addDOMFlowTarget(target) {
  domFlowTargets.push(target)
}

export function removeDOMFlowTarget(target) {
  domFlowTargets.splice(domFlowTargets.indexOf(target), 1);
}


/**
 * Debug printouts
 */

export const typicalAnimatedProperties = [
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

export function logProperties(object, properties) {
  log(extractProperties(object, properties));
}

export function extractProperties(object, properties) {
  const condensed = {};
  properties.forEach(property => {
    if (typeof(property) !== "string") {
      property.partial.forEach(part => {
        if (object[part]) {
          condensed[part] = object[part]   
        }
      });
      if (object[property.compound]) {
        condensed[property.compound] = object[property.compound];
      }
    } else {
      if (object[property]) {
        condensed[property] = object[property];
      }
    }
  });
  return condensed;
}


/**
 * Global flow change tracking
 */

export const flowChanges = {
  number: 0,

  idPrimitiveMap: {},
  idParentIdMap: {},

  globallyAdded: {},
  globallyRemoved: {},
  globallyResident: {},
  globallyMoved: {},

  globallyAddedAnimated: {},
  globallyRemovedAnimated: {},
  globallyResidentAnimated: {},
  globallyMovedAnimated: {},

  beingRemovedMap: {},

  *allAnimatedFlows() {
    for (let flow of Object.values(this.globallyAddedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyRemovedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyResidentAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
  },

  *allAddedFlows() {
    for (let flow of Object.values(this.globallyAdded)) {
      yield flow; 
    }
  },
  
  *allAnimatedAddedFlows() {
    for (let flow of Object.values(this.globallyAddedAnimated)) {
      yield flow; 
    }
  },
  
  *allAnimatedRemovedFlows() {
    for (let flow of Object.values(this.globallyRemovedAnimated)) {
      yield flow; 
    }
  },

  *allAnimatedResidentFlows() {
    for (let flow of Object.values(this.globallyResidentAnimated)) {
      yield flow; 
    }
  },

  *allAnimatedMovedFlows() {
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
  },

  *allAnimatedMovedResidentAndRemovedFlows() {
    for (let flow of Object.values(this.globallyResidentAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyRemovedAnimated)) {
      yield flow; 
    }
  },

  *allAnimatedMovedResidentFlows() {
    for (let flow of Object.values(this.globallyResidentAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
  },

  *allAnimatedMovedAddedAndRemovedFlows() {
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyAddedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyRemovedAnimated)) {
      yield flow; 
    }
  },
};


/**
 * Flow changes, to keep track of animation frames. 
 */
export const previousFlowChanges = {}
window.flowChanges = flowChanges;
let counter = 0;

export const changeType = {
  resident: 0, 
  added: 1, 
  removed: 2,
  moved: 3
}


/**
 * On finish building flow
 */
export function onFinishReBuildingFlow() {
  
  counter++
  logAnimationFrame()
  logAnimationSeparator("---------------------------------------- Flow rebuilt, DOM untouched, calculate changes... ----------------------------------------")
  console.groupCollapsed("...");
  // log(counter);
  // if (counter === 5) return; 

  // Save previous state for comparison
  Object.assign(previousFlowChanges, flowChanges);
  
  // Reset current state
  flowChanges.number++;
  flowChanges.idPrimitiveMap = {};
  flowChanges.idParentIdMap = {};
  flowChanges.globallyAdded = {}; 
  flowChanges.globallyResident = {}; 
  flowChanges.globallyMoved = {};
  flowChanges.globallyRemoved = {};

  const idPrimitiveMap = flowChanges.idPrimitiveMap;
  const idParentIdMap = flowChanges.idParentIdMap;

  function analyzePrimitives(idPrimitiveMap, primitiveFlow) {
    idPrimitiveMap[primitiveFlow.id] = primitiveFlow;
    idParentIdMap[primitiveFlow.id] = primitiveFlow.parentPrimitive;
  
    for (let child of primitiveFlow.iteratePrimitiveChildren()) {
      analyzePrimitives(idPrimitiveMap, child);
    }
  }
  
  for (let target of domFlowTargets) {
    analyzePrimitives(idPrimitiveMap, target.flow.getPrimitive());
  }

  // Added, resident or moved 
  for (let id in idPrimitiveMap) {
    const primitive = idPrimitiveMap[id];
    const inPreviousMap = previousFlowChanges ? !!previousFlowChanges.idPrimitiveMap[id] : false;
    if (inPreviousMap) {
      // In last map, resident or moved        
      if (!previousFlowChanges.idParentIdMap || (previousFlowChanges.idParentIdMap[id] === idParentIdMap[id])) {
        // Same parent, resident
        flowChanges.globallyResident[id] = primitive;
      } else {
        // Moved
        flowChanges.globallyMoved[id] = primitive;
      }
    } else {
      // Globally added
      flowChanges.globallyAdded[id] = primitive;
    }
  }

  // Find removed nodes
  for (let id in previousFlowChanges.idPrimitiveMap) {
    const inPreviousMap = previousFlowChanges.idPrimitiveMap[id];
    if (typeof(idPrimitiveMap[id]) === "undefined" && !inPreviousMap.parentPrimitive) { // Consider: Keep track of directly removed using inPreviousMap.parentPrimitive? 
      flowChanges.globallyRemoved[id] = inPreviousMap;
    }
  }

  function filterAnimatedInMap(map) {
     return Object.values(map)
      .reduce((result, flow) => {
        const changes = flow.getAnimation();
        flow.currentAnimation = changes; 
        if (changes) {
          result[flow.id] = flow;
        }
        return result;
      }, {});
  }

  flowChanges.globallyAddedAnimated = filterAnimatedInMap(flowChanges.globallyAdded);
  flowChanges.globallyResidentAnimated = filterAnimatedInMap(flowChanges.globallyResident);
  flowChanges.globallyMovedAnimated = filterAnimatedInMap(flowChanges.globallyMoved);
  flowChanges.globallyRemovedAnimated = filterAnimatedInMap(flowChanges.globallyRemoved);

  function toStrings(changes) {
    return {
      addedWithoutAnimation: Object.values(changes.globallyAdded).map(flow => flow.toString()),
      added: Object.values(changes.globallyAddedAnimated).map(flow => flow.toString()),
      resident: Object.values(changes.globallyResidentAnimated).map(flow => flow.toString()), 
      moved: Object.values(changes.globallyMovedAnimated).map(flow => flow.toString()),
      removed: Object.values(changes.globallyRemovedAnimated).map(flow => flow.toString()),
    }
  }

  // Mark each flow / node with changes and chained changes sequences for analysis. 
  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.getDomNode()) {
      const changes = {
        number: flowChanges.number,
        type: changeType.resident,
        previous: flow.changes,
        transitioningProperties: (flow.changes && flow.changes.transitioningProperties) ? flow.changes.transitioningProperties : {} 
      };
      flow.changes = changes; 
      flow.domNode.changes = changes; 
    }
  }

  // Mark all animated. 
  for (let flow of flowChanges.allAnimatedMovedFlows()) {
    if (flow.domNode) {
      flow.domNode.changes.type = changeType.moved;
    }
  }
  for (let flow of flowChanges.allAnimatedAddedFlows()) {
    if (flow.getDomNode()) {
      flow.domNode.changes.type = changeType.added; 
    }
  }
  for (let flow of flowChanges.allAnimatedRemovedFlows()) {
    if (flow.domNode) {
      flow.domNode.changes.type = changeType.removed;
      flow.domNode.targetDimensions = {width: flow.domNode.offsetWidth, height: flow.domNode.offsetHeight } 
      flowChanges.beingRemovedMap[flow.id] = flow;    
    }
  }
  console.groupEnd();
  console.log("New animated changes:");
  log(toStrings(flowChanges));

  logAnimationSeparator("---------------------------------------- Measure original bounds... ----------------------------------------");
  

  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.getDomNode()) {
      flow.animation.recordOriginalBoundsAndStyle(flow);
    }
  }
  
  logAnimationSeparator("---------------------------------------- Prepare for DOM building... ----------------------------------------");

  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.domNode) {
      flow.animation.prepareForDOMBuilding(flow)
    }
  }
  
  logAnimationSeparator("---------------------------------------- Rebuilding DOM... ----------------------------------------")
  console.groupCollapsed("...");
  flowChanges.onFinishReBuildingFlowDone = true;
}

/**
 * Between these two functions the DOM is rebuilt with new structure and styling. 
 * 
 * Consider: Block style changes for transform for nodes in an animation?
 */

export function onFinishReBuildingDOM() {

  counter++
  if (!flowChanges.onFinishReBuildingFlowDone) return;
  delete flowChanges.onFinishReBuildingFlowDone;

  console.groupEnd();
  logAnimationSeparator("---------------------------------------- DOM rebuilt, measure target sizes ... ----------------------------------------");
  
  // Measure the final size of added and moved (do this before we start to emulate original)
  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.domNode) {
      flow.animation.domJustRebuiltMeasureTargetSizes(flow);
    }
  }

  logAnimationSeparator("---------------------------------------- Emulate original bounds and sizes for FLIP animations ----------------------------------------");

  // Emulate original footprints. 
  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.domNode) {
      flow.animation.targetSizesAquiredEmulateOriginalFootprints(flow);
    }
  }

  // Emulate original and prepare for animation.
  
  inflateTrailersAndPrepareMoved();

  // We now have original style/size, but new structure. 

  // Do the FLIP animation technique
  // Note: This will not happen for flows being removed (in earlier flowChanges.number). Should we include those here as well?
  recordBoundsInNewStructure();
  translateToOriginalBoundsIfNeeded(); // Note: Might move resident animated flows also because of rearrangements.
  
  //setMaxWidthHeightScale for removed.

  // Resident might need too.
  activateAnimationAfterFirstRender({...flowChanges});  

  // logAnimationSeparator("---------------------------------------- Waiting for first render...  ----------------------------------------");
}




function inflateTrailersAndPrepareMoved() {
  for (let flow of flowChanges.allAnimatedMovedFlows()) {
    if (flow.domNode) {
      flow.animation.inflateFadingTrailer(flow.domNode);
      flow.animation.minimizeIncomingFootprint(flow.domNode);
    }
  }
}

function recordBoundsInNewStructure() {
  // force Reflow().
  for (let flow of flowChanges.allAnimatedFlows()) {
    flow.animation.recordBoundsInNewStructure(flow.domNode);
  }
}

function translateToOriginalBoundsIfNeeded() {

  // TODO: Translate parents first in case of cascading moves? 

  // Translate present flows to original position
  for (let flow of flowChanges.allAnimatedMovedResidentFlows()) {

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
        flow.animation.recordBoundsInNewStructure(flow.domNode);

        // Mark in new animation
        flow.domNode.changes.number = flowChanges.number; 
        flow.domNode.changes.type = changeType.resident;
      }

      flow.animateInChanges = flowChanges.number; 
      flow.animation.translateFromNewToOriginalPosition(flow.domNode);

      // Reflow
      flow.domNode.getBoundingClientRect();
    }

    // log("ORIGINAL RESIDENT");
    // logProperties(flow.domNode.style, typicalAnimatedProperties);
  }
}


function activateAnimationAfterFirstRender(currentFlowChanges) {
  // log("activateAnimation");
  // return;
  // debugger;
  // log(currentFlowChanges.number);
  requestAnimationFrame(() => {
    logAnimationSeparator("---------------------------------------- Rendered first frame, activate animations...  ----------------------------------------");

    // if (currentFlowChanges.number !== flowChanges.number) {
    //   throw new Error("A change triggered while animation not started, consider removing event listeners using pointerEvents:none or similar");
    //   // TODO: Support the possibility of animation flow changes between animation start and animation activation somehow. 
    // }

    // log("activate");
    // log(currentFlowChanges.number);
    for (let flow of currentFlowChanges.allAnimatedAddedFlows()) {
      console.group("activate for added " + flow.toString());
      log(`original properties: `);
      logProperties(flow.domNode.wrapper.style, typicalAnimatedProperties);
      // log(flow.domNode.parentNode);
      flow.animation.setupFinalStyleForAdded(flow.domNode);
      log(`final properties: `);
      logProperties(flow.domNode.wrapper.style, typicalAnimatedProperties);
      // log(flow.domNode.parentNode);
      setupAnimationCleanup(flow.domNode, flow.domNode.changes);
      delete currentFlowChanges.beingRemovedMap[flow.id];  
      console.groupEnd();
    }

    for (let flow of currentFlowChanges.allAnimatedResidentFlows()) {
      if (flow.animateInChanges === currentFlowChanges.number) {
        flow.animation.setupFinalStyleForResident(flow.domNode);
        flow.synchronizeDomNodeStyle(animatedProperties);
        log(`... resident node ${flow.toString()}, final properties: `);
        logProperties(flow.domNode.style, typicalAnimatedProperties);
        setupAnimationCleanup(flow.domNode, flow.domNode.changes);
        delete currentFlowChanges.beingRemovedMap[flow.id];
      } else {
        // This will cancel cleanup for a removed flow becoming resident... 
        // flow.domNode.changes = null; 
        // flow.changes = null;
      }
    }

    for (let flow of currentFlowChanges.allAnimatedMovedFlows()) {
      if (flow.animateInChanges === currentFlowChanges.number) {
        // log("ACTIVATE");
        // logProperties(flow.domNode.style, typicalAnimatedProperties);
        // log(flow.domNode)
        // log(flow.domNode.style.transition);
        // log(flow.domNode.style.transform);
        flow.animation.setupFinalStyleForMoved(flow.domNode);
        // log(flow.domNode.style.transition);
        // log(flow.domNode.style.transform);
        flow.synchronizeDomNodeStyle(animatedProperties);
        // log(flow.domNode.style.transform);
        // log(`... moving node ${flow.toString()}, final properties: `);
        // logProperties(flow.domNode.style, typicalAnimatedProperties);
        setupAnimationCleanup(flow.domNode, flow.domNode.changes);
        // log(flow.domNode.style.transform);

        delete currentFlowChanges.beingRemovedMap[flow.id];
      } else {
        // flow.domNode.changes = null; 
        // flow.changes = null;
      }
    }
    
    for (let flow of currentFlowChanges.allAnimatedRemovedFlows()) {
      console.group("activate removal " + flow.toString());
      log(`original properties: `);
      const foo = flow.domNode.getBoundingClientRect();
      logProperties(flow.domNode.style, typicalAnimatedProperties);
      // log("Chained animation?");
      // log(flow.changes.previous);
      flow.animation.setupFinalStyleForRemoved(flow.domNode);
      log(`final properties: `);
      logProperties(flow.domNode.style, typicalAnimatedProperties);
      setupAnimationCleanup(flow.domNode, flow.domNode.changes);
      console.groupEnd();
    }


    // setTimeout(() => {
      // log(currentFlowChanges)
      for (let flow of currentFlowChanges.allAddedFlows()) {
        // log(flow);
        let scan = flow; 
        while(scan) {
          // log(scan);
          scan.onDidDisplayFirstFrame();
          scan = scan.equivalentCreator;
        } 
        // Consider: Can we really do this here without messing up the flow changes -> dom changes cycle? 
        // Maybe we have to wait until after we finish the animation starting? 
      }
    // }, 0)
    logAnimationSeparator("--------------------------------------------------------------------------------");
    console.groupEnd()
  });
}

function setupFadingTrailerCleanup(node) {
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

function setupWrapperCleanup(wrapper) {
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

function setupAnimationCleanup(node) {
  log("setupAnimationCleanup");
  log(node);
  // return; 
  if (node.wrapper) {
    log("wrapper")
    setupWrapperCleanup(node.wrapper)
  }
  if (node.fadingTrailer) {
    log("trailer")
    setupFadingTrailerCleanup(node.fadingTrailer)
  }
  // return; 
  // There can be only one
  if (node.hasCleanupEventListener) return; 
  
  // On cleanup, synchronize transitioned style property
  const me = this; 
  // log("setupAnimationCleanup: " + inAnimationType + " " + frameNumber);
  // log(node)

  function onTransitionEnd(event) {
    if (!node.changes) return;

    // event.preventDefault();
    // event.stopPropagation();
    
    // if (changes === node.changes) {
    const propertyName = camelCase(event.propertyName); 

    console.group("cleanup: " + node.changes.type + " from changes number " + node.changes.number);
    log(node);
    log(event.target);
    log(event.propertyName);
    log(camelCase(event.propertyName));
    console.groupEnd();

    // Synch properties that was transitioned. 
    node.equivalentCreator.synchronizeDomNodeStyle([propertyName, "transition", "transform", "width", "height"]);

      // function findRemoved(changes) {
      //   while (changes) {
      //     if (changes.type === changeType.removed) {
      //       return true; 
      //     }
      //     changes = changes.previous; 
      //   }
      //   return false; 
      // }

      
      // Remove changes.
      if (node.changes) {
        node.changes.finished = true; 
        const flow = node.equivalentCreator;
        flow.changes = null;
        node.changes = null;
      }

      // Finish animation
      // node.removeEventListener("transitionend", onTransitionEnd);
      // delete node.hasCleanupEventListener;
      // Note: removeEventListener will remove it from multiple divs????
    // }
      
    // }
  }
  node.addEventListener("transitionend", onTransitionEnd);
  node.hasCleanupEventListener = onTransitionEnd; 
}

/**
 * Diff analysis
 */
     // Transition all except globallyRemoved to new position by removing translation
      // Minimize globallyRemoved by adding scale = 0 transform and at the same time removing the translation
 
// export function analyzeAddedRemovedResident(oldIdMap, newIdMap) {
//   const removed = [];
//   const added = [];
//   const present = [];
//   for(let id in oldIdMap) {
//     if (typeof(newIdMap[id]) === "undefined") {
//       removed.push(oldIdMap[id]);
//     } else {
//       present.push(oldIdMap[id]);
//     }
//   }
//   for(let id in newIdMap) {
//     if (typeof(oldIdMap[id]) === "undefined") {
//       added.push(newIdMap[id]);
//     }
//   }
//   return {removed, added, present};
// }

function sameBounds(b1, b2) {
  // log("sameBounds");
  // log(b1);
  // log(b2)
  return (
      b1.top === b2.top &&
      b1.left === b2.left &&
      b1.width === b2.width &&
      b1.height === b2.height
  );
}


/**
 * Animation research
 */

// Consider: Could parseMatrix be used to catch divs mid air and continue with another animation?  

function parseMatrix(matrix) {
  function extractScaleTranslate(matrix) {
    return {
    scaleX: matrix[0],
    scaleY: matrix[3],
    translateX: matrix[4],
    translateY: matrix[5],
    }
  }

  let matrixPattern = /^\w*\((-?((\d+)|(\d*\.\d+)),\s*)*(-?(\d+)|(\d*\.\d+))\)/i
  if (matrixPattern.test(matrix)) {
    let matrixCopy = matrix.replace(/^\w*\(/, '').replace(')', '');
    // console.log(matrixCopy);
    let matrixValue = matrixCopy.split(/\s*,\s*/).map(value => parseFloat(value));
    // log(matrixValue);
    return extractScaleTranslate(matrixValue);
  }
  return extractScaleTranslate([1, 0, 0, 1, 0, 0]);
}

// Possibly transform bounds? 
// const transform = parseMatrix(computedStyle.transform); 
// log(transform);
// result[node.equivalentCreator.causality.id] = {
//   top: bounds.top, //+ transform.translateY, 
//   left: bounds.left,// + transform.translateX, 
//   width: bounds.width,// * transform.scaleX, 
//   height: bounds.height,// * transform.scaleY
// };

        
// Stop ongoing animation!
// node.style.transition = "";
// const computedStyle = getComputedStyle(node);
// // Object.assign(node.style, computedStyle);
// if (computedStyle.transform !== "") {
//   node.style.transform = computedStyle.transform; 
// }


// let nextOriginMark = 0;


var camelCase = (function () {
  var DEFAULT_REGEX = /[-_]+(.)?/g;

  function toUpper(match, group1) {
      return group1 ? group1.toUpperCase() : '';
  }
  return function (str, delimiters) {
      return str.replace(delimiters ? new RegExp('[' + delimiters + ']+(.)?', 'g') : DEFAULT_REGEX, toUpper);
  };
})();

// function findAndRecordOriginalBoundsOfOrigin(flow) {
//   const originMark = nextOriginMark++;
      
//   // Scan and mark old dom structure
//   let scan = flow.domNode.parentNode; 
//   if (!scan) {
//     console.log(flow);
//     console.log(flow.domNode);
//     console.log(scan);
//     throw new Error("Did not expect an animated without a parent!")
//   } 
//   while (scan) {
//     scan.originMark = originMark;
//     scan = scan.parentNode;
//   }
  
//   // Scan new flow structure and find common ancestor for present flow
//   scan = flow.parentPrimitive;
//   while (scan) {
//     if (scan.domNode && scan.domNode.originMark === originMark) {
//       flow.domNode.animationOriginNode = scan.domNode;
//       break;
//     }
//     scan = scan.parentPrimitive;
//   }
  
// standardAnimation.recordOriginalBoundsAndStyle(flow.domNode.animationOriginNode);  
// }


export function getHeightIncludingMargin(node) {
  var styles = window.getComputedStyle(node);
  var margin = parseFloat(styles['marginTop']) +
               parseFloat(styles['marginBottom']);

  return Math.ceil(node.offsetHeight + margin);
}

export function getWidthIncludingMargin(node) {
  var styles = window.getComputedStyle(node);
  var margin = parseFloat(styles['marginLeft']) +
               parseFloat(styles['marginRight']);
  return Math.ceil(node.offsetWidth + margin);
}


// function getHeightIncludingMargin(node) {
//   var styles = window.getComputedStyle(node);
//   var margin = parseFloat(styles['marginTop']) +
//                parseFloat(styles['marginBottom']);

//   return Math.ceil(node.offsetHeight + margin);
// }

const animatedProperties = [
  // "transform",
  // "maxHeight",
  // "maxWidth",
  {compound: "margin", partial: ["marginBottom", "marginBottom", "marginLeft", "marginRight"]},
  {compound: "padding", partial: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]},
  "opacity",
  "color", 
  "fontSize",
];