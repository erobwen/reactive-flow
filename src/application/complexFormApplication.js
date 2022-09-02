import { observable, Flow, flow, repeat, observableDeepCopy } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField, button, flexGrowShrinkStyle, checkboxInputField, div, filler } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */

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

export const initialData = {
  traveler: initialTraveler,
  fellowTravellers: []
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
      div(
        div(
          text("Traveler Information", {style: {fontSize: "20px", paddingBottom: "10px"}}),
          new TravelerForm({traveler, isFellowTraveller: false}),
          column({
            children: this.editData.fellowTravellers.map(traveler => new TravelerForm({key: "id-" + traveler.causality.id, traveler, isFellowTraveller: true})),
            animateChildren: true  
          }),
          row(
            filler(),
            button({text: "Add fellow traveller", onClick: () => {this.editData.fellowTravellers.push(observable(createTraveler(true)))}}),
            {style: {marginTop: "30px"}}
          ),
          filler(),
          { style: {padding: "30px"}}
        ),
        { style: {boxSizing: "border-box", height: "100%", overflowY: "scroll"}}
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

export class SimpleDrawer extends Flow {
  setProperties({openButtonLabel = "Open", closeButtonLabel = "Close", isOpen, toggleOpen, content}) {
    this.openButtonLabel = openButtonLabel,
    this.closeButtonLabel = closeButtonLabel,
    this.isOpen = isOpen,
    this.toggleOpen = toggleOpen,
    this.content = content;
  }
  build() {
    return column(
      button(this.isOpen ? this.closeButtonLabel : this.openButtonLabel, {style: {margin: "5px"}, onClick: () => this.toggleOpen()}),
      column({key: "luggage", children: [this.isOpen ? this.content : null], animateChildren: true })
    );
  }
}

export class TravelerForm extends Flow {
  setProperties({traveler, isFellowTraveller}) {
    this.traveler = traveler; 
    this.isFellowTraveller = isFellowTraveller;
  }  

  setState() {
    this.showLuggage = true; 
  }
  
  build() {
    const traveler = this.traveler;
    return panel(
      // {key: "traveler-pannel"},// TODO: Why will it not dispose this child if no key
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
            textInputField("City", traveler.adress, "city"), 
          ),
      ),
      {
        luggages: 
          new SimpleDrawer({
            key: "luggages-drawer",
            closeButtonLabel: "Hide luggage",
            openButtonLabel: "Show luggage",
            toggleOpen: () => { this.showLuggage = !this.showLuggage },
            isOpen: this.showLuggage,
            content: column({key: "luggage-panel"},
              column({
                key: "luggage-list",
                children: this.traveler.luggages.map(luggage => new LuggageForm({key: "id-" + luggage.causality.id, luggage})),
                animateChildren: true
              }),
              row({key: "add-luggage-row"}, 
                button("Add Luggage", 
                  {
                    key: "add-luggage",
                    onClick: () => {this.traveler.luggages.push(observable({weight: 1, type: "bag"}))}
                  }
                ),
                filler()
              )
            )
          }), 
        button: button("Add luggages", {
          key: "add-first-luggage", 
          onClick: () => {
            this.traveler.luggages.push(observable({weight: 1, type: "bag"}));
            this.showLuggage = true;
          }}) 
      }[this.traveler.luggages.length ? "luggages" : "button"]
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
        filler(),
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