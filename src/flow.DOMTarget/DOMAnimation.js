import { repeat, Flow, FlowTargetPrimitive, trace, configuration } from "../flow/Flow";

const log = console.log;

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

export function reBuildDomNodeWithChildrenAnimated(primitive, node, newChildNodes) {
  const transitionAnimations = primitive.transitionAnimations ? primitive.transitionAnimations : configuration.defaultTransitionAnimations;
  const childNodes = [...node.childNodes];
  let index;

  // Analyze removed and added
  // Reintroduced removed, but mark to be removed
  index = 0;
  const removed = [];
  const added = [];
  const resident = [];
  while(index < node.childNodes.length) {
    const existingChild = node.childNodes[index];
    if (!newChildNodes.includes(existingChild)) {
      newChildNodes.splice(index, 0, existingChild); // Heuristic, introduce at old index
      removed.push(existingChild);
    }
    index++;
  }
  for(let newChild of newChildNodes) {
    if (!childNodes.includes(newChild)) {
      added.push(newChild);
    } else if(!removed.includes(newChild)) {
      resident.push(newChild);
    }
  }

  // Stop any ongoing animation and measure current bounds and transformation
  const boundsBefore = childNodes.reduce(
    (result, node) => {
      // Stop ongoing animation!
      // node.style.transition = "";
      // const computedStyle = getComputedStyle(node);
      // // Object.assign(node.style, computedStyle);
      // if (computedStyle.transform !== "") {
      //   node.style.transform = computedStyle.transform; 
      // }

      // Get bounds
      const bounds = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect";
      
      // Possibly transform bounds? 
      // const transform = parseMatrix(computedStyle.transform); 
      // log(transform);
      // result[node.equivalentCreator.causality.id] = {
        //   top: bounds.top, //+ transform.translateY, 
        //   left: bounds.left,// + transform.translateX, 
        //   width: bounds.width,// * transform.scaleX, 
        //   height: bounds.height,// * transform.scaleY
        // };
      result[node.equivalentCreator.causality.id] = bounds;
      return result; 
    }, 
    {}
  );
  
  // Change all the elements to final state, with minimum changes to dom (to avoid loosing focus etc.)
  index = 0;
  while(index < newChildNodes.length) {
    const newChild = newChildNodes[index];
    const existingChild = node.childNodes[index];
    if (newChild !== existingChild) {
      node.insertBefore(newChild, existingChild);
    }
    index++;
  }
  
  // Setup animation final states for measures
  for (let node of added) {
    node.style.transform = "scale(1)";
    node.style.opacity = "1";
  }
  for (let node of resident) {
    node.style.transform = "scale(1)";
    node.style.opacity = "1";
  }
  for (let node of removed) {
    node.style.maxHeight = "0px";
    node.style.maxWidth = "0px";
    // node.style.transform = "" // Should really be something that minimizes the div?
    node.style.transform = "scale(0) translate(0, 0)";
    node.style.opacity = "0";
  }
  
  requestAnimationFrame(() => {
    
    // Measure new bounds
    const boundsAfter = newChildNodes.reduce(
      (result, node) => { 
        result[node.equivalentCreator.causality.id] = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect";
        return result; 
      }, 
      {}
    ); 
      
    // Setup animation initial states
    // Translate all except added to their old position (added should have a scale=0 transform)
    for (let node of added) {
      node.style.transition = "";
      node.style.transform = "scale(0)";
      node.style.opacity = "0";  
    }
    for (let node of resident) {
      node.style.transition = "";
      const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
      const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
      const deltaX = boundAfter.left - boundBefore.left;
      const deltaY = boundAfter.top - boundBefore.top;
      node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";
    }
    for (let node of removed) {
      node.style.transition = "";
      const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
      const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
      const deltaX = boundAfter.left - boundBefore.left;
      const deltaY = boundAfter.top - boundBefore.top;
      node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";
      node.style.opacity = "1";
    }
      
    // Activate animations 
    requestAnimationFrame(() => {

      function setupTransitionCleanup(node, alsoRemoveNode) {
    
        function onTransitionEnd(event) {
          if (alsoRemoveNode) {
            // log("REMOVING CHILD!!!")
            node.parentNode.removeChild(node);
          }
          node.style.transition = "";
          node.style.width = "";
          node.style.height = "";
          node.style.opacity = "";
          node.removeEventListener("transitionend", onTransitionEnd);
        }
    
        node.addEventListener("transitionend", onTransitionEnd);
      }

      // Transition all except removed to new position by removing translation
      // Minimize removed by adding scale = 0 transform and at the same time removing the translation
      for (let node of added) {
        node.style.transition = "all 0.4s ease-in-out";
        node.style.transform = "scale(1)";
        node.style.opacity = "1";
        setupTransitionCleanup(node, false);
      }
      for (let node of resident) {
        node.style.transition = "all 0.4s ease-in-out";
        node.style.transform = "scale(1)";
        setupTransitionCleanup(node, false);
      }
      for (let node of removed) {
        node.style.transition = "all 0.4s ease-in-out";
        node.style.maxHeight = "0px";
        node.style.maxWidth = "0px";
        node.style.transform = "scale(0) translate(0, 0)";
        node.style.opacity = "0";
        setupTransitionCleanup(node, true);
      }
    });  
  });
}