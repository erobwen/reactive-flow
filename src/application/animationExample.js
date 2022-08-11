import { observable, Flow, flow, repeat, transaction } from "../flow/Flow";
import { text, column, row, button } from "../flow.components/BasicFlowComponents";
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

// A very simple view component
export class AnimationExample extends Flow {
  setProperties({items}) {
    this.store = observable([...items]);
  }

  setState() {
    this.list = observable([]);
    transaction(() => {
      let count = 1; 
      while (count-- > 0) addRandomly(removeOneRandom(this.store), this.list);
    });
  }

  build() {
    return column(
      row(
        button({text: "Randomize", onClick: () => transaction(() => randomize(this.list))}),
        button({text: "Add random", disabled: this.store.length === 0, onClick: () => transaction(() => addRandomly(removeOneRandom(this.store), this.list))}),
        button({text: "Remove random", disabled: this.list.length === 0, onClick: () => transaction(() => this.store.push(removeOneRandom(this.list)))}),
      ),
      column({
        children: this.list.map(item => text({key: item, text: item, style: {textAlign: "center"}})),
        style: {fontSize: "40px", padding: "20px", maxWidth: "300px"}, 
        // transitionAnimations: flow => ({
        //   // Note: use flow.domNode to access the current state of the dom node associated with the flow. 
        //   // This method is called just before the animation is run so you could examine bounds etc. 
        //   // and create the animations depending on that. 
        //   move: {
        //     transition: "0.4s ease-in-out",
        //   },
        //   enter: {
        //     transition: "0.4s ease-in-out",
        //     initialStyle: {
        //       opacity: "0",
        //       transform: "scale(0)"
        //     },
        //     finalStyle: {
        //       opacity: "1",
        //       transform: "scale(1)"
        //     },
        //   }, 
        //   exit: {
        //     transition: "0.4s ease-in-out",
        //     initialStyle: {
        //       opacity: "1",
        //       transform: "scale(1)"
        //     },
        //     finalStyle: {
        //       opacity: "0",
        //       transform: "scale(0)"
        //     }
        //   }
        // })
    })
    );
  }
}

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startAnimationExample() {
  new AnimationExample({
    key: "root",
    items,
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}
   

/**
 * Random stuff
 */

function removeOneRandom(list) {
  const index = Math.floor(Math.random()*(list.length - 1))
  return list.splice(index, 1)[0]; 
}

function randomized(list) {
    const listCopy = [...list];
    const newList = [];
    while(listCopy.length > 0) {
        newList.push(removeOneRandom(listCopy));
    }
    return newList;
}

function randomize(list) {
  transaction(() => {
    const newContent = randomized(list);
    list.length = 0;
    list.push.apply(list, newContent);
  });
}

function addRandomly(item, list) {
  const insertIndex = Math.floor(Math.random()*(list.length));
  list.splice(insertIndex, 0, item);
}