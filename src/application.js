import { Flow, Text, Row } from "./flow/Flow";
const log = console.log;

export class TestComponent extends Flow {

  setProperties({}) {
    this.count = 11
  }

  onReBuildCreate() {
    const me = this;
    function decrease() {
      me.count--
      setTimeout(() => {decrease()}, 1000);
    }
    decrease();
  }

  build() {
    return new Row({
      children: [
        new Text({text: "My List:"}),
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
    const children = [];
    children.push(new Item({text: "Foo " +  this.count}));
    if (this.count > 1) {
      children.push(new List({count: this.count - 1}));
    }
    return new Row({ children: children });
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text; 
  }

  build() {
    return new Row({children: [new Text({text: this.text})]});
  }
}