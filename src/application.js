import { Flow, Text, Row, Button, repeat, when } from "./flow/Flow";
const log = console.log;



export class TestComponent extends Flow {
  
  onReBuildCreate() {
    this.count = 1
    const me = this;

    repeat(() => { 
      let observe = me.count;
      log("---------- count -------------");
    })
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
  }
  
  onReBuildCreate() {
    const me = this;
    this.on = true;
    // repeat(() => {
    //   if (this.domElement) {
    //     log("Got an element!")
    //   }
    // })
    // when(() => {me.domElement}, 
    //   () => { 
    //     log("Got an element!") 
    //   });
  }

  build() {
    // log("rebuilding item");
    const me = this; 
    return new Row({key: "item-row", 
      children: [
        new Text({key: "text", text: me.on ? "on" : "off"}),
        new Button({key: "less", onClick: () => { log("---------- toggle on -------------");me.on = !me.on; }, text: "toggle"}),
        new Text({key: "item-text", text: me.text})
      ]});
  }
}

