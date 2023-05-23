
# Next

TODO: Warning when trying to animate inline divs. Need to be blocks!
TODO: div() needs to read animate property
TODO: Move back some functionality from unobservable to state?  
TODO: Test fragmented flows.
TODO: Work on children as array or flow: Styled button breaks if children are not in list 
TODO: Move attribute extraction to primtives + warning of unused property?
TODO: Make causality throw an error if same build id is used in the same build. 

# Needs examination
CONSIDER What happens with a model built in the build function of a flow. Will it be re-created using shape analysis... it will be re-created and re set!... So you cant do it?
CONSIDER Investigate possibility of creating child flows in the state callback. 
CONSIDER use setState on primitive?
INVESTIGATE: build repeater should not be dependent on parentPrimitive.
INVESTIGATE: parentPrimitive in general. Is the current solution good?
INVESTIGATE: is dispose really doing its job. Investigate why the new modal implementation failed. 
INVESTIGATE: Should we really dispose of a keyed component that is not used???... 

# After first release
EPIC: Alternative Flow Target Demo, word-processor  
EPIC: Programmatic Reactive Layout demo
INVESTIGATE: Is there a way to avoid observation of temporary objects during rebuild? Is it a problem?
INVESTIGATE: Reconsider use of webpack now that we do not need jsx? Call webpack from within a script instead to avoid global install. 

# Random Notes
npm install -g webpack
npm install -g webpack-cli
npm install -g webpack-dev-server -->