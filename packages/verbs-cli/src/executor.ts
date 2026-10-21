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
  // WORKFLOW VALIDATION
  const requirementStatus = await verify.workflowRequirements({
    workflow,
    context,
  });
  const paramStatus = verify.params(
    (workflow.paramSpec ??= { count: 0, required: false }),
    (context.params ??= []),
    workflow.name,
  );

  // ERROR HANDLING
  if (requirementStatus.error) {
    console.error("\nError: Failed workflow requirements.");
    const errorMessage = getRequirementErrorMessage(
      requirementStatus.error.failedRequirements,
      workflow.name,
    );
    console.error(errorMessage);
    process.exit(1);
  }

  if (paramStatus.error) {
    console.error("\nError: Invalid params.");
    paramStatus.error.messages.forEach((message) =>
      console.error("  " + message),
    );
    console.error("");
    process.exit(1);
  }

  // CORE LOGIC
  if (requirementStatus.valid && paramStatus.valid) {
    runtime({ workflow, context });
  }
}

function getRequirementErrorMessage(
  failedRequirements: Requirement[],
  workflowName: string,
) {
  if (failedRequirements.length === 0) {
    const errorMessage = "\nFailed requirements could not be detected.";
    return errorMessage;
  } else {
    const errorMessage = `\nFailed to run workflow: "${workflowName}".\n\nRequirements not met:\n`;
    const bullets = failedRequirements.map(
      (req) =>
        `Expected: ${req.description}\nFix: ${req.fulfillmentInstructions}`,
    );
    const list = format.numberedList(bullets, 2);
    return errorMessage + list;
  }
}

export default executor;
