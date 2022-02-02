import { Flow, Text, Row, Button, repeat } from "./flow/Flow";
const log = console.log;

export class TestComponent extends Flow {

  setProperties({}) {
    this.count = 1
    // this.count = 1
  }

  onReBuildCreate() {
    const me = this;

    repeat(() => { 
      let observe = me.count;
      log("-----------------------");
    })
    
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
      key:"root-row",
      children: [
        new Text({key: "root-text", text: "My List:"}),
        new Button({key: "less-button", onClick: () => {me.count--}, text: "Less"}),
        new Button({key: "more-button", onClick: () => {me.count++}, text: "More"}),
        new List({key: "root-list", count: this.count})
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
    children.push(new Item({key: "first-item", text: "Foo " +  this.count}));
    if (this.count > 1) {
      children.push(new List({key: "rest-list", count: this.count - 1}));
    }
    return new Row({key:"list-row", children: children });
  }
}

export class Item extends Flow {
  setProperties({text}) {
    this.text = text;
    this.on = true;
  }

  build() {
    // log("rebuilding item");
    const me = this; 
    return new Row({key: "item-row", 
      children: [
        // new Text({key: "text", text: me.on ? "on" : "off"}),
        // new Button({key: "less", onClick: () => {me.on = !me.on}, text: "toggle"}),
        new Text({key: "text2", text: me.text})
      ]});
  }
}

