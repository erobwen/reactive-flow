# Needs examination
CONSIDER What happens with a model built in the build function of a flow. Will it be re-created using shape analysis... it will be re-created and re set!... So you cant do it?
CONSIDER Investigate possibility of creating child flows in the state callback. 
CONSIDER use setState on primitive?

INVESTIGATE: Should we really dispose of a keyed component that is not used???... 

# Ongoing
TODO: Rewrite portal functionality
  TODO: onHide callback (works, but needs fixing after new portal functionality)

TODO: Investigate button id-stability.

# Next
TODO: Move back some functionality from unobservable to state.  
TODO: Additional work on modals and popovers 

TODO: Support fragmented flows (flows corresponding to several divs).
  TODO: Styled button breaks if children are not in list 

# TODO 
TODO: Programmatic Reactive Layout demo
TODO: Move attribute extraction to primtives + warning of unused property?
TODO: Make causality throw an error if same build id is used in the same build. 
CONSIDER: More mount callbacks: onWillMount?

# After first release
TODO: Alternative Flow Target Demo, word-processor  

TODO: Is there a way to avoid observation of temporary objects during rebuild? Is it a problem?
TODO: Reconsider use of webpack now that we do not need jsx? Call webpack from within a script instead to avoid global install. 


# Random Notes
npm install -g webpack
npm install -g webpack-cli
npm install -g webpack-dev-server -->