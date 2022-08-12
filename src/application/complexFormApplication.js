import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { reBuildDomNodeWithChildrenAnimated } from "../flow.DOMTarget/DOMAnimation";

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
    // this.transitionAnimations = reBuildDomNodeWithChildrenAnimated; 
  }

  setState() {
    this.showAdress = false; 
    this.derrive(() => {
      this.isAdult = typeof(this.model.person.age) === "number" && this.model.person.age >= 18; 
    });
  }

  // provide() {
  //   return ["transitionAnimations"];
  // }

  build() {
    const person = this.model.person;

    return column(
      textInputField("Name", () => person.name, newName => { person.name = newName }),
      row(
        numberInputField(
          "Age", 
          () => person.age.toString(), 
          newAge => { person.age = parseInt(newAge) }, 
          {inputProperties: {style: {width: "50px"}}}),
        text(person.age >= 18 ? "(Adult)" : "(Child)", {style: {padding: "4px"}})
      ),
      person.age >= 18 && textInputField("Occupation", () => person.occupation, newOccupation => { person.occupation = newOccupation }), 
      {
        style: {padding: "30px"}
      }
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
