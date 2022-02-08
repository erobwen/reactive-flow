Note: This is a compound repository where I experiment with Flow together with other tech, Flow will eventually move to a clean Flow repository with only Flow. 

# Flow - Reactive DOM Rendering and State Management

![Alt text](/src/flow/flow.PNG?raw=true "Flow Logotype")

* State of the art reactive technologies, with several technical advantages over frameworks such as VueX and React. 
* Very little boilerplate code. 
* A very flexible component model. No arbitrary rules about what code can change what state.  
* Integrated and fully automated state handling (equivalent to MobX / causalityjs). Modify any state anywhere at any time with consistent updates.
* Minimal updates of DOM
* No dependency on template litterals, jsx or CSS, just plain Javascript with direct DOM manipulation! 
* Powerful bottom up rendering. Render a child before a parent is rendered to take measures for fine layout. Can be used for WYSIWYG word-processing and advanced responsive UI-behaviors.  
* DOM independent component model, future potential for portability to other platforms besides Web. 
* Component key-paths, for convenient UI test automation and debugging.
* Based on causalityjs (similar to MobX).  

# Running the demo
npm install
npm start

# TODO
TODO: Reconsider use of webpack now that we do not need jsx? Call webpack from within a script instead to avoid global install. 
TODO: Is there a way to avoid observation of temporary objects during rebuild? Is it a problem?
TODO: How to deal with modal dialogs.

# Random Notes
npm install -g webpack
npm install -g webpack-cli
npm install -g webpack-dev-server -->