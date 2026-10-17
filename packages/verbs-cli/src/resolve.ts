import { Workflow, Segment } from "./types.js";

import verbs from "./verbs.js";

function getError({ verb, message }: { verb: string[]; message: string }) {
  // Capture verb as a string.
  const verbString = verb.join(" ");
  const errorMessage =
    `Invalid verb. ` + message + ` Received: "${verbString}".`;
  return { message: errorMessage, alternativeVerbs: getAlternativeVerbs() };
}

function getAlternativeVerbs() {
  return [
    "branch list",
    "branch create",
    "branch delete",
    "tag list",
    "tag create lightweight",
    "tag create annotated",
    "tag delete",
  ];
}

function resolve(
  verb: string[],
):
  | { workflow: Workflow; params: string[]; error?: never }
  | { error: { message: string; alternativeVerbs: string[] } } {
  let currentNode: Segment = verbs;
  // Traverse segments until workflow is found.
  for (let i = 0; i < verb.length; i++) {
    const segment = verb[i];
    if (segment === "workflow") {
      const error = getError({
        verb,
        message: 'The key "workflow" is reserved.',
      });
      return { error };
    }
    const nextNode = currentNode[segment] as Segment | undefined;
    if (typeof nextNode === "undefined") {
      // It's undefined, throw an error.
      const error = getError({
        verb,
        message: "The verb does not exist.",
      });
      return { error };
    } else if ("workflow" in nextNode && nextNode.workflow) {
      // It's a workflow, return workflow and params.
      const workflow = nextNode.workflow;
      const params: string[] = verb.slice(i + 1);
      return { workflow, params };
    } else {
      // It's a segment, traverse next segment.
      currentNode = nextNode;
    }
  }
  // Ended on a segment, throw an error.
  const error = getError({
    verb,
    message: "The verb does not map to a workflow.",
  });
  return { error };
}

export default resolve;
