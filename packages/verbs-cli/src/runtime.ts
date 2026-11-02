import { Workflow, Context } from "./types.js";

import execaProcess from "./process.js";

async function runtime({
  workflow,
  context,
}: {
  workflow: Workflow;
  context: Context;
}) {
  try {
    const response = await execaProcess.runSteps(workflow.steps, context);
    if (response.successful) {
      return;
    } else {
      console.error("");
      console.error("Error: workflow failed during execution.");
      console.error("");
      response.errorMessages?.forEach((message) =>
        console.error("  " + message),
      );
      console.error("");
      console.error("Workflow aborted.");
      console.error("");
      process.exit(1);
      return;
    }
  } catch (e) {
    console.error("");
    console.error("Error: workflow failed during execution.");
    console.error("");
    console.error("Unexpected error:");
    console.error(e + "\n");
    console.error("");
    console.error("Workflow aborted.");
    console.error("");
  }
}

export default runtime;
