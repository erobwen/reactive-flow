import { Flow } from "../../flow/Flow"
import { readFlowProperties } from "../../flow/flowParameters";
import { log, logMark } from "../../flow/utility";
import { button, text } from "./BasicWidgets";
import { column, row } from "./Layout";
import { modal, modalFrame } from "./Modal";


export function applicationMenuFrame(...parameters) {
  return new ApplicationMenuFrame(readFlowProperties(parameters));
}

class ApplicationMenuFrame extends Flow {
  setProperties({appplicationMenu, applicationContent}) {
    this.appplicationMenu = appplicationMenu;
    this.applicationContent = applicationContent;
  }

  setState() {
    this.menuOpen = false; 
  }

  setApplicationContent(content) {
    this.applicationContent = content;
  } 

  build() {
    const menuWidth = this.appplicationMenu.dimensions().width;
    const menuIsModal = this.bounds.width < menuWidth * 3;

    this.applicationContent.bounds = { 
      width: menuIsModal ? this.bounds.width : this.bounds.width - menuWidth, 
      height: this.bounds.height
    };
    logMark("build menu frame");
    log(this.bounds.width);
    log(menuIsModal);
    // if (menuIsModal) return text("Foo");

    return modalFrame( 
      (menuIsModal) ? 
        column(
          button("Menu", () => {this.menuOpen = true;}),
          modal(this.appplicationMenu).show(this.menuOpen),
          this.applicationContent, 
          {style: {width: "100%", overflow: "visible"}}
        )
        :
        row(
          this.appplicationMenu, 
          this.applicationContent, 
          {style: {height: "100%", overflow: "visible"}}
        )
    )
  }
}