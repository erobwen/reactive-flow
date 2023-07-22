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



/**
 * Pretty logging 
 */

const color = "rgba(170, 100, 100, 1)";

const animationFrameBackgroundColor = rgba2hex("rgba(255, 150, 150, 1)");
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