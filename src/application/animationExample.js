import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

// A very simple model
const items = [
    "Foo", 
    "Fie",
    "Fum",
    "Bar",
    "Foobar",
    "Fiebar",
    "Fumbar"
];

function randomized(list) {
    function removeRandom(list) {
        const index = Math.floor(Math.random()*(list.length - 1))
        return list.splice(index, 1)[0]; 
    }

    const listCopy = [...list];
    const newList = [];
    while(listCopy.length > 0) {
        newList.push(removeRandom(listCopy));
    }
    return newList;
}


// A very simple view component
export class AnimationExample extends Flow {
  setState() {
    this.list = randomized(this.items);
  }

  build() {
    return column({
        children: this.list.map(item => text({key: item, text: item})),
        style: {fontSize: "40px", padding: "20px"}, 
        transitionAnimations: {
            exit: (flow, oldBound) => ({frames:[], timing: 1000}),
            enter: (flow, newBound) => ({frames:[], timing: 1000}),
            move: (flow, oldBound, newBound, deltaTransform) => ({frames:[], timing: 1000}),
        }
    });
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startAnimationExample() {
  const animation = new AnimationExample({
    key: "root",
    items,
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();

  setTimeout(() => {
    log("----------------------------------");
    animation.list = randomized(animation.items);
  }, 1000);

  setTimeout(() => {
    log("----------------------------------");
    animation.list = randomized(animation.items);
  }, 5000);

  setTimeout(() => {
    log("----------------------------------");
    animation.list = randomized(animation.items);
  }, 10000);
}
       