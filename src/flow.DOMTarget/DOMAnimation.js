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
  globallyAdded: {},
  globallyRemoved: {},
  globallyResident: {}
};

window.flowChanges = flowChanges;

let previousIdPrimitiveMap = null;
let idPrimitiveMap = {};

let nextOriginMark = 0;

function findAndRecordOriginalBoundsOfOrigin(flow) {
  const originMark = nextOriginMark++;
      
  // Scan and mark old dom structure
  let scan = flow.domNode.parentNode; 
  if (!scan) throw new Error("Did not expect an animated without a parent!")
  while (scan) {
    scan.originMark = originMark;
    scan = scan.parentNode;
  }
  
  // Scan new flow structure and find common ancestor for resident flow
  scan = flow.parentPrimitive;
  while (scan) {
    if (scan.domNode.originMark === originMark) {
      flow.domNode.animationOriginNode = scan.domNode;
      break;
    }
    scan = scan.parentPrimitive;
  }
  
  standardAnimation.recordOriginalBoundsAndStyle(flow.domNode.animationOriginNode);  
}

export function onFinishReBuildingFlow() {
  log("---------------------------------------- onFinishBuildingFlow ----------------------------------------");

  previousIdPrimitiveMap = idPrimitiveMap;
  idPrimitiveMap = {};
  
  function analyzePrimitives(idPrimitiveMap, primitiveFlow) {
    idPrimitiveMap[primitiveFlow.id] = primitiveFlow;
  
    for (let child of primitiveFlow.iteratePrimitiveChildren()) {
      analyzePrimitives(idPrimitiveMap, child);
    }
  }
  
  for (let target of domFlowTargets) {
    analyzePrimitives(idPrimitiveMap, target.contentHolder);
  }

  flowChanges.globallyAdded = {}; 
  flowChanges.globallyResident = {}; 
  flowChanges.globallyRemoved = {};

  for (let id in idPrimitiveMap) {
    const inPreviousMap = previousIdPrimitiveMap[id];
    if (typeof(inPreviousMap) !== "undefined") {
      flowChanges.globallyResident[id] = inPreviousMap; 
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
        if (animation) {
          result.push(flow);
        }
        return result;
      }, []);
  }

  flowChanges.globallyAddedAnimated = getAnimatedFromMap(flowChanges.globallyAdded);
  flowChanges.globallyRemovedAnimated = getAnimatedFromMap(flowChanges.globallyRemoved);
  flowChanges.globallyResidentAnimated = getAnimatedFromMap(flowChanges.globallyResident);
 
  // Debug info
  flowChanges.a_globallyRemoved = Object.values(flowChanges.globallyRemoved).map(flow => flow.domNode);
  flowChanges.a_added = flowChanges.globallyAddedAnimated.map(flow => flow.domNode);
  flowChanges.a_removed = flowChanges.globallyRemovedAnimated.map(flow => flow.domNode);
  flowChanges.a_resident = flowChanges.globallyResidentAnimated.map(flow => flow.domNode);
 
  log("flowChanges");
  log(flowChanges);

  // Do to all new animated
  for (let flow of flowChanges.globallyResidentAnimated) {
    if (flow.domNode) {
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      findAndRecordOriginalBoundsOfOrigin(flow); 
    }
  }
  
  // Do to all globallyRemoved and animated
  for (let flow of flowChanges.globallyRemovedAnimated) {
    if (flow.domNode) {
      flow.animation.recordOriginalBoundsAndStyle(flow.domNode);
      findAndRecordOriginalBoundsOfOrigin(flow); 
    }
  }
  
  // On will unmount
  for (let flow of Object.values(flowChanges.globallyRemoved)) {
    let scan = flow; 
    while(scan) {
      creators.push(scan);
      scan.onWillUnmount();
      creators.pop();
      scan = scan.equivalentCreator;
    } 
  }

  flowChanges.onFinishReBuildingFlowDone = true;
}

export function onFinishReBuildingDOM() {
  if (!flowChanges.onFinishReBuildingFlowDone) return;
  log("---------------------------------------- onFinishBuildingDOM ----------------------------------------");
  delete flowChanges.onFinishReBuildingFlowDone; 

  let {globallyRemovedAnimated, globallyAddedAnimated, globallyResidentAnimated, globallyAdded} = flowChanges
  log("flowChanges");
  log(flowChanges);

  // Setup initial style.
  for (let flow of globallyAddedAnimated) {
    flow.animation.measureInitialStyleForAdded(flow.parentPrimitive.domNode, flow.domNode);
  }

  // On did mount
  for (let flow of Object.values(globallyAdded)) {
    let scan = flow; 
    while(scan) {
      creators.push(scan);
      scan.onDidMount();
      creators.pop();
      scan = scan.equivalentCreator;
    } 
  }

  for (let flow of globallyAddedAnimated) {
    flow.animation.setupInitialStyleForAdded(flow.domNode);
  }
  for (let flow of globallyResidentAnimated) {
    flow.animation.setupInitialStyleForResident(flow.domNode);
  }
  for (let flow of globallyRemovedAnimated) {
    flow.animation.setupInitialStyleForRemoved(flow.domNode);
  }

  requestAnimationFrame(() => {

    // Record initial positions
    globallyRemovedAnimated.forEach(flow => {
      flow.animation.recordInitialBounds(flow.domNode)
      standardAnimation.recordInitialBounds(flow.domNode.animationOriginNode);
    });

    globallyResidentAnimated.forEach(flow => {
      flow.animation.recordInitialBounds(flow.domNode)
      standardAnimation.recordInitialBounds(flow.domNode.animationOriginNode);
    });
    
    // Setup flow.animate initial position
    // Translate all except globallyAdded to their old position (globallyAdded should have a scale=0 transform)
    for (let flow of globallyAddedAnimated) {
      flow.animation.translateAddedFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyResidentAnimated) {
      flow.animation.translateResidentFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyRemovedAnimated) {
      flow.animation.translateRemovedFromInitialToOriginalPosition(flow.domNode);
    }
      
    // Activate animation
    requestAnimationFrame(() => {

      // Transition all except globallyRemoved to new position by removing translation
      // Minimize globallyRemoved by adding scale = 0 transform and at the same time removing the translation
      for (let flow of globallyAddedAnimated) {
        flow.animation.setupFinalStyleForAdded(flow.domNode);
      }
      for (let flow of globallyResidentAnimated) {
        flow.animation.setupFinalStyleForResident(flow.domNode);
      }
      for (let flow of globallyRemovedAnimated) {
        flow.animation.setupFinalStyleForRemoved(flow.domNode);
      } 
      
      // Setup cleanup
      for (let flow of globallyAddedAnimated) {
        flow.animation.setupAddedAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyResidentAnimated) {
        flow.animation.setupResidentAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyRemovedAnimated) {
        flow.animation.setupRemovedAnimationCleanup(flow.domNode);
      } 
   }); 
  })
}


/**
 * Diff analysis
 */

// export function analyzeAddedRemovedResident(oldIdMap, newIdMap) {
//   const removed = [];
//   const added = [];
//   const resident = [];
//   for(let id in oldIdMap) {
//     if (typeof(newIdMap[id]) === "undefined") {
//       removed.push(oldIdMap[id]);
//     } else {
//       resident.push(oldIdMap[id]);
//     }
//   }
//   for(let id in newIdMap) {
//     if (typeof(oldIdMap[id]) === "undefined") {
//       added.push(newIdMap[id]);
//     }
//   }
//   return {removed, added, resident};
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