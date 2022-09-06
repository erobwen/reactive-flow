import { observable, Flow, flow, repeat, transaction } from "../flow/Flow";
import { text, column, row, button, filler, div } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { standardAnimation } from "../flow.DOMTarget/DOMFlipAnimation";

const log = console.log;

/**
 * Flow definitions
 */
const smallSpace = "10px";
// const largeSpace = "20px";
// const smallSpace = "0px";
const largeSpace = "0px";


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

const panel = flow("panel", ({ children, style }) =>
  column({key: "panel", 
    children, 
    style: {
      marginBottom: "10px", 
      borderRadius: "15px", 
      backgroundColor: "#eeeeee", 
      borderColor: "#cccccc", 
      borderStyle: "solid", 
      borderWidth: "1px", 
      padding: "10px", 
      ...style
    }
  })
);

// A very simple view component
export class AnimationExample extends Flow {
  setProperties({items}) {
    this.items = items; 
  }

  setState() {
    this.store = observable([...this.items]);
    this.listA = observable([]);
    this.listB = observable([]);
    transaction(() => {
      let count = 3; 
      while (count-- > 0) addRandomly(removeOneRandom(this.store), this.listA);
    });
  }

  juggle() {
    transaction(() => {
      const listALength = this.listA.length;
      const listBLength = this.listB.length;
      const aToB = (listALength + 1 >= listBLength && listALength) && removeOneRandom(this.listA);
      const bToA = (listBLength + 1 >= listALength && listBLength) && removeOneRandom(this.listB);
      if (aToB) addRandomly(aToB, this.listB);
      if (bToA) addRandomly(bToA, this.listA);
    });
  }

  build() {
    return column(
      row(
        button({text: "Randomize", onClick: () => transaction(() => randomize(this.listA))}),
        button({text: "Add random", disabled: this.store.length === 0, onClick: () => transaction(() => addRandomly(removeOneRandom(this.store), this.listA))}),
        button({text: "Remove random", disabled: this.listA.length === 0, onClick: () => transaction(() => this.store.push(removeOneRandom(this.listA)))}),
        button({text: "Juggle", onClick: () => this.juggle()}),
      ),
      row(
        column(
          panel({
            children: this.listA.map(item => text({key: item, text: item, style: {padding: smallSpace, margin: smallSpace, textAlign: "left"}})),
            style: {fontSize: "40px", margin: largeSpace, padding: largeSpace, overflow: "visible", borderStyle:"solid", borderWidth: "1px"}, 
            animateChildren: standardAnimation       
          }),
          filler(),
          {style: {overflow: "visible"}}
        ),
        filler(),
        column(
          panel({
            children: this.listB.map(item => text({key: item, text: item, style: {padding: smallSpace, margin: smallSpace, textAlign: "left"}})),
            style: {fontSize: "40px", margin: largeSpace, padding: largeSpace, overflow: "visible", borderStyle:"solid", borderWidth: "1px"},  
            animateChildren: standardAnimation       
          }),
          filler(),
          {style: {overflow: "visible"}}
        ),
        {style: {overflow: "visible", height: "100%"}}
      ),
      {style: {height: "100%", width: "100%"}},
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
  const index = Math.floor(Math.random()*(list.length))
  return list.splice(index, 1)[0]; 
}

function randomized(list) {
    const listCopy = [...list];
    const newList = [];
    while(listCopy.length > 0) {
      addRandomly(removeOneRandom(listCopy), newList);
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