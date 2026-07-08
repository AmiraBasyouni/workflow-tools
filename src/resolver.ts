import { Workflow, Segment } from "./types.js";

import verbs from "./verbs.js";

function getErrorMessage({
  verb,
  message,
}: {
  verb: string[];
  message: string;
}) {
  // Capture verb as a string.
  const verbString = verb.join(" ");
  const errorMessage = `Invalid verb: "${verbString}". ` + message;
  return errorMessage;
}

function resolver(verb: string[]): { workflow: Workflow; params: string[] } {
  let currentNode: Segment = verbs;
  // Traverse segments until workflow is found.
  for (let i = 0; i < verb.length; i++) {
    const segment = verb[i];
    const nextNode: Segment | Workflow = currentNode[segment];
    if (typeof nextNode === "undefined") {
      // It's undefined, throw an error.
      const errorMessage = getErrorMessage({
        verb,
        message: "The provided verb does not exist.",
      });
      throw new Error(errorMessage);
    } else if ("isWorkflow" in nextNode) {
      // It's a workflow, return workflow and params.
      const workflow: Workflow = nextNode as Workflow;
      const params: string[] = verb.slice(i + 1);
      return { workflow, params };
    } else {
      // It's a segment, traverse next segment.
      currentNode = nextNode;
    }
  }
  // Ended on a segment, throw an error.
  const errorMessage = getErrorMessage({
    verb,
    message: "The provided verb does not map to a workflow.",
  });
  throw new Error(errorMessage);
}

export default resolver;
