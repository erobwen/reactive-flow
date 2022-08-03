import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, textField, column } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

const model = observable({
  person: observable({
    name: "",
    adress: observable({
        street: "",
        number: "",
        zipCode: "", 
        city: ""
    }),
    age: 0,
    occupation: ""
  })
});

export class ComplexForm extends Flow {

  setProperties({model}) {
    this.model = model;
  }

  setState() {
    this.showAdress = false; 
    this.derrive(() => {
      this.isAdult = typeof(this.model.person.age) === "number" && this.model.person.age >= 18; 
    });
  }

  build() {
    return column(
      textField("Name", () => this.model.person.name, newName => { this.model.person.name = newName })
    );
  }
}

export class AdressForm extends Flow {
    setState() {}
  
    build() {
      return null
  }
}


/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startComplexFormApplication() {
  const complex = new ComplexForm({
    key: "root",
    model, 
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}
