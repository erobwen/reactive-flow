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
      // if (flowChanges.beingRemovedMap[id]) {
      //   // Move or resident
      //   flowChanges.beingRemovedMap[id]
      //   const previousParentFlow = primitive.domNode.parentNode ? primitive.domNode.parentNode.equivalentCreator : null;
      //   if (previousParentFlow && flowChanges.idParentIdMap[primitive.id] === previousParentFlow.id) {
      //     // Same parent, resident
      //     flowChanges.globallyResident[id] = primitive;
      //   } else {
      //     // Moved
      //     flowChanges.globallyMoved[id] = primitive;
      //   }
      // } else {
        // A true addition
        flowChanges.globallyAdded[id] = primitive;
      // }
    }
  }

  // Find removed nodes
  for (let id in previousFlowChanges.idPrimitiveMap) {
    const inPreviousMap = previousFlowChanges.idPrimitiveMap[id];
    if (typeof(idPrimitiveMap[id]) === "undefined" && !inPreviousMap.parentPrimitive.getChildNodes().includes(inPreviousMap.domNode)) {
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
    if (flow.getDomNode()) {
      const changes = {
        number: flowChanges.number,
        type: "resident",
        previous: flow.changes
      };
      flow.changes = changes; 
      flow.domNode.changes = changes; 
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
    }
  }

  // Mark all animated. 
  for (let flow of flowChanges.allAnimatedMovedFlows()) {
    if (flow.domNode) {
      flow.domNode.changes.type = "moved";
    }
  }
  for (let flow of flowChanges.allAnimatedAddedFlows()) {
    if (flow.getDomNode()) {
      flow.domNode.changes.type = "added"; 
    }
  }
  for (let flow of flowChanges.allAnimatedRemovedFlows()) {
    if (flow.domNode) {
      flow.domNode.changes.type = "removed"; 

      // flow.animation.recordTargetStyleForAdded(flow.domNode); // PORTAL  
      flow.domNode.targetDimensions = {width: flow.domNode.offsetWidth, height: flow.domNode.offsetHeight } 
      flowChanges.beingRemovedMap[flow.id] = flow;    
    }
  }

  console.groupEnd();
  flowChanges.onFinishReBuildingFlowDone = true;
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
  delete flowChanges.onFinishReBuildingFlowDone; 
    
  prepareAnimationStart();
  requestAnimationFrame(() => {
    activateAnimation();  
  });

  console.groupEnd();
}


function prepareAnimationStart() {
  
  // Record bounds in new structure    
  for (let flow of flowChanges.allAnimatedFlows()) {
    flow.animation.recordBoundsInNewStructure(flow.domNode);
  }

  // Examine added, measure their size etc.
  // At this stage, remember target dimensions and style.    
  for (let flow of flowChanges.allAnimatedAddedFlows()) {
    // log({... flowChanges.beingRemovedMap})
    if (!flowChanges.beingRemovedMap[flow.id]) {
      // Measure added final style in an emulated world. PORTAL 
      // console.group("start measure added");
      // log(flow.domNode)
      // log(flow.domNode.changes.number);
      // log(flow.domNode.changes.type);
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
      flow.domNode.style.maxWidth = "";
      flow.domNode.style.maxHeight = "";
      flow.animation.calculateTargetDimensionsAndStyleForAdded(flow.parentPrimitive.domNode, flow.domNode);
      flow.animation.setOriginalMinimizedStyleForAdded(flow.domNode);
      // log(flow.toString() + " is added and minimized again...");
      // logProperties(flow.domNode.style, typicalAnimatedProperties);
      console.groupEnd();
    } else {
      // We already recorded desired height upon removal. Note, this might be wrong if the div animated while 
      // Being removed. This can perhaps be improved in the future to do a new proper measurement.
      log(flow.toString() + " is added after being removed...");
      logProperties(flow.domNode.style, typicalAnimatedProperties);
    }    
    // Reflow
    flow.domNode.getBoundingClientRect();
  }

  // Translate present flows to original position
  for (let flow of flowChanges.allAnimatedMovedResidentFlows()) {

    if (!sameBounds(flow.domNode.originalBounds, flow.domNode.newStructureBounds)) {
      log("Not same bounds for " + flow.toString());     
      const computedStyle = getComputedStyle(flow.domNode);
      let currentTransform = getComputedStyle(flow.domNode).transform;
      
      // This is for resident that have a transform already. In an animation already.
      if (!["none", "", " "].includes(currentTransform)) {
        log("Already have transform for " + flow.toString());     
        // Freeze properties as we start a new animation.
        Object.assign(flow.domNode.style, extractProperties(computedStyle, flow.animation.animatedProperties));

        // Reset transform 
        flow.domNode.style.transition = "";
        flow.domNode.style.transform = "";
        currentTransform = getComputedStyle(flow.domNode).transform;
        flow.animation.recordBoundsInNewStructure(flow.domNode);

        // Mark in new animation
        flow.domNode.changes.number = flowChanges.number; 
        flow.domNode.changes.type = "resident";
      }

      flow.animateInChanges = flowChanges.number; 
      flow.animation.translateFromNewToOriginalPosition(flow.domNode);

      // Reflow
      flow.domNode.getBoundingClientRect();
    }

    // log("ORIGINAL RESIDENT");
    // logProperties(flow.domNode.style, typicalAnimatedProperties);
  }

  for (let flow of flowChanges.allAnimatedRemovedFlows()) {
    flow.domNode.getBoundingClientRect();
    // Re transform if moved by structure. 
    // if (!sameBounds(flow.domNode.originalBounds, flow.domNode.newStructureBounds)) {
    //   log("Not same bounds for " + flow.toString());     
    //   const computedStyle = getComputedStyle(flow.domNode);
    //   let currentTransform = getComputedStyle(flow.domNode).transform;
      
    //   // This is for resident that have a transform already. In an animation already.
    //   if (!["none", "", " "].includes(currentTransform)) {
    //     log("Already have transform for " + flow.toString());     
    //     // Freeze properties as we start a new animation.
    //     Object.assign(flow.domNode.style, extractProperties(computedStyle, flow.animation.animatedProperties));

    //     // Reset transform  (Note: This will not work if we are being added with transfrom, and then shift position at the same time. )
    //     // Here we should preserve some of the original transformation scale to deal with both. 
    //     flow.domNode.style.transition = "";
    //     flow.domNode.style.transform = "";
    //     currentTransform = getComputedStyle(flow.domNode).transform;
    //     flow.animation.recordBoundsInNewStructure(flow.domNode);
    //   }

    //   flow.animateInChanges = flowChanges.number; 
    //   flow.animation.translateFromNewToOriginalPosition(flow.domNode);

    //   // Reflow
    //   flow.domNode.getBoundingClientRect();
    // }

    // Preserve before remove
    flow.animation.preserveStyleForMoved(flow.domNode);

    // Set scale and max bounds for animation. 
    if (!flow.domNode.style.maxHeight || flow.domNode.style.maxHeight === "none") {
      flow.domNode.style.maxHeight = flow.domNode.originalBounds.height + "px";  
    }
    if (!flow.domNode.style.maxWidth  || flow.domNode.style.maxWidth === "none") {
      flow.domNode.style.maxWidth = flow.domNode.originalBounds.width + "px";
    }
    if (!flow.domNode.style.transform || flow.domNode.style.transform === "none") {
      flow.domNode.style.transform = "scale(1)"; 
    }
    // Reflow
    flow.domNode.getBoundingClientRect();
  }
}


function activateAnimation() {
  for (let flow of flowChanges.allAnimatedAddedFlows()) {
    console.group("activate for added " + flow.toString());
    log(`original properties: `);
    logProperties(flow.domNode.style, typicalAnimatedProperties);
    flow.animation.setupFinalStyleForAdded(flow.domNode, flow.getAnimatedFinishStyles());
    log(`final properties: `);
    logProperties(flow.domNode.style, typicalAnimatedProperties);
    flow.animation.setupAddedAnimationCleanup(flow.domNode);
    delete flowChanges.beingRemovedMap[flow.id];  
    console.groupEnd();
  }

  for (let flow of flowChanges.allAnimatedResidentFlows()) {
    if (flow.animateInChanges === flowChanges.number) {
      flow.animation.setupFinalStyleForResident(flow.domNode);
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
      log(`... resident node ${flow.toString()}, final properties: `);
      logProperties(flow.domNode.style, typicalAnimatedProperties);
      flow.animation.setupResidentAnimationCleanup(flow.domNode);
      delete flowChanges.beingRemovedMap[flow.id];
    }
  }

  for (let flow of flowChanges.allAnimatedMovedFlows()) {
    if (flow.animateInChanges === flowChanges.number) {
      flow.animation.setupFinalStyleForMoved(flow.domNode);
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
      log(`... moving node ${flow.toString()}, final properties: `);
      logProperties(flow.domNode.style, typicalAnimatedProperties);
      flow.animation.setupResidentAnimationCleanup(flow.domNode);
      delete flowChanges.beingRemovedMap[flow.id];
    }
  }
  
  for (let flow of flowChanges.allAnimatedRemovedFlows()) {
    console.group("activate removal " + flow.toString());
    log(`original properties: `);
    const foo = flow.domNode.getBoundingClientRect();
    logProperties(flow.domNode.style, typicalAnimatedProperties);
    flow.animation.setupFinalStyleForRemoved(flow.domNode);
    log(`final properties: `);
    logProperties(flow.domNode.style, typicalAnimatedProperties);
    flow.animation.setupRemovedAnimationCleanup(flow.domNode);
  }
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
