import { findTextKeyAndOnClickInProperties, Flow, readFlowProperties } from "../flow/Flow";
import { div } from "./BasicHtml";
import { adjustLightness, grayColor } from "./Color";
import { button, text } from "../flow.components/BasicWidgets";
import { panelStyle } from "./Style";
import { centerMiddle, fitStyle, wrapper } from "./Layout";

const log = console.log; 

export function modernButton(...parameters) { 
  const properties = findTextKeyAndOnClickInProperties(readFlowProperties(parameters));
  properties.hoverEffect = false; 
  properties.ripple = false; 
  return new ModernButton(properties);
};

export class ModernButton extends Flow {

  setProperties({pressed= false, children, onClick, onClickKey, style={}, innerStyle={}, hoverAjust = -0.1, text="TESTING", ripple=true, hoverEffect= true, fixedSize=false}) {
    this.ripple = ripple;
    this.hoverEffect = hoverEffect;
    this.children = children; 
    this.onClick = onClick;
    // this.onClickKey = onClickKey; Do we really need this? Do not update event listeners unless this changes OR forceful change?

    this.style = {
      margin: "5px",
      overflow: "visible", 
      height: "35px", 
      ...style
    };
    if (fixedSize) style.width = "250px";

    if (!innerStyle.backgroundColor) {
      innerStyle.backgroundColor = grayColor(240);
    }
    
    this.backgroundColor = innerStyle.backgroundColor; 
    this.mouseOverBackgroundColor = adjustLightness(this.backgroundColor, hoverAjust);
    this.pressedBackgroundColor = adjustLightness(this.backgroundColor, -0.2)
    this.mouseOverPressedBackgroundColor = adjustLightness(this.pressedBackgroundColor, -0.1);
    this.innerStyle = {
      ...fitStyle, 
      ...panelStyle, 
      position: "relative", 
      overflow: "hidden", 
      color: "black", 
      transition: "background 0.5s", 
      overflow: "hidden", 
      userSelect: "none", 
      fontSize: "20px",
      paddingLeft: "10px",
      paddingRight: "10px",
      ...innerStyle
    };
    if (ripple) innerStyle.position = "relative";

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
    // log("ENSURE");
    // log(foo);
    // log("--")
    // Ensure event listeners
    const pannel = this.findChild("centerMiddle").domNode;
    if (pannel !== this.eventListenersDomNode) {
      this.eventListenersDomNode = pannel;
      this.clearEventListeners();
      this.setEventListeners(this.onClick, this.mouseOverBackgroundColor);
    }

    // Ensure right background color
    // log(this.toString())
    // log("hover:" + this.hover);
    if (this.pressed) {
      if (this.hover && this.hoverEffect) {
        this.innerStyle = {...this.innerStyle, backgroundColor: this.mouseOverPressedBackgroundColor};      
      } else {
        this.innerStyle = {...this.innerStyle, backgroundColor: this.pressedBackgroundColor};      
      }
    } else {
      if (this.hover  && this.hoverEffect) {
        this.innerStyle = {...this.innerStyle, backgroundColor: this.mouseOverBackgroundColor};      
      } else {
        this.innerStyle = {...this.innerStyle, backgroundColor: this.backgroundColor};      
      }
    }
  }

  onDispose() {
    this.clearEventListeners();
  }

  clearEventListeners() {
    if (!this.eventListenersSet) return;

    // Clear old listeners
    const panel = this.findChild("centerMiddle").domNode;
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
    const panel = this.findChild("centerMiddle").domNode;
    log("setEventListeners");
    // log(panel)

    this.rippleAndCallback = (event) => {
      log("TRY RIPPLE");


      event.stopPropagation();
      if (this.inAnimation) {
        onClick(); 
        return;
      }
      this.inAnimation = true; 
          
      if (ripple) { 
        log("RIPPLE");
        log(this)
        log(this.findChild("text"));
        log(this.findChild("text").domNode);

        // Fixate panel (it might grow otherwise... )
        panel.style.overflow = "hidden";
        const panelComputedStyle = window.getComputedStyle(panel, null);
        panel.style.maxWidth = panelComputedStyle.width;
        panel.style.maxHeight = panelComputedStyle.height;
        
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
          pointerEvents: "none",
          borderRadius: "50%",
          backgroundColor: "white",
          position: "absolute",
          transform: "matrix(0.0001, 0, 0, 0.0001, 0, 0)",
          opacity: 0.5
        });

        requestAnimationFrame(() => {
          Object.assign(circle.style, {
            transition: "all 2s linear", 
            transform: "scale(10)",
            opacity: 0
          })
        });

        const restorePanelAfterDelay = (panel, circle) => {
          setTimeout(() => {
            panel.removeChild(circle);
            setTimeout(() => {
              this.findChild("centerMiddle").synchronizeDomNodeStyle(["maxWidth", "maxHeight", "overflow"]);
              this.inAnimation = false; 
            }, 0); 
          }, 300);
        }
        restorePanelAfterDelay(panel, circle);
      } else {
        this.inAnimation = false;
      }

      onClick(); 
    }

    log(panel)

    if (onClick) {    
      panel.addEventListener("click", this.rippleAndCallback);
    }

    if (onClick && mouseOverBackgroundColor) {
      this.setMouseoverColor = () => {
        // log("<<setMouseoverColor>>");
        this.hover = true;
      }
      panel.addEventListener("mouseover", this.setMouseoverColor);

      this.removeMouseoverColor = () => {
        // log("<<removeMouseoverColor>>");
        this.hover = false;
      }
      panel.addEventListener("mouseout", this.removeMouseoverColor);
    }
  }
  
  build() {
    // log("REBUILDING BUTTON")
    let {style, innerStyle, onClick} = this;
    if (onClick) {
      style.cursor = "pointer";
    }
    return (
      wrapper(
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
            style: innerStyle
          }
        ),
        {
          style
        }
      )
    );
  }
}
