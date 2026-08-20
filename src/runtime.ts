import { Workflow, Context } from "./types.js";

import process from "./process.js";

async function runtime({
  workflow,
  context,
}: {
  workflow: Workflow;
  context: Context;
}) {
  const response = await process.runSteps(workflow.steps, context);
  if (response.successful) {
    //console.log({ context });
    //console.log({ workflow });
    return;
  } else {
    console.error("\nError: Failed to run workflow steps.");
    console.error(response.errorMessages);
    return;
  }
}

export default runtime;
