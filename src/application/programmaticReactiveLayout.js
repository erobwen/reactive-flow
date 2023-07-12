import { observable, Flow, flow, repeat } from "../flow/Flow";
import { DOMFlowTarget } from "../flow.DOMTarget/DOMFlowTarget.js";
import { numberInputField, text } from "../flow.components/BasicWidgets";
import { centerMiddle, column, flexAutoHeightStyle, flexAutoStyle, flexGrowShrinkStyle, flexerStyle, row } from "../flow.components/Layout";
import { div } from "../flow.components/BasicHtml"
;
import { colorLog } from "../flow/utility";
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
      {style: flexAutoStyle}
    );

    const controlPanelHeight = controlPanel.dimensions().height; 
    //console.log(controlPanel.dimensions());
    //console.log(controlPanelHeight);
    const gridHeight = this.bounds.height - controlPanelHeight;
    const gridWidth = this.bounds.width;
    colorLog("build");
    const rows = [];
    let rowIndex = 0;
    const rowHeight = gridHeight / this.rows;
    const columnWidth = gridWidth / this.columns;
    let cellType = false; 
    while(rowIndex < this.rows) {
      const columns = [];
      let columnIndex = 0;
      cellType = rowIndex % 2;
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
        }

        cellType = (cellType + 1)% 2; 
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
    return (
      centerMiddle(
        text("bounds: [" + Math.round(this.bounds.width) + " x " + Math.round(this.bounds.height) + "]"), 
        {style: {
          overflow: "hidden",
          border: "1px solid",
          backgroundColor: "silver", 
          boxSizing: "border-box",

          // height: "100%", 
          // width: "100%"
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
    // colorLog("HeRE");
    // log(this.bounds)
    const fittedString = "Fitted String"// + this.key; 
    return (
      centerMiddle(
        text(fittedString), 
        {style: {
          overflow: "hidden",
          border: "1px solid",
          boxSizing: "border-box",
          fontSize: fitTextWithinWidth(fittedString, this.bounds.width) + "px",
          // width: "100%"
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