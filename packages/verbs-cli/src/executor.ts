import { Workflow, Context, Requirement } from "./types.js";

import verify from "./verify.js";
import runtime from "./runtime.js";
import format from "./format.js";

async function executor({
  workflow,
  context,
}: {
  workflow: Workflow;
  context: Context;
}) {
  // INPUT VALIDATION
  const verification = await verify.workflowRequirements({ workflow, context });

  // ERROR HANDLING
  if (!verification.allArePassing && verification.failedRequirements) {
    const errorMessage = handleFailedRequirements(
      verification.failedRequirements,
      workflow.name,
    );
    console.error("\nError: " + errorMessage);
    process.exit(1);
  } else if (!verification.allArePassing && !verification.failedRequirements) {
    console.error(
      "\nError: Workflow requirements did not pass. Failed requirements could not be detected.",
    );
    process.exit(1);
  }

  // CORE LOGIC
  if (verification.allArePassing) {
    runtime({ workflow, context});
  }
}

function handleFailedRequirements(
  failedRequirements: Requirement[],
  workflowName: string,
) {
  const message = `\nError: Failed to run workflow ${workflowName}, requirements not met:\n`;
  const bullets = failedRequirements.map(
    (req) => `${req.description}. ${req.fulfillmentInstructions}.`,
  );
  const list = format.bulletList(bullets);
  return message + list;
}

export default executor;
