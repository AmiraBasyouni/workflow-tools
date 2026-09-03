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
      console.error("\nError: workflow aborted.\n");
      response.errorMessages?.forEach((message) =>
        console.error("  " + message),
      );
      console.error("");
      process.exit(1);
      return;
    }
  } catch (e) {
    console.error("\nError: workflow aborted.\n");
    console.error("Unexpected error:");
    console.error(e + "\n");
  }
}

export default runtime;
