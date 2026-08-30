import { Workflow, Context } from "./types.js";

import process from "./process.js";

async function runtime({
  workflow,
  context,
}: {
  workflow: Workflow;
  context: Context;
}) {
  try {
    const response = await process.runSteps(workflow.steps, context);
    if (response.successful) {
      return;
    } else {
      console.error("\nError: Failed to run workflow.\n");
      response.errorMessages?.forEach(message => console.error("  " + message))
      console.error("");
      return;
    }
  } catch (e) {
    console.error("\nError: Failed to run workflow.\n");
    console.error("Unexpected error:");
    console.error(e + "\n");
  }
}

export default runtime;
