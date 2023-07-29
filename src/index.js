import { startRecursiveDemo } from "./application/recursiveDemoApplication.js";
import { startHelloWorld } from "./application/helloWorldApplication.js";
import { setFlowConfiguration } from "./flow/Flow.js";
import { startProgrammaticReactiveLayout } from "./application/programmaticReactiveLayout.js";
import { startComplexFormApplication } from "./application/complexFormApplication.js";
import { startAnimationExample } from "./application/animationExample.js";
import { startDemo } from "./application/demo.js";
import { installDOMAnimation } from "./flow.DOMTarget/DOMAnimation.js";
import { startPatternMatching } from "./application/patternMatching.js";
import { buttonTest } from "./application/buttonTest.js";
import { startModalDemo } from "./application/modalDemo.js";
import { startSingleStaticWidget } from "./application/singleStaticWidget.js";
import { startSimpleMoveAnimation } from "./application/simpleMoveAnimation.js";
import { startSimpleAddRemoveAnimation } from "./application/simpleAddRemoveAnimation.js";

Array.prototype.remove = function(target) {
  const index = this.findIndex((element) => {
    return element === target;
  });
  if (index >= 0) {
    this.splice(index, 1);
    return true;
  } else {
    return false; 
  }
}

setFlowConfiguration({
  warnWhenNoKey: false,
  traceReactivity: true
});
installDOMAnimation();

// buttonTest();
// startSimpleMoveAnimation();
// startSimpleAddRemoveAnimation();
// startSingleStaticWidget();
// startPatternMatching();

// startDemo();

// startModalDemo();
startAnimationExample();
// startHelloWorld();
// startRecursiveDemo();
// startProgrammaticReactiveLayout();
// startComplexFormApplication();

