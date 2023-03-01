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

const domFlowTargets = [];

export function addDOMFlowTarget(target) {
  // debugger; 
  domFlowTargets.push(target)
}

export function removeDOMFlowTarget(target) {
  domFlowTargets.splice(domFlowTargets.indexOf(target), 1);
}


/**
 * Global flow changes tracking
 */

export const flowChanges = {
  globallyAdded: null,
  globallyRemoved: null,
  globallyResident: null
};
export const previousFlowChanges = {}

window.flowChanges = flowChanges;

let previousIdPrimitiveMap = null;
let idPrimitiveMap = {};
let previousIdParentIdMap = null;
let idParentIdMap = {};

let nextOriginMark = 0;

let nextcurrentFrameNumber = 1;
export let currentFrameNumber = null;

function findAndRecordOriginalBoundsOfOrigin(flow) {
  const originMark = nextOriginMark++;
      
  // Scan and mark old dom structure
  let scan = flow.domNode.parentNode; 
  if (!scan) {
    console.log(flow);
    console.log(flow.domNode);
    console.log(scan);
    throw new Error("Did not expect an animated without a parent!")
  } 
  while (scan) {
    scan.originMark = originMark;
    scan = scan.parentNode;
  }
  
  // Scan new flow structure and find common ancestor for present flow
  scan = flow.parentPrimitive;
  while (scan) {
    if (scan.domNode && scan.domNode.originMark === originMark) {
      flow.domNode.animationOriginNode = scan.domNode;
      break;
    }
    scan = scan.parentPrimitive;
  }
  
  standardAnimation.recordOriginalBoundsAndStyle(flow.domNode.animationOriginNode);  
}

export function onFinishReBuildingFlow() {
  console.group("---------------------------------------- onFinishBuildingFlow ----------------------------------------");
  currentFrameNumber = nextcurrentFrameNumber++;

  previousIdPrimitiveMap = idPrimitiveMap;
  idPrimitiveMap = {};
  previousIdParentIdMap = idParentIdMap 
  idParentIdMap = {};
  
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

  if (flowChanges.globallyAddedAnimated) {
    previousFlowChanges.globallyAddedAnimated = flowChanges.globallyAddedAnimated;
    previousFlowChanges.globallyRemovedAnimated = flowChanges.globallyRemovedAnimated;
    previousFlowChanges.globallyPresentAnimated = flowChanges.globallyPresentAnimated;
    previousFlowChanges.globallyResidentAnimated = flowChanges.globallyResidentAnimated;
    previousFlowChanges.globallyMovedAnimated = flowChanges.globallyMovedAnimated;
  }

  flowChanges.globallyAdded = {}; 
  flowChanges.globallyResident = {}; 
  flowChanges.globallyRemoved = {};

  for (let id in idPrimitiveMap) {
    const inPreviousMap = previousIdPrimitiveMap[id];
    if (typeof(inPreviousMap) !== "undefined") {
      // In last map
      flowChanges.globallyResident[id] = inPreviousMap; 
    } else if ((idPrimitiveMap[id].domNode && idPrimitiveMap[id].domNode.parentNode)) {
      // Not in last map, but has a parent node. Probably in a remove animation. 
      if (idParentIdMap[id].domNode === idPrimitiveMap[id].domNode.parentNode) {
        // Added where it was removed, treat it as added
        idPrimitiveMap[id].domNode.addADeletedNode = true; 
        flowChanges.globallyAdded[id] = idPrimitiveMap[id];
      } else {
        // Added somewhere else, treat it as a move. 
        flowChanges.globallyResident[id] = idPrimitiveMap[id];
      }
    } else {
      flowChanges.globallyAdded[id] = idPrimitiveMap[id];
    }
  }

  for (let id in previousIdPrimitiveMap) {
    const inPreviousMap = previousIdPrimitiveMap[id];
    if (typeof(idPrimitiveMap[id]) === "undefined" && !inPreviousMap.parentPrimitive.getChildNodes().includes(inPreviousMap.domNode)) {
      flowChanges.globallyRemoved[id] = inPreviousMap; 
    }
  }

  function getAnimatedFromMap(map) {
    return Object.values(map)
      .reduce((result, flow) => {
        const animation = flow.getAnimation();
        flow.currentAnimation = animation; 
        if (animation) {
          result.push(flow);
        }
        return result;
      }, []);
  }

  flowChanges.globallyAddedAnimated = getAnimatedFromMap(flowChanges.globallyAdded);
  flowChanges.globallyRemovedAnimated = getAnimatedFromMap(flowChanges.globallyRemoved);
  flowChanges.globallyPresentAnimated = getAnimatedFromMap(flowChanges.globallyResident);
  flowChanges.globallyMovedAnimated = flowChanges.globallyPresentAnimated.filter(flow => idParentIdMap[flow.id] !== previousIdParentIdMap[flow.id]);
  flowChanges.globallyResidentAnimated = flowChanges.globallyPresentAnimated.filter(flow => idParentIdMap[flow.id] === previousIdParentIdMap[flow.id]);


  function toStrings(changes) {
    return {
      added: changes.globallyAddedAnimated.map(flow => flow.toString()),
      removed: changes.globallyRemovedAnimated.map(flow => flow.toString()),
      // present: changes.globallyPresentAnimated.map(flow => flow.toString()),
      moved: changes.globallyMovedAnimated.map(flow => flow.toString()),
      resident: changes.globallyResidentAnimated.map(flow => flow.toString()) 
    }
  }
  console.group("New animation frame:");
  log(toStrings(flowChanges));
  console.groupEnd();

  if (previousFlowChanges.globallyAddedAnimated) {
    // log("CLEANUP")
    // debugger;
    // Cleanup possible animation artefacts, such as set styles (need to do a pass to avoid indirect influence over )
    for (let flow of previousFlowChanges.globallyAddedAnimated) {
      if (!flowChanges.globallyResidentAnimated.includes(flow)) {
        flow.animation.cleanupPossibleAnimation(flow.domNode);
      }
    }
    for (let flow of previousFlowChanges.globallyPresentAnimated) {
      if (!flowChanges.globallyResidentAnimated.includes(flow)) {
        flow.animation.cleanupPossibleAnimation(flow.domNode);
      }
    }
    for (let flow of previousFlowChanges.globallyRemovedAnimated) {
      flow.animation.cleanupPossibleAnimation(flow.domNode);
    }
  }

  // Debug info
  // flowChanges.a_globallyRemoved = Object.values(flowChanges.globallyRemoved).map(flow => flow.domNode);
  // flowChanges.a_added = flowChanges.globallyAddedAnimated.map(flow => flow.domNode);
  // flowChanges.a_removed = flowChanges.globallyRemovedAnimated.map(flow => flow.domNode);
  // flowChanges.a_present = flowChanges.globallyPresentAnimated.map(flow => flow.domNode);
 
  // log("flowChanges");
  // log(flowChanges);

  // Record original bounds
  for (let flow of flowChanges.globallyPresentAnimated) {
    if (flow.domNode) {
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      // findAndRecordOriginalBoundsOfOrigin(flow); // Dont, for now!
    }
  }
  
  // Record original bounds
  for (let flow of flowChanges.globallyRemovedAnimated) {
    if (flow.domNode) {
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      // findAndRecordOriginalBoundsOfOrigin(flow); // Dont, for now!
    }
  }

    // Record original bounds
  for (let flow of flowChanges.globallyAddedAnimated) {
    if (flow.domNode && flow.domNode.addADeletedNode) {
      // debugger;
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      // findAndRecordOriginalBoundsOfOrigin(flow); // Dont, for now!
    }
  }
  
  // On will unmount
  // for (let flow of Object.values(flowChanges.globallyRemoved)) {
  //   let scan = flow; 
  //   while(scan) {
  //     creators.push(scan);
  //     scan.onWillUnmount();
  //     creators.pop();
  //     scan = scan.equivalentCreator;
  //   } 
  // }

  // Set in animation
  for (let flow of flowChanges.globallyAddedAnimated) {
    if (flow.domNode) {
      flow.domNode.previousDisappearingExpander = flow.domNode.disappearingExpander;
      flow.domNode.disappearingExpander = null; 
      flow.domNode.inAnimation = currentFrameNumber; 
      flow.domNode.previousFlowAnimation = flow.domNode.flowAnimation; 
      flow.domNode.flowAnimation = "added";
    }
  }
  for (let flow of flowChanges.globallyResidentAnimated) {
    if (flow.domNode) {
      flow.domNode.inAnimation = currentFrameNumber; 
      flow.domNode.previousFlowAnimation = flow.domNode.flowAnimation;
      flow.domNode.flowAnimation = "resident";
    }
  }
  for (let flow of flowChanges.globallyMovedAnimated) {
    if (flow.domNode) {
      flow.domNode.previousDisappearingExpander = flow.domNode.disappearingExpander;
      flow.domNode.disappearingExpander = null; 
      flow.domNode.inAnimation = currentFrameNumber; 
      flow.domNode.previousFlowAnimation = flow.domNode.flowAnimation;
      flow.domNode.flowAnimation = "moved";
    }
  }
  for (let flow of flowChanges.globallyRemovedAnimated) {
    if (flow.domNode) {
      flow.domNode.previousDisappearingExpander = flow.domNode.disappearingExpander;
      flow.domNode.disappearingExpander = null; 
      flow.domNode.inAnimation = currentFrameNumber; 
      flow.domNode.previousFlowAnimation = flow.domNode.flowAnimation; 
      flow.domNode.flowAnimation = "removed";
    }
  }

  flowChanges.onFinishReBuildingFlowDone = true;
  console.groupEnd();
}


// Add dissapearing expanders. 


export function onFinishReBuildingDOM() {
  if (!flowChanges.onFinishReBuildingFlowDone) return;
  console.group("---------------------------------------- onFinishBuildingDOM ----------------------------------------");
  delete flowChanges.onFinishReBuildingFlowDone; 

  // Reset styles and remove halted styles! 
  if (previousFlowChanges.globallyAddedAnimated) {
    for (let flow of previousFlowChanges.globallyAddedAnimated) {
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
    }
    for (let flow of previousFlowChanges.globallyPresentAnimated) {
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
    }
    for (let flow of previousFlowChanges.globallyRemovedAnimated) {
      flow.synchronizeDomNodeStyle(flow.animation.animatedProperties);
    }
  }

  let {globallyRemovedAnimated, globallyAddedAnimated, globallyPresentAnimated, globallyMovedAnimated, globallyAdded} = flowChanges
  // log("flowChanges");
  // log(flowChanges);

  // On did mount
  // for (let flow of Object.values(globallyAdded)) {
  //   let scan = flow; 
  //   while(scan) {
  //     creators.push(scan);
  //     scan.onDidMount();
  //     creators.pop();
  //     scan = scan.equivalentCreator;
  //   } 
  // }
  
  requestAnimationFrame(() => {

    // We have to do this after dissapearing replacements have been created with the right size.
    if (previousFlowChanges.globallyAddedAnimated) {
      for (let flow of previousFlowChanges.globallyPresentAnimated) {
        flow.animation.undoMinimizeIncomingFootprint(flow.domNode);
      }
    }

    // Target styles
    for (let flow of globallyAddedAnimated) {
      flow.animation.rememberTargetStyle(flow.domNode);
      flow.animation.calculateTargetDimensionsForAdded(flow.parentPrimitive.domNode, flow.domNode);
    }
    for (let flow of globallyPresentAnimated) {
      flow.animation.rememberTargetStyle(flow.domNode);
    }
    for (let flow of globallyRemovedAnimated) {
      flow.animation.rememberTargetStyle(flow.domNode);
    }
    
    // Reinstate original style.
    for (let flow of globallyAddedAnimated) {
      flow.animation.reinstateOriginalStyleForAdded(flow.domNode);
    }
    for (let flow of globallyPresentAnimated) {
      flow.animation.reinstateOriginalStyleForResident(flow.domNode);
    }
    for (let flow of globallyMovedAnimated) {
      flow.animation.minimizeIncomingFootprint(flow.domNode);
    }
    for (let flow of globallyRemovedAnimated) {
      flow.animation.reinstateOriginalStyleForRemoved(flow.domNode);
    }

    // Record initial positions
    globallyRemovedAnimated.forEach(flow => {
      flow.animation.recordBoundsInNewStructure(flow.domNode)
      // standardAnimation.recordBoundsInNewStructure(flow.domNode.animationOriginNode);
    });

    globallyPresentAnimated.forEach(flow => {
      flow.animation.recordBoundsInNewStructure(flow.domNode)
      // standardAnimation.recordBoundsInNewStructure(flow.domNode.animationOriginNode);
    });
    
    // Setup flow.animate initial position
    // Translate all except globallyAdded to their old position (globallyAdded should have a scale=0 transform)
    for (let flow of globallyAddedAnimated) {
      flow.animation.translateAddedFromNewToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyPresentAnimated) {
      flow.animation.translateResidentFromNewToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyRemovedAnimated) {
      flow.animation.translateRemovedFromNewToOriginalPosition(flow.domNode);
    }
      
    // Activate animation
    requestAnimationFrame(() => {

      // Transition all except globallyRemoved to new position by removing translation
      // Minimize globallyRemoved by adding scale = 0 transform and at the same time removing the translation
      for (let flow of globallyAddedAnimated) {
        flow.animation.setupFinalStyleForAdded(flow.domNode);
      }
      for (let flow of globallyPresentAnimated) {
        flow.animation.setupFinalStyleForResident(flow.domNode);
      }
      for (let flow of globallyRemovedAnimated) {
        flow.animation.setupFinalStyleForRemoved(flow.domNode);
      } 
      
      // Setup cleanup
      for (let flow of globallyAddedAnimated) {
        flow.animation.setupAddedAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyPresentAnimated) {
        flow.animation.setupResidentAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyRemovedAnimated) {
        flow.animation.setupRemovedAnimationCleanup(flow.domNode);
        // () => {
        //   return !(
        //     flow.parentPrimitive && flow.parentPrimitive.childPrimitives && flow.parentPrimitive.childPrimitives.includes(flow)
        //   );
        // });
      } 
   }); 
  })
  console.groupEnd();
}


/**
 * Diff analysis
 */

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