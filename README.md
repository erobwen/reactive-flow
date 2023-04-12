Note: This is a compound repository where I experiment with Flow together with other tech, Flow will eventually move to a clean Flow repository with only Flow. 

# Flow - Reactive DOM Rendering and State Management

![Logotype](/src/document/flow.PNG?raw=true "Flow Logotype")

* Very simple, easy to use and very little boilerplate code.

Excellent State Handling: 

* State of the art reactive technologies using ES6 Proxies. 
* Integrated, transparent and fully automated state handling (equivalent to MobX / causalityjs) with safe direct manipulation of state. 
* The component state works by the same principles as the as the model state, so you can direct manipulate either component state or model state. 
* No arbitrary rules about what code can change what state. We believe in the programmers ability to use this wisley. 
* Consistent and minimal updates of state and DOM as a consequence of state change. 

Pure Javascript: 

* No dependency on template litterals, jsx, Typescript or CSS, just plain Javascript with direct DOM manipulation! 
* Support for Modular Reactive Programmatic, Responsive and Data driven Layout. MRP-RDDL. The most powerful layout concept for responsive and data driven layout that there can exist. More powerful than using CSS. 

Supreme Animation Support: 

* Integrated generalized global transition animations, using the FLIP animation technique. Simply activate animation with "animate: true" on your componen for a smooth lifecycle. 
* Fully customizeable animations. 

Possibly explicit component life cycle handling: 

* Typically component structures are built declarativley, however, you can take control over the life cycle of sub components in two ways: 
    ** Use keys to persist the state of a sub component. 
    ** Explicitly build and dispose a subcomponent in the setState/disposeState lifecycle functions of a component. 0
* Explicitly managing the lifecycle of child components has a number of possibilities. 
* A component can move from one part of the screen to another while maintaining its state. 
* Off-screen components is now a possibility. Allow components to live with a state off screen, for example usable for fast tab-panel switching where all dom elements of the hidden tab component are never deallocated.  
* Bottom up rendering capabilities: Finalize and force reflow of a child before a parent is rendered to take measures for fine control layout. Can be used for WYSIWYG word-processing and advanced responsive UI-behaviors.  

Future Safe: 

* DOM independent component model, future potential for portability to other platforms besides Web. 

Basic features: 

* Property inheritance for making it simple to pass down properties in the component hierarchy. (fullfills same role as Contexts in React)  
* Component key-paths, for convenient programmatic manipulation of components, UI test automation and debugging.
* Component stage portals. Since portals works on the component level, the content of a portal can be in place before the portal has mounted. This is an improvement over React that needs to get hold of a node with a ref on mounting, before that node can be used as a portal, this forces React to populate the portal in a second redering pass. With Flow, the content of a portal work more in line with the contents of any other container, allowing a more smooth user experience.  

Overview: 

* Based on causalityjs (similar to MobX).  
* Lightweight < 100 kb.
* Open source 


# Running the demo

```console
npm install
npm start
```
To see the demo application code, look at the file /src/application.js.


# Example

This example showcases some basic principles of Flow. It shows two ways of defining flow components, either by inheriting from "Flow" or using the "flow" function. It also showcases how you can direct manipulate flow properties from outside the flow, and how the flow can deeply observe data strutures and have the built UI reflect changes in them. 


```js
import { observable, Flow, flow, repeat } from "../flow/Flow";
import { text, row as basicRow } from "../flow.components/BasicFlowComponents";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";

const log = console.log;

/**
 * Flow definitions
 */
export class HelloWorld extends Flow {
  setState() {
    this.helloText = observable({ value: "..." });
    this.emphasis = false;
    this.derrive(() => {
      // In setState you can establish reactive relations between different properties using this.derrive(). You could accomplish the same thing using causality/repeat but this.derrive takes care of disposing the repeater for your convenience. 
      // Note that this repeater even decorates the observable helloText object with additional data, but we could have added more properties to this as well, it would make no difference. 
      this.helloText.withComma = this.helloText.value.length > 4 ? this.helloText.value + "," : this.helloText.value;
    });
  }

  provide() {
     // Makes all children/grandchildren inherit the helloText and emphasis properties! Define withdraw() to remove inherited properties.
    return ["helloText", "emphasis"];
  }

  build() {
    return myRow(
      "row",
      hello("hello"), // No need to pass parameters as it will be inherited.
      text({ key: "spacer", text: " " }),
      new World("world", { exclamationCharacter: "!" }) // This is how we create child flow components with a key "world" and pass them properties.
    );
  }
}

// Stateless child flow (compact definition)
const hello = flow("hello", ({ helloText }) =>
  text({ key: "text", text: helloText.withComma })
);

// Statefull child flow
class World extends Flow {
  setProperties({ exclamationCharacter }) {
    // This life cycle function is optional, but can be used to set default values for properties.
    this.exclamationCharacter = exclamationCharacter ? exclamationCharacter : "?";
  }

  setState() {
    // In this lifecycle function you can setup state and obtain expensive resources. You can let go of these resources in disposeState().
    this.worldText = "";
  }

  build() {
    return myRow(
      "row",
      text({ key: "text", text: this.worldText }),
      exclamationMark("!", {
        on: this.emphasis,
        character: this.exclamationCharacter,
      })
    );
  }
}

// Another stateless child flow
const exclamationMark = flow("exclamationMark", ({ on, character }) =>
  on ? text({ text: character }) : null
);

// My own dynamically/reactivley styled row
const myRow = flow("myRow", ({ style, children, emphasis }) => {
  if (!style) style = {};
  if (emphasis) style.fontSize = "20px"; // Note how the emphasis property is provided/inherited from the root component.
  return basicRow("primitive", { children, style });
});

/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startHelloWorld() {
  // Activate continous build/integration to DOMFlowTarget.
  const helloWorld = new HelloWorld()
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(helloWorld);

  /**
   * Async modification
   */

  // Set "Hello" deep inside observable data structure
  setTimeout(() => {
    log("----------------------------------");
    helloWorld.helloText.value = "Hello";
  }, 1000);

  // Set state property to "world!", using a component path to access child component.
  setTimeout(() => {
    log("----------------------------------");
    helloWorld.getChild("world").worldText = "world";
  }, 2000);

  // Exclamation mark!
  setTimeout(() => {
    log("----------------------------------");
    helloWorld.emphasis = true;
  }, 3000);
}
```

## Flow objects
As you can see, it is all just Javascript objects, inheriting from Flow. These Flow objects will build to other Flow objects, that eventually will build to PrimitiveFlow components that are then rendered by the DOM renderer. An application would typically define their own set of Flow components, such as buttons and widgets, that correspond to the prefered style and behavior of that application. So instead of .css classes, you build flow components. And if you need to modularize things even further, then you just use plain Javascript modules as style components. The benefit of doing this, is that everything becomes reactive, even the styles!

## State handling
To handle the state of a javascript object, just call the function "observable(object)" to make any javascript object observable, including arrays. If you do this to all of your model objects, then your user interface will respond to changes in them! The Flow objects themselves are also observables in the same way, so you can change their state at any time, and the user interface will update accordingly!  

## Render engine and build function
When build is run for a component, child objects are created, but in the case where they use the same key as a child object from a previous run of build, the new object will assume the identity of the previously created object. This way, even if build is run many times, re-creating the same child components identified by key, the established object identities for these children will always be maintained, so that children can maintain their state even if the parent is running build.  

## Programmatic Reactive Layout Theory

The following slide shows the theory and philosopy behind Flow, in particular the idea behind Programmatic Reactive Layout and the No CSS principles.
 
https://docs.google.com/presentation/d/13E7E8TzRBoGBJ5BhVV78-s73AnYHnI4MrQ233xihZdY/edit?usp=sharing

