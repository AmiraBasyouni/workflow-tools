import { Context, Workflow, Requirement } from "./types.js";

import verify from "./verify.js";
import runtime from "./runtime.js";

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
    console.error("Error: " + errorMessage);
    process.exit(1);
  } else if (!verification.allArePassing && !verification.failedRequirements) {
    console.error(
      "Error: Workflow requirements did not pass. Failed requirements could not be detected.",
    );
    process.exit(1);
  }

  // CORE LOGIC
  if (verification.allArePassing) {
    runtime({ context, workflow });
  }
}

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

export default executor;
