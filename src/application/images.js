import { div, elemenNode } from "../flow.DOMTarget/BasicHtml";
import flow from "../../resources/flow.svg"
import { getTarget } from "../flow/flowBuildContext";

const log = console.log;

export function svgImage(...parameters) {
  log("in image")
  log(flow)
  // return null
  return getTarget().create({type: "dom.elementNode", tagName: "img", attributes: {style: {padding: "20px", backgroundColor: "white"}, src: flow}});
}