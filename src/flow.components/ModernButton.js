import { findTextKeyAndOnClickInProperties, Flow, readFlowProperties } from "../flow/Flow";
import { div } from "./Basic";
import { adjustLightness, grayColor } from "./Color";
import { button, text } from "../flow.components/BasicWidgets";
import { panelStyle } from "./Style";
import { centerMiddle, fitStyle } from "./Layout";

const log = console.log; 

export function modernButton(...parameters) { 
  const properties = findTextKeyAndOnClickInProperties(readFlowProperties(parameters));
  return new ModernButton(properties);
};

export class ModernButton extends Flow {

  setProperties({pressed= false, children, onClick, onClickKey, style={}, hoverAjust = -0.1, text="TESTING", ripple=true, fixedSize=false}) {
    this.ripple = ripple;
    this.children = children; 
    this.onClick = onClick;
    // this.onClickKey = onClickKey; Do we really need this? Do not update event listeners unless this changes OR forceful change?
    if (!style.backgroundColor) {
      style.backgroundColor = grayColor(240);
    }
    this.backgroundColor = style.backgroundColor; 
    this.mouseOverBackgroundColor = adjustLightness(this.backgroundColor, hoverAjust);
    this.pressedBackgroundColor = adjustLightness(this.backgroundColor, -0.1)
    this.mouseOverPressedBackgroundColor = adjustLightness(this.pressedBackgroundColor, -0.1);

    this.style = {transition: "background 0.5s", height: "35px", margin: "5px", ...style, ...panelStyle, color: "black"};
    if (fixedSize) style.width = "250px";

    this.pressed = pressed;  
    this.inAnimation = false;
    this.eventListenersSet = false; 
    this.text = text; 
  }

  setState() {
    this.hover = false;
  }

  ensure() {
    const foo = this.text; 
    log("ENSURE");
    log(foo);
    log("--")
    // Ensure event listeners
    if (this.domNode !== this.eventListenersDomNode) {
      this.eventListenersDomNode = this.domNode;
      this.clearEventListeners();
      this.setEventListeners(this.onClick, this.mouseOverBackgroundColor);
    }

    // Ensure right background color
    log(this.toString())
    log("hover:" + this.hover);
    if (this.pressed) {
      if (this.hover) {
        this.style = {...this.style, backgroundColor: this.mouseOverPressedBackgroundColor};      
      } else {
        this.style = {...this.style, backgroundColor: this.pressedBackgroundColor};      
      }
    } else {
      if (this.hover) {
        this.style = {...this.style, backgroundColor: this.mouseOverBackgroundColor};      
      } else {
        this.style = {...this.style, backgroundColor: this.backgroundColor};      
      }
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
        this.hover = true;
      }
      panel.addEventListener("mouseover", this.setMouseoverColor);

      this.removeMouseoverColor = () => {
        this.hover = false;
      }
      panel.addEventListener("mouseout", this.removeMouseoverColor);
    }
  }
  
  build() {
    log("REBUILDING BUTTON")
    let {ripple, style, onClick} = this;
    style = {...style, overflow: "hidden", userSelect: "none", padding: "20px", fontSize: "20px"};
    if (ripple) style.position = "relative";
    if (onClick) {
      style.cursor = "pointer";
    }
    return (
      centerMiddle("centerMiddle",
        text(
          "text",
          this.text,
          {style: {
            cursor: "pointer", 
            pointerEvents: "none"
          }}
        ), 
        {
          style
        }
      )
    );
  }
}
