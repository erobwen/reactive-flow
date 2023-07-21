import { div, elemenNode } from "../flow.components/BasicHtml";
import { getTarget } from "../flow/Flow";
import flow from "../../resources/flow.svg"

const log = console.log;

export function svgImage(...parameters) {
  log("in image")
  log(flow)
  return getTarget().elementNode({tagName: "img", attributes: {style: {padding: "20px", backgroundColor: "white"}, src: flow}});
}