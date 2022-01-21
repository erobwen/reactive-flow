import getWorld from "causalityjs";
export const world = getWorld();
export const { observable, repeat } = world;

export class Component {
  Component() {
  }

  render() {
    this.children = null; 
  }
}

class DomReBuilder {
  DomReBuilder(rootElement) {
    this.rootElement = rootElement; 
  }
  buildOrUpdate(rootComponent) {
    if (!rootComponent.changeList) {
      // Building UI for the first time


    } else {
      // Updating UI 


    }
  }
}

export const ReactiveFlow = {
  render: (observableRootComponent, rootElement) => {
    const uiReBuilder = new DomReBuilder(rootElement);
    repeat(() => {
      uiReBuilder.buildOrUpdate(observableRootComponent);
    });
  }
}