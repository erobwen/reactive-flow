import { button, column } from "../flow.components/BasicFlowComponents";
import { Flow, model, observable, repeat } from "../flow/Flow";

class ToggleModel {
  constructor() {
    this.on = true; 
    return observable(this);
  }

  toggle() {
    this.on = !this.on
  }

  setOn() {
    this.on = true
  }

  setOff() {
    this.on = false
  }
}

class ExhaustableToggleModel extends ToggleModel {
  constructor() {
    super();
    this.clicksSinceReset = 0;
  }

  tooManyClicks() {
    return this.clicksSinceReset > 4;
  }

  toggle() {
    this.clicksSinceReset += 1;
    if (!this.tooManyClicks()) {
      super.toggle();
    }
  }

  reset() {
    this.clicksSinceReset = 0;
  }
}

export class ToggleView extends Flow {
  setState() {
    this.toggle = new ExhaustableToggleModel();
  }
  build() {
    console.log(this.toggle)
    return column(
      button("Switch Off", {onClick: () => {this.toggle.setOff()}}),
      button("Switch On", {onClick: () => {this.toggle.setOn()}}),
      !this.toggle.tooManyClicks() &&
        button(this.toggle.on ? "ON" : "OFF", {onClick: () => {this.toggle.toggle()}}),
      this.toggle.tooManyClicks() && 
        button("Reset", {onClick: () => this.toggle.reset()})
    )
  }
}