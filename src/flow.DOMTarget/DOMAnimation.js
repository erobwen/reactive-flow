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

export function reBuildDomNodeWithChildrenAnimated(parentPrimitive, parentNode, newChildNodes) {
  const transitionAnimations = parentPrimitive.transitionAnimations ? parentPrimitive.transitionAnimations : configuration.defaultTransitionAnimations;
  const childNodes = [...parentNode.childNodes];
  let index;
  log("=========================================")

  // Analyze removed and added
  // Reintroduced removed, but mark to be removed
  index = 0;
  const removed = [];
  const added = [];
  const resident = [];
  while(index < parentNode.childNodes.length) {
    const existingChild = parentNode.childNodes[index];
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
  log(boundsBefore);
  // debugger; 
  
  // Change all the elements to final structure, with minimum changes to dom (to avoid loosing focus etc.)
  index = 0;
  while(index < newChildNodes.length) {
    const newChild = newChildNodes[index];
    const existingChild = parentNode.childNodes[index];
    if (newChild !== existingChild) {
      parentNode.insertBefore(newChild, existingChild);
    }
    index++;
  }
  
  // // Setup animation final structure with initial measures.
  for (let node of added) {
    node.rememberedStyle = {...node.style};
    node.targetDimensions = node.equivalentCreator.dimensions();
    // log("target dimensions.");
    log(node.targetDimensions);
    // log("remembered padding etc.");
    // log(node.rememberedStyle.padding);
    // log(node.rememberedStyle.padding);
    // log(node.rememberedStyle.margin);
    // node.style.transition = "";
    node.style.transform = "scale(0)";
    node.style.maxHeight = "0px"
    node.style.maxWidth = "0px"
    node.style.margin = "0px"
    node.style.marginTop = "0px"
    node.style.marginBottom = "0px"
    node.style.marginLeft = "0px"
    node.style.marginRight = "0px"
    node.style.padding = "0px"
    node.style.paddingTop = "0px"
    node.style.paddingBottom = "0px"
    node.style.paddingLeft = "0px"
    node.style.paddingRight = "0px"
    node.style.opacity = "0";
  }
  for (let node of resident) {
    node.style.transform = "scale(1)";
    node.style.opacity = "1";
  }
  for (let node of removed) {
    node.style.transform = "scale(1)";
    node.style.opacity = "1";
    node.rememberedStyle = {...getComputedStyle(node)};
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
    log(boundsAfter);
  
    // Setup animation initial states
    // Translate all except added to their old position (added should have a scale=0 transform)
    for (let node of added) {
      
    }
    for (let node of resident) {
      node.style.transition = "";
      const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
      const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
      const deltaX = boundAfter.left - boundBefore.left;
      const deltaY = boundAfter.top - boundBefore.top;
      node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";
      log(node.style.transform);
    }
    for (let node of removed) {
      node.style.transition = "";
      const boundBefore = boundsBefore[node.equivalentCreator.causality.id];
      const boundAfter = boundsAfter[node.equivalentCreator.causality.id];
      const deltaX = boundAfter.left - boundBefore.left;
      const deltaY = boundAfter.top - boundBefore.top;
      node.style.transform = "scale(1) translate(" + -deltaX + "px, " + -deltaY + "px)";

      node.style.maxHeight = node.rememberedStyle.height;
      node.style.maxWidth = node.rememberedStyle.width;
      node.style.opacity = "1";
      delete node.rememberedStyle;
    }
      
    // Activate animations 
    requestAnimationFrame(() => {
      function setupTransitionCleanup(node, alsoRemoveNode) {
    
        function onTransitionEnd(event) {
          if (alsoRemoveNode) {
            node.parentNode.removeChild(node);
          }
          node.style.transition = "";
          node.style.width = "";
          node.style.height = "";
          node.style.maxWidth = "";
          node.style.maxHeight = "";
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
        node.style.maxHeight = node.targetDimensions.height + "px"
        node.style.maxWidth = node.targetDimensions.width + "px"
        delete node.targetDimensions;
        node.style.margin = node.rememberedStyle.margin; 
        node.style.marginTop = node.rememberedStyle.marginTop; 
        node.style.marginBottom = node.rememberedStyle.marginBottom; 
        node.style.marginLeft = node.rememberedStyle.marginLeft; 
        node.style.marginRight = node.rememberedStyle.marginRight; 
        node.style.padding = node.rememberedStyle.padding;
        node.style.paddingTop = node.rememberedStyle.paddingTop;
        node.style.paddingBottom = node.rememberedStyle.paddingBottom;
        node.style.paddingLeft = node.rememberedStyle.paddingLeft;
        node.style.paddingRight = node.rememberedStyle.paddingRight;
        node.style.opacity = "1";
        delete node.rememberedStyle;
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
        node.style.margin = "0px"
        node.style.marginTop = "0px"
        node.style.marginBottom = "0px"
        node.style.marginLeft = "0px"
        node.style.marginRight = "0px"
        node.style.padding = "0px"
        node.style.paddingTop = "0px"
        node.style.paddingBottom = "0px"
        node.style.paddingLeft = "0px"
        node.style.paddingRight = "0px"
        setupTransitionCleanup(node, true);
      }
    });  
  });
}




/**
 * Configuration musings... 
 * How could we condense the above code into a configuration? 
 */

//  {
  // Note: use flow.domNode to access the current state of the dom node associated with the flow. 
  // This method is called just before the animation is run so you could examine bounds etc. 
  // and create the animations depending on that. 
//   enter: {
//     transition: "0.4s ease-in-out",
//     initialStyle: {
//       opacity: "0",
//       transform: {
//         scale: 0
//       }
//     },
//     finalStyle: {
//       opacity: "1",
//       transform: {
//         scale: 1 
//       }
//     },
//   }, 
//   move: {
//     transition: "0.4s ease-in-out",
//   },
//   exit: {
//     transition: "0.4s ease-in-out",
//     initialStyle: {
//       opacity: "1",
//       transform: {
//         scale: 1 
//       }
//     },
//     finalStyle: {
//       maxHeight: "0px",
//       maxWidth: "0px",
//       opacity: "0",
//       transform: {
//         scale: 0,
//         translate: {x: 0, y: 0}
//       }
//     }
//   }
// }
