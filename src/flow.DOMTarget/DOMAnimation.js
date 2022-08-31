import { repeat, Flow, FlowTargetPrimitive, trace, configuration } from "../flow/Flow";
import { DOMFlipAnimation } from "./DOMFlipAnimation";

const log = console.log;


export function analyzeAddedRemovedResident(oldList, newList) {
  const removed = [];
  const added = [];
  const resident = [];
  let index = 0;
  while(index < oldList.length) {
    const existingChild = oldList[index];
    if (!newList.includes(existingChild)) {
      newList.splice(index, 0, existingChild); // Heuristic, introduce at old index
      removed.push(existingChild);
    }
    index++;
  }
  for(let newChild of newList) {
    if (!oldList.includes(newChild)) {
      added.push(newChild);
    } else if(!removed.includes(newChild)) {
      resident.push(newChild);
    }
  }
  return {removed, added, resident};
}

export function reBuildDomNodeWithChildrenAnimated(parentPrimitive, parentNode, newChildNodes) {
  const animation = new DOMFlipAnimation();
  let childNodes = [...parentNode.childNodes];

  // Analyze added, removed, resident
  const {removed, added, resident} = analyzeAddedRemovedResident(childNodes, newChildNodes);

  // Record origin positions
  childNodes.forEach(node => animation.recordOriginalBoundsAndStyle(node));
  

  // Change all the elements to final structure, with minimum changes to dom (to avoid loosing focus etc.)
  // Leave removed so far.. 
  let index = 0;
  while(index < newChildNodes.length) {
    const newChild = newChildNodes[index];
    const existingChild = parentNode.childNodes[index];
    if (newChild !== existingChild) {
      parentNode.insertBefore(newChild, existingChild);
    }
    index++;
  }
  
  // Setup initial style.
  for (let node of added) {
    animation.setupInitialStyleForAdded(node);
  }
  for (let node of resident) {
    animation.setupInitialStyleForResident(node);
  }
  for (let node of removed) {
    animation.setupInitialStyleForRemoved(node);
  }

  requestAnimationFrame(() => {
    
     // Record initial positions
     // note: childNodes contains resident and removed.
    childNodes.forEach(node => animation.recordInitialBounds(node));
  
    // Setup animation initial position
    // Translate all except added to their old position (added should have a scale=0 transform)
    for (let node of added) {
      animation.translateAddedFromInitialToOriginalPosition(node);
    }
    for (let node of resident) {
      animation.translateResidentFromInitialToOriginalPosition(node);
    }
    for (let node of removed) {
      animation.translateRemovedFromInitialToOriginalPosition(node);
    }
      
    // Activate animations 
    requestAnimationFrame(() => {
      // Transition all except removed to new position by removing translation
      // Minimize removed by adding scale = 0 transform and at the same time removing the translation
      for (let node of added) {
        animation.setupFinalStyleForAdded(node);
      }
      for (let node of resident) {
        animation.setupFinalStyleForResident(node);
      }
      for (let node of removed) {
        animation.setupFinalStyleForRemoved(node);
      } 

      // Setup cleanup
      for (let node of added) {
        animation.setupAddedAnimationCleanup(node);
      }
      for (let node of resident) {
        animation.setupResidentAnimationCleanup(node);
      }
      for (let node of removed) {
        animation.setupRemovedAnimationCleanup(node);
      } 
    });  
  });
}







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