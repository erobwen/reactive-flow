import { observable, Flow, flow, repeat, observableDeepCopy } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField, button, flexGrowShrinkStyle, checkboxInputField, div, filler } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { reBuildDomNodeWithChildrenAnimated } from "../flow.DOMTarget/DOMAnimation";

const log = console.log;

/**
 * Flow definitions
 */

export const serverData = {
  person: {
    name: "Some Name",
    adress: {
        adress: "Some Street 42",
        zipCode: "1234", 
        city: "Smartville"
    },
    age: 18,
    luggages: [],
    fellowTravellers: false
  },
  fellowTravellers: []
};

const panel = flow("panel", ({ children }) =>
  div({key: "panel", children, style: {borderRadius: "15px", backgroundColor: "#eeeeee", borderColor: "#cccccc", borderStyle: "solid", borderWidth: "1px", padding: "10px"}})
);

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
    const editedPerson = this.editData.person;
    const saveData = {
      person: {
        name: editedPerson.name,
        age: editedPerson.age,
      } 
    }
    if (this.isAdult) saveData.person.occupation = editedPerson.occupation;
    return saveData; 
  }

  build() {
    const data = this.editData;
    const person = data.person;
    return row(
      column(
        text("Traveler Information", {style: {fontSize: "20px", paddingBottom: "10px"}}),
        new TravelerForm({traveler: person, isFellowTraveller: false}),
        row(
          filler(),
          button({text: "Add fellow traveller", onClick: () => {}}),
          {style: {marginTop: "30px"}}
        ),

        // row(
        //   button({text: "Send", onClick: () => { alert("sending: \n" + JSON.stringify(this.getSaveData()))}}, ),
        //   {style: {marginTop: "30px"}}
        // ),
        filler(),
        {
          style: {padding: "30px", height: "100%"}
        }
        // (person.fellowTravellers) &&
        //   text("Fellow Travelers", {style: {fontSize: "20px", paddingBottom: "10px", paddingTop: "10px"}}),
        // this.isAdult && textInputField("Occupation", () => person.occupation, newOccupation => { person.occupation = newOccupation }), 
        // row(
        //   text(this.isAdult ? "(Adult)" : "(Child)", {style: {padding: "4px"}})
        // ),
        // , {inputProperties: {style: {width: "50px"}}
      ), 
      filler(),
      column(
        text(JSON.stringify(this.editData, null, 4)),
        {style: {borderLeft: "1px", borderLeftStyle: "solid", borderLeftColor: "lightgray", backgroundColor: "#eeeeee"}}
      ),
      {style: flexGrowShrinkStyle}
    );
  }
}

export class TravelerForm extends Flow {
  setProperties({traveler, isFellowTraveller}) {
    this.traveler = traveler; 
    this.isFellowTraveller = isFellowTraveller;
  }  
  
  build() {
    const traveler = this.traveler;
    return panel(
      textInputField("Name", traveler, "name"),
      column(
        textInputField("Adress", traveler.adress, "adress"),
        textInputField("Zip code", traveler.adress, "zipCode"),
        textInputField("City", traveler.adress, "city"),
        this.traveler.luggages.map(luggage => new LuggageForm({luggage})),
        row(filler(), button("Add Luggage", {onClick: () => {this.traveler.luggages.push({weight: 1, type: "bag"})}}), {style: {marginTop: "10px"}}),
        {style: {paddingTop: "10px"}}
      ),
      // !this.isFellowTraveller && checkboxInputField("Fellow Travellers", traveler, "fellowTravellers"),
    );
  }
}

export class LuggageForm extends Flow {
  setProperties({luggage}) {
    this.luggage = luggage;
  }

  build() {
    return panel(
      row(
        numberInputField("Weight", this.luggage, "weight", {unit: "kg"}),
        
        button("x", {onClick: () => {this.creator.traveler.luggages.remove(this.luggage)}})
      )
    );
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
