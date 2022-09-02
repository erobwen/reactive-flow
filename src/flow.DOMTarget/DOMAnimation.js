import { repeat, Flow, trace, configuration, flow } from "../flow/Flow";
import { DOMFlipAnimation } from "./DOMFlipAnimation";

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
 * DOM animation
 */
const updateFrame = {
  animatedFlows: {},
  previouslyAnimatedFlows: {},
  measuresDone: false
};

window.updateFrame = updateFrame;

function collectAllAnimated(result, primitiveFlow) {
  if (primitiveFlow.getAnimation()) {
    result[primitiveFlow.id()] = primitiveFlow; 
  }
  for (let child of primitiveFlow.getChildren()) {
    collectAllAnimated(result, child.getPrimitive());
  }
}

export function onFinishReBuildingFlow() {
  log("onFinishReBuildingFlow");
  updateFrame.previouslyAnimatedFlows = updateFrame.animatedFlows;
  updateFrame.animatedFlows = {};

  for (let target of domFlowTargets) {
    collectAllAnimated(updateFrame.animatedFlows, target.content.getPrimitive());
  }

  const {removed, added, resident} = analyzeAddedRemovedResident(updateFrame.previouslyAnimatedFlows, updateFrame.animatedFlows);
  updateFrame.removed = removed; 
  updateFrame.added = added; 
  updateFrame.resident = resident;

  // Do to all new animated
  for (let flow of resident) {
    if (flow.domNode) {
      flow.getAnimation().recordOriginalBoundsAndStyle(flow.domNode);
    }
  }

  // Do to all removed
  for (let flow of removed) {
    if (flow.domNode) {
      flow.getAnimation().recordOriginalBoundsAndStyle(flow.domNode);
    }
  }
  updateFrame.measuresDone = true;
}

export function onFinishReBuildingDOM() {
  log("onFinishReBuildingDOM");
  if (!updateFrame.measuresDone) return;
  updateFrame.measuresDone = false; 

  const {removed, added, resident} = updateFrame
  log("removed")
  log(removed)
  log("added")
  log(added)
  log("resident")
  log(resident)

  // Setup initial style.
  for (let flow of added) {
    flow.getAnimation().setupInitialStyleForAdded(flow.domNode);
  }
  for (let flow of resident) {
    flow.getAnimation().setupInitialStyleForResident(flow.domNode);
  }
  for (let flow of removed) {
    flow.getAnimation().setupInitialStyleForRemoved(flow.domNode);
  }

  requestAnimationFrame(() => {

    // Record initial positions
    // note: childNodes contains resident and removed.
    Object.values(updateFrame.previouslyAnimatedFlows).forEach(flow => {
      flow.getAnimation().recordInitialBounds(flow.domNode)
    });
 
    // Setup flow.animate initial position
    // Translate all except added to their old position (added should have a scale=0 transform)
    for (let flow of added) {
      flow.getAnimation().translateAddedFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of resident) {
      flow.getAnimation().translateResidentFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of removed) {
      flow.getAnimation().translateRemovedFromInitialToOriginalPosition(flow.domNode);
    }
      
    // Activate animation
    requestAnimationFrame(() => {

      // Transition all except removed to new position by removing translation
      // Minimize removed by adding scale = 0 transform and at the same time removing the translation
      for (let flow of added) {
        flow.getAnimation().setupFinalStyleForAdded(flow.domNode);
      }
      for (let flow of resident) {
        flow.getAnimation().setupFinalStyleForResident(flow.domNode);
      }
      for (let flow of removed) {
        flow.getAnimation().setupFinalStyleForRemoved(flow.domNode);
      } 

      // Setup cleanup
      for (let flow of added) {
        flow.getAnimation().setupAddedAnimationCleanup(flow.domNode);
      }
      for (let flow of resident) {
        flow.getAnimation().setupResidentAnimationCleanup(flow.domNode);
      }
      for (let flow of removed) {
        flow.getAnimation().setupRemovedAnimationCleanup(flow.domNode);
      } 
   }); 
  })
}


/**
 * Diff analysis
 */

export function analyzeAddedRemovedResident(oldIdMap, newIdMap) {
  const removed = [];
  const added = [];
  const resident = [];
  for(let id in oldIdMap) {
    if (typeof(newIdMap[id]) === "undefined") {
      removed.push(oldIdMap[id]);
    } else {
      resident.push(oldIdMap[id]);
    }
  }
  for(let id in newIdMap) {
    if (typeof(oldIdMap[id]) === "undefined") {
      added.push(newIdMap[id]);
    }
  }
  return {removed, added, resident};
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