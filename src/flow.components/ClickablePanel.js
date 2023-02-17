import { Flow } from "../flow/Flow";
import { div } from "./BasicFlowComponents";
const log = console.log; 

export class ClickablePanel extends Flow {

  setProperties({children, onClick, onClickKey, mouseOverBackgroundColor}) {
    this.children = children; 
    this.onClick = onClick;
    // this.onClickKey = onClickKey; Do we really need this? Do not update event listeners unless this changes OR forceful change? 
    this.mouseOverBackgroundColor = mouseOverBackgroundColor; 
    this.inAnimation = false;
    this.eventListenersSet = false; 
  }

  setState() {
    this.derrive(() => {
      if (this.domNode) {
        this.clearEventListeners();
        this.setEventListeners(this.onClick, this.mouseOverBackgroundColor);
      }
    });
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
    const {ripple = true } = this; 
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
        if (!this.shade || this.shade.removing) {
          const shade = document.createElement('div');
          this.shade = shade; 
          Object.assign(shade.style, {
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            position: "absolute",
            backgroundColor: "black",
            opacity: 0,
            pointerEvents: "none",
          })
          panel.appendChild(shade);

          requestAnimationFrame(() => {
            this.shade.style.transition = "opacity .5s";
            requestAnimationFrame(() => {
              this.shade.style.opacity = 0.5; 
            });
          });
        }
      }
      panel.addEventListener("mouseover", this.setMouseoverColor);

      this.removeMouseoverColor = () => {
        if (this.shade) {
          ((shade) => {
            shade.addEventListener("transitionend", () => {
              if (shade.parentNode === panel) {
                panel.removeChild(shade);
                if (this.shade === shade) {
                  this.shade = null;
                }
              }
            }); 
            shade.style.opacity = 0;
            shade.removing = true;
          })(this.shade);
        }
      }
      panel.addEventListener("mouseout", this.removeMouseoverColor);
    }
  }
  
  build() {
    let {style, children, onClick} = this;
    style = {...style, overflow: "hidden", position: "relative", userSelect: "none"};
    if (onClick) {
      style.cursor = "pointer";
    }
    return (
      div({style, children})
    );
  }
}
