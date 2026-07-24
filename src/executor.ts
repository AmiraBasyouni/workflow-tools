import { Context, Workflow, Requirement } from "./types.js";

import verify from "./verify.js";
import runtime from "./runtime.js";

function handleFailedRequirements(
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

  // ERROR HANDLING
  if (!verification.allArePassing && verification.failedRequirements) {
    const errorMessage = handleFailedRequirements(
      verification.failedRequirements,
      workflow.name,
    );
    throw new Error(errorMessage);
  } else if (!verification.allArePassing && !verification.failedRequirements) {
    throw new Error(
      "Workflow requirements are not passing, but failed requirements can't be detected.",
    );
  }

  // CORE LOGIC
  if (verification.allArePassing) {
    runtime({ context, workflow });
  }
}

export default executor;
