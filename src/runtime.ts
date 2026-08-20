import { Context, Workflow } from "./types.js";

import process from "./process.js";

async function runtime({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  const response = await process.runSteps(workflow.steps);
  if (response.successful) {
    //console.log({ context });
    //console.log({ workflow });
    return;
  } else {
    console.error("Error: Failed to run workflow steps.");
    console.error(response.errorMessages);
    return;
  }
}

export default runtime;
