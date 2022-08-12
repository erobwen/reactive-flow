import { observable, Flow, flow, repeat, observableDeepCopy } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField, button, flexGrowShrinkStyle } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { reBuildDomNodeWithChildrenAnimated } from "../flow.DOMTarget/DOMAnimation";

const log = console.log;

/**
 * Flow definitions
 */

const serverData = {
  person: {
    name: "Some Name",
    adress: {
        street: "",
        number: "",
        zipCode: "", 
        city: ""
    },
    age: 18,
    occupation: ""
  }
};


export class ComplexForm extends Flow {

  setProperties({serverData}) {
    this.editData = observableDeepCopy(serverData);
    log(this.editData);
  }

  setState() {
    this.showAdress = false; 
    this.derrive(() => {
      this.isAdult = this.editData.person.age >= 18; 
    });
  }

  getSaveData() {
    // const edited = edited.name
    // return {
    //   person: editData.name
    // }
  }

  build() {
    const person = this.editData.person;
    return column(
      textInputField("Name", person, "name"),
      row(
        numberInputField("Age", person, "age", {inputProperties: {style: {width: "50px"}}}),
        text(this.isAdult ? "(Adult)" : "(Child)", {style: {padding: "4px"}})
      ),
      this.isAdult && textInputField("Occupation", () => person.occupation, newOccupation => { person.occupation = newOccupation }), 
      row(
        button({text: "Send", onClick: () => { alert("sending: \n" + JSON.stringify(this.getSaveData()))}}, ),
      ),
      row(
        {style: flexGrowShrinkStyle}
      ),
      {
        style: {padding: "30px", width: "100%", height: "100%"}
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
    serverData, 
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}
