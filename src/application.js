import { Flow, Text, Row } from "./flow/Flow";
const log = console.log;

export class TestComponent extends Flow {

  setProperties({}) {
  }

  onReBuildCreate() {
    // Lifecycle function for doing costly things, like opening up connections etc.
    console.log("created!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }

  onReBuildRemove() {
    this.repeater.dispose();
  }

  build() {
    log("build test component")
    return new Row({
      children: [
        new Text({text: "Foo"}),
        new Text({text: "Foo"}),
        new Text({text: "Bar"})
      ]
    });
  }
}
