import { adjustLightness, rgba2hex } from "../flow.components/Color";

export const log = console.log;


export function deepFreeze (o) {
  Object.freeze(o);
  if (o === undefined) {
    return o;
  }

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o[prop] !== null
    && (typeof o[prop] === "object" || typeof o[prop] === "function")
    && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
};


export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Pretty logging 
 */

const color = "rgba(170, 100, 100, 1)";

const animationFrameBackgroundColor = rgba2hex("rgba(150, 150, 255, 1)");
const animationFrameColor = rgba2hex("rgba(255, 255, 255, 1)");
const animationFrameSeparatorBackgroundColor = adjustLightness(animationFrameBackgroundColor, +0.1)
export function logAnimationFrame() {
  const text = "      Animation Frame      ";
  const colors = `background: ${animationFrameBackgroundColor}; color: ${animationFrameColor}`
  // log(colors);
  console.group('%c' + text, colors);
} 

export function logAnimationFrameEnd() {
  console.groupEnd();
}

export function logAnimationSeparator(text) {
  const colors = `background: ${animationFrameSeparatorBackgroundColor}; color: ${animationFrameColor}`
  // log(colors);
  console.log('%c' + text, colors);
}

export function logMark(text) {
  console.log('%c' + text, 'background: #222; color: #bada55');
}


export function isUpperCase(string) {
  if (string.toUpperCase() === string) {
  return true;
} else
  return false;
}


/**
 * Drawing 
 */

export function draw(bounds, color="black") {
  // const outline = window.document.createElement("div");
  // outline.style.position = "absolute";
  // outline.style.top = bounds.top + "px";
  // outline.style.left = bounds.left + "px";
  // outline.style.width = bounds.width + "px";
  // outline.style.height = bounds.height + "px";
  // outline.style.borderWidth = "1px";
  // outline.style.borderStyle = "solid";
  // outline.style.borderColor = color;
  // document.children[0].appendChild(outline);
}


export const camelCased = (myString) => myString.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

// const firstOfCamelCase = (camelCase) => 
//   camelCase.replace(/([A-Z])/g, " $1").split(" ")[0];

