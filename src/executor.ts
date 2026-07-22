import { Context, Workflow, Requirement } from "./types.js";

import verify from "./verify.js";
import runtime from "./runtime.js";

function failedRequirementsError(
  failedRequirements: Requirement[],
  workflowName: string,
) {
  const message = `Error: Failed to run workflow ${workflowName}, requirements not met:`;
  const list = "";
  failedRequirements.forEach((failedRequirement) => {
    list.concat(
      `- ${failedRequirement.description}. ${failedRequirement.fulfillmentInstructions}`,
    );
  });
  return message + list;
}

async function executor({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  // INPUT VALIDATION
  const verification = await verify.workflowRequirements({ workflow, context });
  if (verification.allArePassing) {
    runtime({ context, workflow });
  } else if (verification.failedRequirements) {
    const message = failedRequirementsError(
      verification.failedRequirements,
      workflow.name,
    );
    throw new Error(message);
  } else {
    throw new Error("Something went wrong. Module: executor.");
  }
}

export default executor;
