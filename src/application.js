import { Flow, Text, Row } from "./flow/Flow";
const log = console.log;

export class TestComponent extends Flow {

  setProperties({}) {
    this.count = 11
    // this.count = 1
  }

  onReBuildCreate() {
    const me = this;

    // setTimeout(() => {
    //   log("-----------");
    //   me.count++
    // }, 1000);
    // setTimeout(() => {me.count++}, 2000);
    // setTimeout(() => {me.count++}, 3000);

    function decrease() {
      me.count--
      setTimeout(() => {decrease()}, 1000);
    }
    decrease();
  }

  build() {
    return new Row({
      key:"row",
      children: [
        new Text({key: "text", text: "My List:"}),
        new List({key: "list", count: this.count})
      ]
    });
  }
}

export class List extends Flow {
  setProperties({count}) {
    this.count = count;
  }

  build() {
    console.log(this.count)
    const children = [];
    children.push(new Item({key: "text", text: "Foo " +  this.count}));
    if (this.count > 1) {
      children.push(new List({key: "rest", count: this.count - 1}));
    }
    return new Row({key:"row", children: children });
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text; 
  }

  build() {
    log(this.text);
    return new Row({key: "row", children: [new Text({key: "text", text: this.text})]});
  }
}