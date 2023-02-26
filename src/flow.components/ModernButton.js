import { findTextKeyAndOnClickInProperties, Flow, readFlowProperties } from "../flow/Flow";
import { div } from "./Basic";
import { adjustLightness } from "./Color";
import { button, text } from "../flow.components/BasicWidgets";
import { panelStyle } from "./Style";
import { centerMiddle, fitStyle } from "./Layout";

const log = console.log; 

export function modernButton(...parameters) { 
  const properties = findTextKeyAndOnClickInProperties(readFlowProperties(parameters));
  return new ModernButton(properties);
};

export class ModernButton extends Flow {

  setProperties({children, onClick, onClickKey, mouseOverBackgroundColor, style={}, hoverAjust = -0.1, text="TESTING", ripple=true, fixedSize=false}) {
    this.ripple = ripple;
    this.children = children; 
    this.onClick = onClick;
    // this.onClickKey = onClickKey; Do we really need this? Do not update event listeners unless this changes OR forceful change? 
    if (!style.backgroundColor) {
      style.backgroundColor = "rgb(150, 150, 255)";
    }
    
    if (mouseOverBackgroundColor) {
      this.mouseOverBackgroundColor = mouseOverBackgroundColor;
    } else if (style && style.backgroundColor) {
      this.mouseOverBackgroundColor = adjustLightness(style.backgroundColor, hoverAjust);
    }
    this.style = {height: "35px", margin: "2px", ...style, ...panelStyle};
    if (fixedSize) style.width = "250px";
    this.inAnimation = false;
    this.eventListenersSet = false; 
    this.text = text; 
  }

  ensure() {
    if (this.domNode !== this.eventListenersDomNode) {
      this.eventListenersDomNode = this.domNode;
      this.clearEventListeners();
      this.setEventListeners(this.onClick, this.mouseOverBackgroundColor);
    }
  }

  onDispose() {
    this.clearEventListeners();
  }

  clearEventListeners() {
    if (!this.eventListenersSet) return;

    // Clear old listeners
    const panel = this.domNode;
    if (this.setMouseoverColor) {
      panel.removeEventListener("mouseover", this.setMouseoverColor);  
      delete this.setMouseoverColor;
    }
    if (this.removeMouseoverColor) {
      panel.removeEventListener("mouseout", this.removeMouseoverColor);
      delete this.removeMouseoverColor;
    }
    if (this.rippleAndCallback) {
      panel.removeEventListener("click", this.rippleAndCallback);
      delete this.rippleAndCallback;
    }

    this.eventListenersSet = false; 
  }

  setEventListeners(onClick, mouseOverBackgroundColor) {
    const {ripple} = this; 
    const panel = this.domNode;

    this.rippleAndCallback = (event) => {
      event.stopPropagation();
      if (this.inAnimation) {
        onClick(); 
        return;
      }
      this.inAnimation = true; 
      
      const oldStyle = {
        overflow : panel.style.overflow,
        width: panel.style.width,
        height: panel.style.height
      }

      // if (backgroundOnClick) {
        //   panel.style.transition = "background-color 0.6 ease-in-out";
        //   panel.style["background-color"] = "white"; 
        //   setTimeout(() => {
          //     panel.style["background-color"] = backgroundOnClick; 
          //   }, 0);
          // }
          
      if (ripple) { 
        // Fixate panel (it might grow otherwise... )
        panel.style.overflow = "hidden";
        const panelComputedStyle = window.getComputedStyle(panel, null);
        panel.style.width = panelComputedStyle.width;
        panel.style.height = panelComputedStyle.height;
        
        // Button size
        const diameter = Math.max(panel.clientWidth, panel.clientHeight);
        const radius = diameter / 2;
        
        // Create circle
        const circle = document.createElement('div');
        panel.appendChild(circle);
        circle.style.width = circle.style.height = diameter + "px";
        circle.style.left = (event.clientX - panel.offsetLeft) - radius + "px";
        circle.style.top = (event.clientY - panel.offsetTop) - radius + "px";

        Object.assign(circle.style, {
          borderRadius: "50%",
          backgroundColor: "white",
          position: "absolute",
          transform: "scale(0)",
          opacity: 0.5
        });

        requestAnimationFrame(() => {
          Object.assign(circle.style, {
            transition: "all 0.6s linear", 
            transform: "scale(4)",
            opacity: 0
          })
        });

        const restorePanelAfterDelay = (panel, circle, oldStyle) => {
          setTimeout(() => {
            panel.removeChild(circle);
            setTimeout(() => {
              panel.style.width = oldStyle.width;
              panel.style.height = oldStyle.height;
              panel.style.overflow = oldStyle.overflow;
              this.inAnimation = false; 
            }, 0); 
          }, 300);
        }
        restorePanelAfterDelay(panel, circle, oldStyle);
      } else {
        this.inAnimation = false;
      }

      onClick(); 
    }

    if (onClick) {    
      panel.addEventListener("click", this.rippleAndCallback);
    }

    if (onClick && mouseOverBackgroundColor) {
      this.setMouseoverColor = () => {
        if (!panel.mouseIn) {
          panel.mouseIn = true;         
          // log("mouseover");
          panel.style["transition"] = "background-color 0.25s";
          panel._savedBackgroundColor = panel.style["background-color"];
          panel.style["background-color"] = mouseOverBackgroundColor;
        }
      }
      panel.addEventListener("mouseover", this.setMouseoverColor);

      // panel.addEventListener("mouseenter", () => {
      //   log("mouseenter");
      // });

      this.removeMouseoverColor = () => {
        if (panel.mouseIn) {
          panel.mouseIn = false;     
          // log("mouseout");
          // log(panel._savedBackgroundColor);
          panel.style["background-color"] = panel._savedBackgroundColor; //"rgba(0, 0, 0, 0)";
          // delete panel.style["background-color"]; // Note: Does not work in IE
          // panel.style["background-color"] = null; // Note: Does not work in IE
        }
      }
      panel.addEventListener("mouseout", this.removeMouseoverColor);
    }
  }
  
  build() {
    let {ripple, style, onClick} = this;
    style = {...style, overflow: "hidden", userSelect: "none", padding: "4px"};
    if (ripple) style.position = "relative";
    if (onClick) {
      style.cursor = "pointer";
    }
    return (
      centerMiddle(
        text(
          this.text
        ), 
        {
          style
        }
      )
    );
  }
}
