import { repeat, Flow, trace, configuration, flow, activeTrace, creators } from "../flow/Flow";
import { DOMFlipAnimation, standardAnimation } from "./DOMFlipAnimation";

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

const typicalAnimatedProperties = [
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

function logProperties(object, properties) {
  log(extractProperties(object, properties));
}

function extractProperties(object, properties) {
  const condensed = {};
  properties.forEach(property => {
    if (typeof(property) !== "string") {
      property.partial.forEach(part => {
        condensed[part] = object[part]   
      });
    } else {
      condensed[property] = object[property];
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

  *allAnimatedFlowsAlreadyPresent() {
    for (let flow of Object.values(this.globallyRemovedAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyResidentAnimated)) {
      yield flow; 
    }
    for (let flow of Object.values(this.globallyMovedAnimated)) {
      yield flow; 
    }
  }
};

export const previousFlowChanges = {}

window.flowChanges = flowChanges;

let counter = 0;

export function onFinishReBuildingFlow() {
  
  counter++
  console.group("---------------------------------------- onFinishBuildingFlow ----------------------------------------");
  log(counter);
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
      if (flowChanges.beingRemovedMap[id]) {
        // Move or resident
        flowChanges.beingRemovedMap[id]
        const previousParentFlow = primitive.domNode.parentNode.equivalentCreator;
        if (flowChanges.idParentIdMap[primitive.id] === previousParentFlow.id) {
          // Same parent, resident
          flowChanges.globallyResident[id] = primitive;
        } else {
          // Moved
          flowChanges.globallyMoved[id] = primitive;
        }
      } else {
        // A true addition
        flowChanges.globallyAdded[id] = primitive;
      }
    }
  }

  // Find removed nodes
  for (let id in previousFlowChanges.idPrimitiveMap) {
    const inPreviousMap = previousFlowChanges.idPrimitiveMap[id];
    if (typeof(idPrimitiveMap[id]) === "undefined" && !inPreviousMap.parentPrimitive.getChildNodes().includes(inPreviousMap.domNode)) {
      flowChanges.globallyRemoved[id] = inPreviousMap; 
      flowChanges.beingRemovedMap[id] = inPreviousMap;
    }
  }

  function filterAnimatedInMap(map) {
     return Object.values(map)
      .reduce((result, flow) => {
        const animation = flow.getAnimation();
        flow.currentAnimation = animation; 
        if (animation) {
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
      added: Object.values(changes.globallyAddedAnimated).map(flow => flow.toString()),
      resident: Object.values(changes.globallyResidentAnimated).map(flow => flow.toString()), 
      moved: Object.values(changes.globallyMovedAnimated).map(flow => flow.toString()),
      removed: Object.values(changes.globallyRemovedAnimated).map(flow => flow.toString()),
    }
  }
  console.group("New animated changes:");
  log(toStrings(flowChanges));
  console.groupEnd();

  // Record original bounds
  for (let flow of flowChanges.allAnimatedFlows()) {
    if (flow.domNode) {
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      // findAndRecordOriginalBoundsOfOrigin(flow); // Dont, for now!
    }
  }
  if(window.allFlows[11] && window.allFlows[11].domNode) log(window.allFlows[11].domNode.style.transform);
  console.groupEnd();
  flowChanges.onFinishReBuildingFlowDone = true;
  if(window.allFlows[11] && window.allFlows[11].domNode) log(window.allFlows[11].domNode.style.transform);
}

/**
 * Between these two functions the following takes place: 
 * 
 * DOM nodes are being restructured, with regards to parent/child relationships
 * For animated nodes their style is not changed. 
 * Added nodes have their final size measured, and they are then minimized. 
 * Moved nodes have their style frozen to avoid sudden and  non-animated style changes. 
 * Remove previous transformations/translations. 
*/

export function onFinishReBuildingDOM() {

  counter++
  if (!flowChanges.onFinishReBuildingFlowDone) return;
  console.group("---------------------------------------- onFinishBuildingDOM ----------------------------------------");
  log(counter);
  if(window.allFlows[11] && window.allFlows[11].domNode) {
    log(window.allFlows[11].domNode)
    log(window.allFlows[11].domNode.style.transform);
  } 
  delete flowChanges.onFinishReBuildingFlowDone; 
  if(window.allFlows[11] && window.allFlows[11].domNode) log(window.allFlows[11].domNode.style.transform);
  
  let {globallyRemovedAnimated, globallyAddedAnimated, globallyResidentAnimated, globallyMovedAnimated} = flowChanges
  
  // Record bounds in new structure    
    for (let flow of flowChanges.allAnimatedFlowsAlreadyPresent()) {
    flow.animation.recordBoundsInNewStructure(flow.domNode);
  }

    // Examine added, measure their size etc.
  // At this stage, remember target dimensions and style.    
  for (let flow of flowChanges.allAnimatedAddedFlows()) {
    log("ANALYZE ADDED")
    log(flow.domNode.style.maxWidth);
    flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
    flow.domNode.style.maxWidth = "";
    flow.domNode.style.maxHeight = "";
    log(flow.domNode.style.maxWidth);
    flow.animation.calculateTargetDimensionsAndStyleForAdded(flow.parentPrimitive.domNode, flow.domNode);
    log("target style and dimensions")
    log(flow.domNode.targetStyle);
    log(flow.domNode.targetDimensions);
    flow.animation.setOriginalMinimizedStyleForAdded(flow.domNode);
    logProperties(flow.domNode.style, typicalAnimatedProperties);

  }

  // Translate present flows to original position
  for (let flow of flowChanges.allAnimatedFlowsAlreadyPresent()) {
    // if (!flow.originalBounds) log(flow);
    // if (!flow.newStructureBounds) log(flow);

    if (true || !sameBounds(flow.domNode.originalBounds, flow.domNode.newStructureBounds)) {
      log("ASDFASEF")
      log(flow.domNode.style.transform)
      
      const computedStyle = getComputedStyle(flow.domNode);
      let currentTransform = getComputedStyle(flow.domNode).transform;
      
      log(currentTransform)
      log(typeof flow.domNode.style.transform)
      if (!["none", "", " "].includes(currentTransform)) {
        // Freeze properties as we start a new animation.
        Object.assign(flow.domNode.style, extractProperties(computedStyle, flow.animation.animatedProperties));

        // Reset transform 
        flow.domNode.style.transition = "";
        flow.domNode.style.transform = "";
        currentTransform = computedStyle.transform;
        currentTransform = getComputedStyle(flow.domNode).transform;
        log(currentTransform);
        flow.animation.recordBoundsInNewStructure(flow.domNode);
      }

      flow.animateInChanges = flowChanges.number; 
      flow.animation.translateFromNewToOriginalPosition(flow.domNode);
    }
  }
      
  // Activate animation
  requestAnimationFrame(() => {
    for (let flow of flowChanges.allAnimatedAddedFlows()) {
      log("SETTING FINAL")
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties); // needed?
      flow.animation.setupFinalStyleForAdded(flow.domNode);
      logProperties(flow.domNode.style, typicalAnimatedProperties);

      // flow.animation.setupAddedAnimationCleanup(flow.domNode);
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


    for (let flow of flowChanges.allAnimatedResidentFlows()) {
      if (flow.animateInChanges === flowChanges.number) {
        flow.animation.setupFinalStyleForResident(flow.domNode);
        flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
        flow.animation.setupResidentAnimationCleanup(flow.domNode);
      }
    }

    for (let flow of flowChanges.allAnimatedMovedFlows()) {
      if (flow.animateInChanges === flowChanges.number) {
        flow.animation.setupFinalStyleForMoved(flow.domNode);
        flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
        flow.animation.setupResidentAnimationCleanup(flow.domNode);
      }
    }

    for (let flow of flowChanges.allAnimatedRemovedFlows()) {
      flow.animation.setupFinalStyleForRemoved(flow.domNode);
      flow.animation.setupRemovedAnimationCleanup(flow.domNode);
    }
   });
  console.groupEnd();
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
  
//   standardAnimation.recordOriginalBoundsAndStyle(flow.domNode.animationOriginNode);  
// }
