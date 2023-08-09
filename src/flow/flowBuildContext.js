


/**
 * Flow creation stack
 */
export let creators = [];



export function getTarget() {
  return creators[creators.length - 1].target;
}