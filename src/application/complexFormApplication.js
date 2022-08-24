import { observable, Flow, flow, repeat, observableDeepCopy } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField, button, flexGrowShrinkStyle, checkboxInputField, div, filler } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { reBuildDomNodeWithChildrenAnimated } from "../flow.DOMTarget/DOMAnimation";

const log = console.log;

/**
 * Flow definitions
 */

export const initialData = {
  traveler: {
    name: "Some Name",
    passportNumber: "",
    adress: {
      adress: "Some Street 42",
      zipCode: "1234", 
      city: "Smartville"
    },
    isChild: false,
    luggages: []
  },
  fellowTravellers: []
};

const initialTraveler = {
  name: "", 
  passportNumber: "",
  adress: {
    adress: "",
    zipCode: "", 
    city: ""
  },
  isFellowTraveller: false,
  isChild: false,
  age: 1,
  luggages: []
};

function createTraveler(isFellowTraveller) {
  const result = observableDeepCopy(initialTraveler);
  result.isFellowTraveller = isFellowTraveller;
  return result; 
}

const panel = flow("panel", ({ children }) =>
  div({key: "panel", children, style: {marginBottom: "10px", borderRadius: "15px", backgroundColor: "#eeeeee", borderColor: "#cccccc", borderStyle: "solid", borderWidth: "1px", padding: "10px"}})
);

export class ComplexForm extends Flow {

  setProperties({initialData}) {
    this.editData = observableDeepCopy(initialData);
    log(this.editData);
  }

  build() {
    const data = this.editData;
    const traveler = data.traveler;
    return row(
      column(
        text("Traveler Information", {style: {fontSize: "20px", paddingBottom: "10px"}}),
        new TravelerForm({traveler, isFellowTraveller: false}),
        column({
          children: this.editData.fellowTravellers.map(traveler => new TravelerForm({key: traveler.causality.id, traveler, isFellowTraveller: true})),
          transitionAnimations: reBuildDomNodeWithChildrenAnimated  
        }),
        row(
          filler(),
          button({text: "Add fellow traveller", onClick: () => {this.editData.fellowTravellers.push(observable(createTraveler(true)))}}),
          {style: {marginTop: "30px"}}
        ),
        filler(),
        { style: {padding: "30px", height: "100%"}}
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
      traveler.isFellowTraveller &&
        row(
          filler(),
          button("x", {onClick: () => {this.creator.editData.fellowTravellers.remove(this.traveler)}})
        ),
      textInputField("Name", traveler, "name"),
      textInputField("Passport", traveler, "passportNumber"),
      this.isFellowTraveller && checkboxInputField("Is Child", traveler, "isChild"),
      traveler.isChild && numberInputField("Age", traveler, "age", {unit: "years"}),
      column(
        !traveler.isFellowTraveller &&
          column(
            textInputField("Adress", traveler.adress, "adress"),
            textInputField("Zip code", traveler.adress, "zipCode"),
            textInputField("City", traveler.adress, "city")
          ),
        column({
          children: this.traveler.luggages.map(luggage => new LuggageForm({key: luggage.causality.id, luggage})),
          transitionAnimations: reBuildDomNodeWithChildrenAnimated  
        }),
        row(
          filler(), 
          button(
            "Add Luggage", 
            {
              key: "add-luggage",
              onClick: () => {this.traveler.luggages.push(observable({weight: 1, type: "bag"}))}
            }
          ),
        {style: {paddingTop: "10px"}}
        ),
      )
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
  new ComplexForm({
    key: "root",
    initialData, 
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();
}