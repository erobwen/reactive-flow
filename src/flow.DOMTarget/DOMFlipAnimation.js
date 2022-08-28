

export class DOMFlipAnimation {

  recordInitialPosition(primitive, node) {
    primitive.initialPosition = node.getBoundingClientRect();
  }

  rememberStyle(primitive, node) {
    primitive.rememberedEnterTargetStyle = {...node.style};
  }

  getAddedEnterStyle() {
    return {
      transform: "scale(0)",
      maxHeight: "0px",
      maxWidth: "0px",
      margin: "0px",
      marginTop: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      marginRight: "0px",
      padding: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      paddingRight: "0px",
      opacity: "0"
    } 
  }

  getResident

  recordInitialPosition(primitive, node) {
    primitive.initialPosition: node.getBoundingClientRect();
  }
}