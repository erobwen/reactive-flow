import { observable, Flow, flow, repeat, transaction, model } from "../flow/Flow";
import { text, column, textInputField, row, numberInputField, flexGrowShrinkStyle, checkboxInputField, div, filler } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { button } from "../flow.components/StyledFlowComponents";

const log = console.log;

/**
 * Data model. 
 * Plain Javascript except call to "model()"
 */

export const initialData = model({
  traveler: createInitialTraveler(),
  fellowTravellers: []
}, true);

function createInitialTraveler() {
  return {
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
}

function createTraveler(isFellowTraveller) {
  const result = model(createInitialTraveler(), true);
  result.isFellowTraveller = isFellowTraveller;
  return result; 
}


/**
 * Cost calculator. Plain Javascript. Cost calculator. 
 */


function calculateCost(data) {
  let cost = 0;
  function addLuggageCost(luggage) {
    cost += (luggage.weight <= 1) ? 20 : 40; 
  }

  function addTravelerCost(traveler) {
    cost += traveler.isChild ? 100 : 200;
    traveler.luggages.forEach(luggage => addLuggageCost(luggage));
  }

  addTravelerCost(data.traveler);
  data.fellowTravellers.forEach(traveler => addTravelerCost(traveler));
  return cost; 
}


/**
 * Travlers verifier. Plain Javascript, model verification. 
 */

 function verifyData(editData) {
  transaction(() => {
    let anyError = false; 
    anyError = verifyTraveler(editData.traveler, false) || anyError;
    editData.fellowTravellers.forEach(traveler => {anyError = verifyTraveler(traveler, true) || anyError});
    editData.anyError = anyError;
  });
}

function verifyTraveler(traveler, fellowTraveler) {
  let anyError = false; 
  if (!fellowTraveler) {
    anyError = verifyAdress(traveler.adress) || anyError;
  }
  anyError = verifyFieldNotEmpty(traveler, "name", "name") || anyError;
  anyError = verifyFieldNotEmpty(traveler, "passportNumber", "passport number") || anyError;
  return anyError; 
}

function verifyAdress(adress) {
  let anyError = false; 
  anyError = verifyFieldNotEmpty(adress, "adress", "adress") || anyError;
  anyError = verifyFieldNotEmpty(adress, "zipCode", "zip code") || anyError;
  anyError = verifyFieldNotEmpty(adress, "city", "city") || anyError;
  return anyError; 
}

function verifyFieldNotEmpty(object, property, requestedDataMessage) {
  if (object[property] === "") {
    object[property + "Error"] = "Please enter " + requestedDataMessage + ".";
    return true;
  } else {
    delete object[property + "Error"];
    return false;
  }
}


/**
 * Reusable components. Flow component definitions.
 */

const panel = flow("panel", ({ children }) =>
  div("panel", {children, style: {margin: "4px", borderRadius: "15px", backgroundColor: "#eeeeee", borderColor: "#cccccc", borderStyle: "solid", borderWidth: "1px", padding: "10px"}})
);

export class SimpleDrawer extends Flow {
 setProperties({openButtonLabel = "Open", closeButtonLabel = "Close", isOpen, toggleOpen, content}) {
    this.openButtonLabel = openButtonLabel;
    this.closeButtonLabel = closeButtonLabel;
    this.isOpen = isOpen;
    this.toggleOpen = toggleOpen;
    this.content = content;
 }
 build() {
  const buttonLabel = this.isOpen ? this.closeButtonLabel : this.openButtonLabel; 
  return column(
    button(buttonLabel, () => this.toggleOpen(), {style: {margin: "5px"}}),
    column("contents", {children: [this.isOpen ? this.content : null], animateChildren: true })
  );
 }
}


/**
 * Components. Flow component definitions.
 */

export class ComplexForm extends Flow {

  setProperties({initialData}) {
    this.name = "Complex Form";
    this.editData = initialData;
  }
  
  setState() {
    this.shouldVerifyData = false;
    this.derrive(() => {
      if (this.shouldVerifyData) {
        verifyData(this.editData);
        if (!this.editData.anyError) {
          this.shouldVerifyData = false;
        }
      }
    });
  }

  build() {
    const data = this.editData;
    const traveler = data.traveler;

    function travelerString() {
      const count = data.fellowTravellers.length + 1;
      return (count === 1) ? "" : ("(" + count + " people)");
    }

    return (
      row(
        div("scrollPanel",
          column(
            // Header            
            text("Cost: " + calculateCost(data), {style: {marginBottom: "5px"}}),
            text("Traveler Information " + travelerString(), {style: {fontSize: "20px", paddingBottom: "10px"}}),

            // Traveler forms
            new TravelerForm({traveler, isFellowTraveller: false}),
            column({
              children: this.editData.fellowTravellers.map(traveler => new TravelerForm("id-" + traveler.causality.id, {traveler, isFellowTraveller: true})),
              animateChildren: true  
            }),

            // Add traveler button
            row(
              filler(),
              button("+ Traveler", () => this.editData.fellowTravellers.push(createTraveler(true)))
            ),

            // Submit button
            button("Submit", 
              () => {
                this.shouldVerifyData = true;
                if (!data.anyError) {
                  this.shouldVerifyData = false; 
                  alert("Sent form!\n" + JSON.stringify(this.editData, null, 4));
                }
              }, 
              {
                style: {marginTop: "30px"},
                disabled: data.anyError
              }),
            filler(),
            { style: {padding: "30px"}}
          ),
          { style: {boxSizing: "border-box", height: "100%", overflowY: "scroll"}}
        ),

        filler(),

        // Model Data Display 
        column(
          text(JSON.stringify(this.editData, null, 4)),
          {style: {borderLeft: "1px", borderLeftStyle: "solid", borderLeftColor: "lightgray", backgroundColor: "#eeeeee"}}
        ),
        {style: flexGrowShrinkStyle}
      )
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
      // Remove button
      row(
        filler(),
        button(" x ", () => {this.creator.editData.fellowTravellers.remove(this.traveler)})
      ).show(traveler.isFellowTraveller),

      // Traveler inforation
      textInputField("Name", traveler, "name"),
      textInputField("Passport", traveler, "passportNumber"),
      div({style: {height: "10px"}}),

      // Child info
      checkboxInputField("Is Child", traveler, "isChild").show(this.isFellowTraveller),
      numberInputField("Age", traveler, "age", {unit: "years", animate: true}).show(traveler.isChild),
      
      // Adress
      column(
        textInputField("Adress", traveler.adress, "adress"),
        textInputField("Zip code", traveler.adress, "zipCode"),
        textInputField("City", traveler.adress, "city"), 
        div({style: {height: "10px"}}),
      ).show(!traveler.isFellowTraveller),

      // Luggages 
      new SimpleDrawer("luggages-drawer", {
        animate: true,
        closeButtonLabel: "Hide luggage",
        openButtonLabel: "Show luggage (" + this.traveler.luggages.length + ")",
        toggleOpen: () => { this.showLuggage = !this.showLuggage },
        isOpen: this.showLuggage,
        content: column("luggage-panel",
          column("luggage-list", {
            children: this.traveler.luggages.map(luggage => new LuggageForm("id-" + luggage.causality.id, {luggage})),
            animateChildren: true
          })
        )
      }).show(this.traveler.luggages.length),

      // Add luggages button
      row("add-luggage",
        filler(),
        button(" + Luggage ", 
          () => {
            transaction(() => {
              this.traveler.luggages.push(model({weight: 1, type: "bag"}));
              this.showLuggage = true;
            });
          }),
        {
          animate: true
        }
      ).show(!this.traveler.luggages.length || this.showLuggage)
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
        button(" x ", () => {this.creator.traveler.luggages.remove(this.luggage)})
      )
    );
  }
}


/**
 * This is what you would typically do in index.js to start this app. 
 */

export function startComplexFormApplication() {
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(
    new ComplexForm({initialData})
  );
}