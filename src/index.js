import { startRecursiveAndModalDemo } from "./application/recursiveAndModalDemoApplication.js";
import { startHelloWorld } from "./application/helloWorldApplication.js";
import { startSuperSimple } from "./application/superSimple.js";
import { setFlowConfiguration } from "./flow/Flow.js";
import { startProgrammaticReactiveLayout } from "./application/programmaticReactiveLayout.js";
import { startComplexFormApplication } from "./application/complexFormApplication.js";
import { startAnimationExample } from "./application/animationExample.js";
import { startDemo } from "./application/demo.js";

setFlowConfiguration({
    warnWhenNoKey: false,
    traceReactivity: true
});

// startSuperSimple();
// startHelloWorld();
// startRecursiveAndModalDemo();
// startProgrammaticReactiveLayout();
// startAnimationExample();
// startComplexFormApplication();
startDemo();

