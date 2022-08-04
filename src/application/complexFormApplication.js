import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, textInputField, row } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

const model = observable({
  person: observable({
    name: "Some Name",
    adress: observable({
        street: "",
        number: "",
        zipCode: "", 
        city: ""
    }),
    age: 18,
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
    const person = this.model.person;

    return column(
      textInputField("Name:", () => person.name, newName => { person.name = newName }),
      row(
        textInputField("Age:", () => person.age.toString(), newAge => { person.age = parseInt(newAge) }),
        text(person.age >= 18 ? "(Adult)" : "(Child)")
      ),
      person.age >= 18 ? textInputField("Occupation:", () => person.occupation, newOccupation => { person.occupation = newOccupation }) : null, 
      {style: {padding: "30px"}}
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
