Note: This is a compound repository where I experiment with Flow together with other tech, Flow will eventually move to a clean Flow repository with only Flow. 

# Flow - Reactive DOM Rendering and State Management

![Logotype](/src/document/flow.PNG?raw=true "Flow Logotype")

* Minimal update dom rendering (equivalent functionality to React).

* Integrated and automated state handling. 
    * Very simple, just call "model({...yourData})" to create model data. 
    * Based on ES6 Proxies that tracks all changes and dependencies (equivalent functionality to MobX). 
    * Safe model direct manipulation, your GUI will be automatically updated.
    * Safe view model and component direct manipulation.
    * No need for observers, reducers, global data stores etc.  

* Sophisticated global transition animation support. 
    * Easy to use, simply add property "animation: true" to your component. 
    * Fully configurable. 
    * Transition animations when components appear, dissapear or are moved accross your user interface. 
    * Uses FLIP animation technique to make components move to new locations.
    * Support for infered data that is automatically updated.
    * Uses extra filler divs to make containers of animated objects animate their size as well when applicable.

* Javascript first principle.
    * Javascript code instead of configuration.
    * Javascript used for styling
    * Javascript code used for responsiveness. 
    * No dependency on template litterals, jsx, Typescript HTML files or CSS, just plain Javascript with direct DOM manipulation! 

* Possibly explicit component life cycle handling: 
    * Off-screen components is now a possibility. Allow components to live with a state off screen, for example usable for fast tab-panel switching where all dom elements of the hidden tab component are never deallocated.
    * A component can move from one place in the DOM structure to another while maintaining its state. 
    * Three ways to persist and maintain the state of a sub component: 
        * Rendered components will be persisted implicitly using pattern matching of the build structure. 
        * Use keys while rendering to identify and persist the state of a sub component. 
        * Explicitly build and dispose a subcomponent in the setState/disposeState lifecycle functions of a parent component for full control.
  
* Bottom up rendering capabilities: 
    * Finalize and force reflow of a child before a parent is rendered to take measures and do fine control layout. Can be used for advanced responsive UI-behaviors.  
    * Support for Modular, Data Driven, Reactive and Programmatic Responsiveness. The combination of all at the same time. 
    * More powerful than anything that can be done with CSS. 

* Basic features: 
    * Property inheritance for making it simple to pass down properties in the component hierarchy. (fullfills same role as Contexts in React)  
    * Component key-paths, for convenient programmatic manipulation of components, UI test automation and debugging.
    * Component stage portals. Since portals works on the component level, the content of a portal can be in place before the portal has mounted. This is an improvement over React that needs to get hold of a node with a ref on mounting, before that node can be used as a portal, this forces React to populate the portal in a second redering pass. With Flow, the content of a portal work more in line with the contents of any other container, allowing a more smooth user experience.  

* Technical features: 
    * Based on causalityjs (similar to MobX).  
    * Lightweight < 100 kb.
    * Open source 
    * DOM independent component model, this would make it easier to make port support other platforms besides Web. 


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
 ...

 // Update example
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
