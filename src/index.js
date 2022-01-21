
import { RootComponent } from "./RootComponent.js"
import { ReactiveFlow, observable } from "./reactive-flow.js"

let rootElement = document.getElementById("reactive-root");
rootElement.appendChild(document.createElement("div"));
console.log("ALIVE!");


ReactiveFlow.render(observable(new RootComponent()), document.getElementById('flow-root'));

// ReactDOM.render(<App />, document.getElementById('root'));

// function render() {
//   return {
//     component: observable(new Child),
//     children: []


//   }
// }