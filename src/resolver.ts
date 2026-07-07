import { Workflow, Segment } from "./types.js";

import verbs from "./verbs.js";

function getErrorMessage({
  verb,
  message,
}: {
  verb: string[];
  message: string;
}) {
  // capture verb as a string for error messages
  const verbString = verb.join(" ");
  const errorMessage = `Invalid verb: "${verbString}". ` + message;
  return errorMessage;
}

function resolver(verb: string[]): { workflow: Workflow; params: string[] } {
  let currentNode: Segment = verbs;
  // traverse segments until workflow is found
  for (let i = 0; i < verb.length; i++) {
    const segment: string = verb[i];
    const nextNode: Segment | Workflow = currentNode.children[segment];
    if (typeof nextNode === "undefined") {
      const errorMessage = getErrorMessage({
        verb,
        message: "The provided verb does not exist.",
      });
      throw new Error(errorMessage);
    } else if (nextNode.nodeType === "workflow") {
      const workflow: Workflow = nextNode;
      const params: string[] = verb.slice(i + 1);
      return { workflow, params };
    } else {
      currentNode = nextNode;
    }
  }
  const errorMessage = getErrorMessage({
    verb,
    message: "The provided verb does not map to a workflow.",
  });
  throw new Error(errorMessage);
}

export default resolver;
