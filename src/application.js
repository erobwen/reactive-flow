import { Flow, Text, Row, Button } from "./flow/Flow";
const log = console.log;

export class TestComponent extends Flow {

  setProperties({}) {
    this.count = 1
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
  }

  build() {
    const me = this;
    let observe = this.count;
    return new Row({
      key:"row",
      children: [
        new Text({key: "text", text: "My List:"}),
        new Button({key: "less", onClick: () => {me.count--}, text: "Less"}),
        new Button({key: "more", onClick: () => {me.count++}, text: "More"}),
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
    // console.log(this.count)
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
    this.on = true;
  }

  build() {
    log("rebuilding item");
    const me = this; 
    return new Row({key: "row", 
      children: [
        new Text({key: "text", text: me.on ? "on" : "off"}),
        new Button({key: "less", onClick: () => {me.on = !me.on; log("foo...")}, text: "toggle"}),
        new Text({key: "text", text: me.text})
      ]});
  }
}

