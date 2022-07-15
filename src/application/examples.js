
/**
 * This is how to declare a simple function flow without state
 */
 function frame(...parameters) {
    return new Flow({
      build: ({children}) => {
        return new Div({children: [
          row({children})
        ]});
      },
      ... readFlowProperties(parameters)
    })
  }
  