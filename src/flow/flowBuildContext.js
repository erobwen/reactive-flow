


/**
 * Flow creation stack. When a flow is created and running its constructor, it can find its creator using these functions. 
 */
export let creators = [];

export function getCreator() {
  return creators[creators.length - 1];
}

export function getTarget() {
  return creators[creators.length - 1].target;
}