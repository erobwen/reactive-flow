import { observable, Flow, flow, repeat } from "../flow/Flow";
import { readFlowProperties, findTextAndKeyInProperties } from "../flow/flowParameters";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { basicWidgetTheme, numberInputField, text } from "../flow.components/BasicWidgets";
import { centerMiddle, column, fitStyle, flexAutoHeightStyle, flexAutoStyle, flexGrowShrinkStyle, flexerStyle, row } from "../flow.components/Layout";
import { div } from "../flow.DOMTarget/BasicHtml"
;
import { logMark } from "../flow/utility";
import { fitTextWithinWidth } from "../flow.DOMTarget/fontMetrics";


const log = console.log;

/**
 * Flow definitions
 */

// Parent flow
export class ProgrammaticReactiveLayout extends Flow {
  
  setProperties({bounds}) {
    this.bounds = bounds; 
  } 

  setState() {
    this.rows = 3; 
    this.columns = 3;  
  }

  build() {

    const controlPanel = column("control-panel",
      row(numberInputField("Rows", this, "rows")),
      row(numberInputField("Columns", this, "columns")),
      text("Try change the size of the browser window, and add/remove columns/rows. Try do this with css :-)"),
      {style: flexAutoStyle}
    );

    const controlPanelHeight = controlPanel.dimensions().height; 
    //console.log(controlPanel.dimensions());
    //console.log(controlPanelHeight);
    const gridHeight = this.bounds.height - controlPanelHeight;
    const gridWidth = this.bounds.width;
    const rows = [];
    let rowIndex = 0;
    const rowHeight = gridHeight / this.rows;
    const columnWidth = gridWidth / this.columns;
    let cellType = false; 
    while(rowIndex < this.rows) {
      const columns = [];
      let columnIndex = 0;
      cellType = rowIndex % 3;
      while(columnIndex < this.columns) {
        const key = rowIndex + "x" + columnIndex;
        const bounds = {width: columnWidth, height: rowHeight};
        switch(cellType) {
          case 0: 
            columns.push(new BoundsDisplay({key, bounds, style: flexerStyle}));
            break; 
          case 1: 
            columns.push(new StringDisplay({key, bounds, style: flexerStyle}));
            break; 
          case 2: 
            columns.push(new FixedAspectRatioDisplay({key, bounds, style: flexerStyle}));
            break; 
        }

        cellType = (cellType + 1)% 3; 
        columnIndex++;
      }
      const currentRow = row(columns, {style: flexerStyle});
      log(currentRow);
      rows.push(currentRow);
      rowIndex++;
    } 
    log(rows);


    return column(
      controlPanel,
      column(rows, {style: flexerStyle}),
      // new Cell({bounds: {width: this.bounds.width, height: this.bounds.height - controlPanelHeight}}),
      {style: {
        height: "100%", 
        width: "100%"
      }}
    );
  }
}

export class BoundsDisplay extends Flow {

  setProperties({bounds, style}) {
    this.bounds = bounds;
    this.style = style; 
  } 
    
  build() {
    const text = "bounds: " + Math.round(this.bounds.width) + " x " + Math.round(this.bounds.height);
    return (
      centerMiddle(
        scaledTextWithMaxFontSize(
          text, 
          {width: this.bounds.width}
        ),
        {style: {
          overflow: "hidden",
          border: "1px solid",
          backgroundColor: "silver", 
          boxSizing: "border-box",
          ...this.style
        }}
      )
    );
  }
}


export class StringDisplay extends Flow {

  setProperties({bounds, style}) {
    this.bounds = bounds;
    this.style = style; 
  } 
  
  build() {
    const fittedString = "Fitted Text"// + this.key; 
    return (
      centerMiddle(
        text(fittedString), 
        {style: {
          overflow: "hidden",
          border: "1px solid",
          boxSizing: "border-box",
          fontSize: fitTextWithinWidth(fittedString, this.bounds.width) + "px",
          ...this.style
        }}
      )
    );
  }
}

function scaledTextWithMaxFontSize(...parameters) {
  const properties = readFlowProperties(parameters);
  findTextAndKeyInProperties(properties)
  // console.log(properties);
  const fontSize = Math.min(basicWidgetTheme.fontSize, fitTextWithinWidth(properties.text, properties.width*0.8));
  // log(fontSize)
  return (
    centerMiddle(
      text(properties.text), 
      {
        style: {
          ...fitStyle,
          overflow: "hidden",
          fontSize: fontSize + "px",
          ...properties.style
        }
      }, 
      {    
        key: properties.key,
      }
    )
  );
}


export class FixedAspectRatioDisplay extends Flow {

  setProperties({bounds, style}) {
    this.bounds = bounds;
    this.style = style; 
  } 

  setState() {
    this.aspectRatio = (Math.random()*4 + 1) / (1 + (Math.random()*4));
  }
  
  build() {
    const fittedString = "Fitted String"// + this.key;
    
    const boundsAspectRatio = this.bounds.width / this.bounds.height; 

    let width; 
    let height; 
    if (this.aspectRatio > boundsAspectRatio) {
      // Constrained by width
      const padding = Math.min(10, this.bounds.width*0.1);
      width = this.bounds.width - padding*2;
      height = width / this.aspectRatio;
    } else {
      // Constrained by height
      const padding = Math.min(10, this.bounds.height*0.1);
      height = this.bounds.height - padding*2;
      width = height * this.aspectRatio; 
    }

    return (
      centerMiddle(
        div(
          scaledTextWithMaxFontSize(
            "width / height = " + Math.round(this.aspectRatio * 100) / 100, 
            {width}
          ),{
          style: {
            border: "1px solid",
            boxSizing: "border-box",
            backgroundColor: "#bbbbff",
            width: width + "px", 
            height: height + "px"
          }
        }), 
        {style: {
          overflow: "hidden",
          border: "1px solid",
          boxSizing: "border-box",
          ...this.style
        }}
      )
    );
  }
}




/**
 * This is what you would typically do in index.js to start this app. 
 */
export function startProgrammaticReactiveLayout() {
  new DOMFlowTarget(document.getElementById("flow-root")).setContent(
    new ProgrammaticReactiveLayout()
  );
}


function subtractWidth(bounds, width) {
  return {width: bounds.width - width, height: bounds.height};
}


function subtractHeight(bounds, width) {
  return {width: bounds.width - width, height: bounds.height};
}