Note: This is a compound repository where I experiment with Flow together with other tech, Flow will eventually move to a clean Flow repository with only Flow. 

# Flow - Reactive DOM Rendering and State Management

![Alt text](/src/flow/flow.PNG?raw=true "Flow Logotype")

* State of the art reactive technologies, with several technical advantages over frameworks such as VueX and React. 
* Very little boilerplate code. 
* A very flexible component model. No arbitrary rules about what code can change what state. Components are javascript objects, and changing their javascript properties is the same as changing their Flow properties. 
* Property inheritance for making it simple to pass down properties in the component hierarchy.  
* Integrated and fully automated state handling (equivalent to MobX / causalityjs). Modify any state anywhere at any time with consistent updates.
* Minimal updates of DOM
* No dependency on template litterals, jsx or CSS, just plain Javascript with direct DOM manipulation! 
* Powerful bottom up rendering. Render a child before a parent is rendered to take measures for fine layout. Can be used for WYSIWYG word-processing and advanced responsive UI-behaviors.  
* DOM independent component model, future potential for portability to other platforms besides Web. 
* Component key-paths, for convenient UI test automation and debugging.
* Based on causalityjs (similar to MobX).  
* Probably very lightweight? (I haven´t tried ot minimize it yet). In full text it is only around 10kb for Flow (250 lines of code) and an additional 50kb for causality. 


# Running the demo

```console
npm install
npm start
```
To see the demo application code, look at the file /src/application.js.


# Hello World

This simple hello world example showcases some basic principles of Flow. It shows how 

```js

import { observable, Flow } from "./flow/Flow";
import { text, row } from "./flow/PrimitiveFlow";
import { DOMFlowTarget } from "./flow/DOMFlowTarget.js";

export class HelloWorld extends Flow {
  setState() {
    this.hello = observable({value: ""});
  }

  build() {
    this.provide("hello"); // Makes all children/grandchildren inherit the value of the hello property! 

    return row("row",
      new Hello("hello"),
      text({text: " "}),
      new World("world", {world: this.world})
    );
  }
}

export class Hello extends Flow {
  build() {
    return text("text", {text: this.hello.value});
  }
}

export class World extends Flow {
  setState() {
    this.world = "";
  }

  build() {
    return text("text", {text: this.world});
  }
}

// Activate continous build/integration to DOMFlowTarget.
const helloWorld = new HelloWorld({
  target: new DOMFlowTarget(document.getElementById("flow-root")) 
}).activate();

// Set "Hello" deep inside observable data structure
setTimeout(() => {
  helloWorld.hello.value = "Hello";
} , 1000)

// Set state property to "world!", using a component path to access child component.
setTimeout(() => {
  helloWorld.getChild("world").world = "world!";
} , 2000)
```

## Flow objects
As you can see, it is all just Javascript objects, inheriting from Flow. These Flow objects will build to other Flow objects, that eventually will build to PrimitiveFlow components that are then rendered by the DOM renderer. An application would typically define their own set of Flow components, such as buttons and widgets, that correspond to the prefered style and behavior of that application. So instead of .css classes, you build flow components. And if you need to modularize things even further, then you just use plain Javascript modules as style components. The benefit of doing this, is that everything becomes reactive, even the styles!

## State handling
To handle the state of a javascript object, just call the function "observable(object)" to make any javascript object observable, including arrays. If you do this to all of your model objects, then your user interface will respond to changes in them! The Flow objects themselves are also observables in the same way, so you can change their state at any time, and the user interface will update accordingly!  

## Render engine and build function
When build is run for a component, child objects are created, but in the case where they use the same key as a child object from a previous run of build, the new object will assume the identity of the previously created object. This way, even if build is run many times, re-creating the same child components identified by key, the established object identities for these children will always be maintained, so that children can maintain their state even if the parent is running build.  

# TODO
TODO: Reconsider use of webpack now that we do not need jsx? Call webpack from within a script instead to avoid global install. 
TODO: Is there a way to avoid observation of temporary objects during rebuild? Is it a problem?
TODO: How to deal with modal dialogs.

# Random Notes
npm install -g webpack
npm install -g webpack-cli
npm install -g webpack-dev-server -->