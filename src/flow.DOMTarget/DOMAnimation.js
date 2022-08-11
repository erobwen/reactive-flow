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

  // Analyze removed and added
  // Reintroduced removed, but mark to be removed
  index = 0;
  const removed = [];
  const added = [];
  while(index < node.childNodes.length) {
    const existingChild = node.childNodes[index];
    if (!newChildNodes.includes(existingChild)) {
      newChildNodes.splice(index, 0, existingChild); // Heuristic, introduce at old index
      removed.push(existingChild);
    }
    index++;
  }
  // index = 0;
  // while(index < newChildNodes.length) {

  // Stop any ongoing animation and measure current bounds and transformation
  const boundsBefore = childNodes.reduce(
    (result, node) => {
      const computedStyle = getComputedStyle(node);
      // Object.assign(node.style, computedStyle);

      // Stop ongoing animation!
      if (computedStyle.transform !== "") {
        node.style.transform = computedStyle.transform; 
      }

      const bounds = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect";
  
      const transform = parseMatrix(computedStyle.transform); 
      log(transform);
      result[node.equivalentCreator.causality.id] = {
        top: bounds.top, //+ transform.translateY, 
        left: bounds.left,// + transform.translateX, 
        // width: bounds.width, * transform.scaleX, 
        // height: bounds.height, * transform.scaleY
      };

      return result; 
    }, 
    {}
  );
  
  // Adding pass
  index = 0;
  // const added = [];
  while(index < newChildNodes.length) {
    const newChild = newChildNodes[index];
    newChild.style.transform = "";
    if (!childNodes.includes(newChild)) {
      added.push(newChild);
      newChild.style.transform = "scale(0)";
      // newChild.style.width = "0px";
      // newChild.style.height = "0px";
      newChild.style.opacity = "0";
    }

    const existingChild = node.childNodes[index];
    if (newChild !== existingChild) {
      node.insertBefore(newChild, existingChild);
    }
    index++;
  }
  // log("added:");
  // log(added);


  // Modify deleted?    
  // existingChild.style.transition = "";
  // existingChild.style.transform = "";
  
  // Measure new bounds
  const boundsAfter = newChildNodes.reduce(
    (result, node) => { 
      result[node.equivalentCreator.causality.id] = (node instanceof Element) ? node.getBoundingClientRect() : "no-bounding-client-rect"; 
      return result; 
    }, 
    {}
  );
  // debugger; 
  // log("boundsAfter:");
  // log(boundsAfter);

  requestAnimationFrame(() => {
    // log("Translate to old position!!!!")

    // Translate all except added to their old position (added should have a scale=0 transform)
    index = 0;
    while(index < newChildNodes.length) {
      const node = newChildNodes[index];
      if (!added.includes(node)) {  // && !removed.includes(node)
        const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
        const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
        const deltaX = boundAfter.left - boundBefore.left;
        const deltaY = boundAfter.top - boundBefore.top;
        // console.log("translate(" + -deltaX + "px, " + -deltaY + "px)");
        node.style.transition = "";
        node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";
      }
      index++;
    }

    // Activate animations 
    requestAnimationFrame(() => {
      // debugger;
      // log("Activate animations!!!!")

      // Transition all except removed to new position by removing translation
      // Minimize removed by adding scale = 0 transform and at the same time removing the translation
      newChildNodes.forEach(node => {
        if (node instanceof Element) {
          // log(node)
          if (!removed.includes(node)) {
            // log("OTHER")
            node.style.transition = "all 0.4s ease-in-out";
            node.style.transform = "scale(1)";
            // node.style.width = "";
            // node.style.height = "";
            node.style.opacity = "";
            setupTransitionCleanup(node, false);
          } else {
            // log("REMOVED")
            node.style.transition = "all 0.4s ease-in-out";
            // node.style.width = "0px";
            // node.style.height = "0px";
            node.style.opacity = "0";
            node.style.transform = "scale(0) translate(0, 0)";
            setupTransitionCleanup(node, true);
          }      
        }
      });
    });  
  });
}