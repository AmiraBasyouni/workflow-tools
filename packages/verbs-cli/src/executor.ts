import { Workflow, Context, Requirement } from "./types.js";

import verify from "./validation.js";
import runtime from "./runtime.js";
import format from "./format.js";

async function executor({
  workflow,
  context,
}: {
  workflow: Workflow;
  context: Context;
}) {
  // WORKFLOW REQUIREMENTS VALIDATION
  const { failedRequirements, allArePassing } =
    await verify.workflowRequirements({ workflow, context });

  // ERROR HANDLING
  if (!allArePassing && failedRequirements) {
    const errorMessage = handleFailedRequirements(
      failedRequirements,
      workflow.name,
    );
    console.error("\nError: " + errorMessage);
    process.exit(1);
  } else if (!allArePassing && !failedRequirements) {
    console.error(
      "\nError: Workflow requirements did not pass. Failed requirements could not be detected.",
    );
    process.exit(1);
  }

  // CORE LOGIC
  if (allArePassing) {
    runtime({ workflow, context });
  }
}

function handleFailedRequirements(
  failedRequirements: Requirement[],
  workflowName: string,
) {
  const message = `Failed to run workflow: "${workflowName}".\n\nRequirements not met:\n`;
  const bullets = failedRequirements.map(
    (req) =>
      `Expected: ${req.description}\nFix: ${req.fulfillmentInstructions}`,
  );
  const list = format.numberedList(bullets, 2);
  return message + list;
}

export default executor;
