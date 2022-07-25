Note: This is a compound repository where I experiment with Flow together with other tech, Flow will eventually move to a clean Flow repository with only Flow. 

# Flow - Reactive DOM Rendering and State Management

![Logotype](/src/document/flow.PNG?raw=true "Flow Logotype")

* State of the art reactive technologies, with several technical advantages over frameworks such as VueX and React. 
* Very simple, easy to use and very little boilerplate code. 
* A very flexible component model. No arbitrary rules about what code can change what state. Components are javascript objects (ES6 Proxies really), and changing their javascript properties is the same as changing their Flow properties. 
* Property inheritance for making it simple to pass down properties in the component hierarchy.  
* Integrated and fully automated state handling (equivalent to MobX / causalityjs). Modify any state anywhere at any time.
* Consistent and minimal updates of stte and DOM
* No dependency on template litterals, jsx, Typescript or CSS, just plain Javascript with direct DOM manipulation! 
* Bottom up rendering capabilities: Finalize and render a child before a parent is rendered to take measures for fine layout. Can be used for WYSIWYG word-processing and advanced responsive UI-behaviors.  
* DOM independent component model, future potential for portability to other platforms besides Web. 
* Component key-paths, for convenient programmatic manipulation of components, UI test automation and debugging.
* Based on causalityjs (similar to MobX).  
* Lightweight < 100 kb.
* Open source 


# Running the demo

```console
npm install
npm start
```
To see the demo application code, look at the file /src/application.js.


# Hello World

This simple hello world example showcases some basic principles of Flow. It shows two ways of defining flow components, either by inheriting from "Flow" or using the "flow" function. It also showcases how you can direct manipulate flow properties from outside the flow, and how the flow can deeply observe data strutures and have the built UI reflect changes in them. 


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
  const helloWorld = new HelloWorld({
    key: "root",
    target: new DOMFlowTarget(document.getElementById("flow-root")),
  }).activate();


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


# TODO
TODO: Reconsider use of webpack now that we do not need jsx? Call webpack from within a script instead to avoid global install. 
TODO: Is there a way to avoid observation of temporary objects during rebuild? Is it a problem?
TODO: Integrate shape analysis into causality rebuild functionality. 
TODO: Improve debug printouts on rebuild. (disposed and established objects)
TODO: Additional work on modals and popovers 
TODO: Programmatic Reactive Layout demo
TODO: Animaiton Demo
TODO: Alternative Flow Target Demo  
TODO: Priority levels in causality.


# Random Notes
npm install -g webpack
npm install -g webpack-cli
npm install -g webpack-dev-server -->