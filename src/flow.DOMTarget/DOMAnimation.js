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
  globallyAdded: null,
  globallyRemoved: null,
  globallyResident: null,
  measuresDone: false
};

window.updateFrame = updateFrame;

function collectAllAnimated(result, primitiveFlow) {
  // This flow had changes
  if (primitiveFlow.unobservable.flowBuildNumber === configuration.flowBuildNumber) {
    for (let flow of Object.values(primitiveFlow.unobservable.added)) {
      if (flow.getAnimation()) {
        result.globallyAdded[flow.id] = flow;
      }
    }
    for (let flow of Object.values(primitiveFlow.unobservable.removed)) {
      if (flow.getAnimation()) {
        result.globallyRemoved[flow.id] = flow;
      }
      // Collect animations on removed! This is necessary for making recursive removes work properly.  
      collectAllAnimated(result, flow);
    }
    for (let flow of Object.values(primitiveFlow.unobservable.resident)) {
      if (flow.getAnimation()) {
        result.globallyResident[flow.id] = flow;
      }
    }
  }

  for (let child of primitiveFlow.iteratePrimitiveChildren()) {
    collectAllAnimated(result, child);
  }
}

function ajustAllAnimated(result, primitiveFlow) {
  // This flow had changes
  if (primitiveFlow.unobservable.flowBuildNumber === configuration.flowBuildNumber) {
    for (let flow of Object.values(primitiveFlow.unobservable.added)) {
      if (result.globallyRemoved[flow.id]) {
        delete primitiveFlow.unobservable.added;
        primitiveFlow.unobservable.incoming[flow.id] = flow;
      }
    }
    for (let flow of Object.values(primitiveFlow.unobservable.removed)) {
      if (result.globallyAdded[flow.id]) {
        delete primitiveFlow.unobservable.removed[flow.id];
        primitiveFlow.unobservable.outgoing[flow.id] = flow;
      }
      // Ajust animations on removed! This is necessary for making recursive removes work properly.  
      ajustAllAnimated(result, flow);
    }
  }

  for (let child of primitiveFlow.iteratePrimitiveChildren()) {
    ajustAllAnimated(result, child);
  }
}

export function onFinishReBuildingFlow() {
  log("---------------------------------------- onFinishBuildingFlow ----------------------------------------");

  const result = {
    globallyAdded: {}, 
    globallyRemoved: {},
    globallyResident: {}
  }

  for (let target of domFlowTargets) {
    collectAllAnimated(result, target.contentHolder);
  }
  for (let target of domFlowTargets) {
    ajustAllAnimated(result, target.contentHolder);
  }

  for(let id in result.globallyRemoved) {
    if (typeof(result.globallyAdded[id]) !== "undefined") {
      result.globallyResident[id] = result.globallyRemoved[id];
      delete result.globallyRemoved[id];
      delete result.globallyAdded[id];
    }
  }

  updateFrame.globallyAdded = Object.values(result.globallyAdded);
  updateFrame.globallyRemoved = Object.values(result.globallyRemoved);
  updateFrame.globallyResident = Object.values(result.globallyResident);
  log(updateFrame);

  // Do to all new animated
  for (let flow of updateFrame.globallyResident) {
    if (flow.domNode) {
      flow.getAnimation().recordOriginalBoundsAndStyle(flow.domNode);
    }
  }

  // Do to all globallyRemoved
  for (let flow of updateFrame.globallyRemoved) {
    if (flow.domNode) {
      flow.getAnimation().recordOriginalBoundsAndStyle(flow.domNode);
      let scan = flow; 
      while(scan) {
        scan.onWillUnmount();
        scan = scan.equivalentCreator;
      } 
    }
  }
  updateFrame.measuresDone = true;
}

export function onFinishReBuildingDOM() {
  log("---------------------------------------- onFinishBuildingDOM ----------------------------------------");

  if (!updateFrame.measuresDone) return;
  updateFrame.measuresDone = false; 

  const {globallyRemoved, globallyAdded, globallyResident} = updateFrame

  // Setup initial style.
  log([...globallyAdded]);
  for (let flow of globallyAdded) {
    flow.getAnimation().measureInitialStyleForAdded(flow.parentPrimitive.domNode, flow.domNode);
    let scan = flow; 
    while(scan) {
      scan.onDidMount();
      scan = scan.equivalentCreator;
    } 
  }

  for (let flow of globallyAdded) {
    flow.getAnimation().setupInitialStyleForAdded(flow.domNode);
  }
  for (let flow of globallyResident) {
    flow.getAnimation().setupInitialStyleForResident(flow.domNode);
  }
  for (let flow of globallyRemoved) {
    flow.getAnimation().setupInitialStyleForRemoved(flow.domNode);
  }

  requestAnimationFrame(() => {

    // Record initial positions
    updateFrame.globallyRemoved.forEach(flow => {
      flow.getAnimation().recordInitialBounds(flow.domNode)
    });

    updateFrame.globallyResident.forEach(flow => {
      flow.getAnimation().recordInitialBounds(flow.domNode)
    });

    
    // Setup flow.animate initial position
    // Translate all except globallyAdded to their old position (globallyAdded should have a scale=0 transform)
    for (let flow of globallyAdded) {
      flow.getAnimation().translateAddedFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyResident) {
      flow.getAnimation().translateResidentFromInitialToOriginalPosition(flow.domNode);
    }
    for (let flow of globallyRemoved) {
      flow.getAnimation().translateRemovedFromInitialToOriginalPosition(flow.domNode);
    }
      
    // Activate animation
    requestAnimationFrame(() => {

      // Transition all except globallyRemoved to new position by removing translation
      // Minimize globallyRemoved by adding scale = 0 transform and at the same time removing the translation
      for (let flow of globallyAdded) {
        flow.getAnimation().setupFinalStyleForAdded(flow.domNode);
      }
      for (let flow of globallyResident) {
        flow.getAnimation().setupFinalStyleForResident(flow.domNode);
      }
      for (let flow of globallyRemoved) {
        flow.getAnimation().setupFinalStyleForRemoved(flow.domNode);
      } 

      // Setup cleanup
      for (let flow of globallyAdded) {
        flow.getAnimation().setupAddedAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyResident) {
        flow.getAnimation().setupResidentAnimationCleanup(flow.domNode);
      }
      for (let flow of globallyRemoved) {
        flow.getAnimation().setupRemovedAnimationCleanup(flow.domNode);
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