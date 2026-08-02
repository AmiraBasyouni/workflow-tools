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
    console.error("runtime: failed to run workflow.");
    return;
  }
}

export default runtime;
