import { flyFromLeftAnimation, flyFromTopAnimation } from "../../flow.DOMTarget/FlyDOMNodeAnimation";
import { Flow } from "../../flow/Flow"
import { readFlowProperties } from "../../flow/flowParameters";
import { log, logMark } from "../../flow/utility";
import { button, text } from "./BasicWidgets";
import { centerMiddle, column, filler, fillerStyle, layoutBorderStyle, row } from "./Layout";
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
    this.menuIsModalOverride = null; 
  }

  setApplicationContent(content) {
    this.applicationContent = content;
  } 

  build() {
    logMark("build menu frame");
    log(this.appplicationMenu)
    log(this.appplicationMenu.getDomNode())
    log(this.appplicationMenu.dimensions())
    const menuWidth = this.appplicationMenu.dimensions().width;
    log("menuWidth " + menuWidth);
    log("width " + this.bounds.width);
    const { menuIsModalOverride } = this;
    const menuIsModal = menuIsModalOverride !== null ? menuIsModalOverride : this.bounds.width < menuWidth * 3;
    log(menuIsModal);

    this.applicationContent.bounds = { 
      width: menuIsModal ? this.bounds.width : this.bounds.width - menuWidth, 
      height: this.bounds.height
    };
    // if (menuIsModal) return text("Foo");

    // return centerMiddle(
    //   menuIsModal ? text("modal", "Modal") : text("nonmodal", "Non modal")
    // );
    
    const toggleButton = button(menuIsModal ? "To Modal" : "To Nonmodal", () => this.menuIsModalOverride = !this.menuIsModalOverride);
    // return centerMiddle(toggleButton);

    const modalMenu = centerMiddle("modalMenu",
      text("Menu..."),
      {style: layoutBorderStyle, animate: flyFromTopAnimation}
    );

    const leftMenu = centerMiddle("leftMenu", 
      text("Menu..."),
      {style: layoutBorderStyle, animate: flyFromLeftAnimation}      
    );

    const leftSupportMenu = centerMiddle(
      text("Menu..."),
      {key: "leftSupportMenu", style: layoutBorderStyle, animate: flyFromTopAnimation}      
    );

    return row("a",
      leftMenu.show(!menuIsModal),
      column("d",
        leftSupportMenu.show(!menuIsModal),
        modalMenu.show(menuIsModal),
        centerMiddle("content", toggleButton,{style: fillerStyle}),
        {style: {...fillerStyle, ...layoutBorderStyle}}
      ),
      {style: {...fillerStyle, ...layoutBorderStyle}}
    )


    return column("a",
      modalMenu.show(menuIsModal),
      row("b",
        leftMenu.show(!menuIsModal),
        column(
          "d",
          leftSupportMenu.show(!menuIsModal),
          centerMiddle("content", toggleButton,{style: fillerStyle}),
          {style: {...fillerStyle, ...layoutBorderStyle}}
        ),
        {style: {...fillerStyle, ...layoutBorderStyle}}
      )
    );
    if (menuIsModal) {
      return column(
        centerMiddle(
          // toggleButton,
          modalMenu,
          // text("Menu...x", {animate: flyFromTopAnimation}),
          {style: layoutBorderStyle}
        ),
        filler()
      );
    } else {
      return row(
        centerMiddle(
          // toggleButton,
          leftMenu,
          // text("Menu...x", {animate: flyFromLeftAnimation}),
          {style: layoutBorderStyle}
        ),
        filler()
      );
    }



    // return modalFrame( 
    //   (menuIsModal) ? 
    //     column(
    //       button("Menu", () => {this.menuOpen = true;}),
    //       modal(this.appplicationMenu).show(this.menuOpen),
    //       this.applicationContent, 
    //       {style: {width: "100%", overflow: "visible"}}
    //     )
    //     :
    //     row(
    //       this.appplicationMenu, 
    //       this.applicationContent, 
    //       {style: {height: "100%", overflow: "visible"}}
    //     )
    // )
  }
}