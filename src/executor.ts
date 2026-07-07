import { Context, Workflow } from "./types.js";

import verifier from "./verifier.js";

function executor({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  // INPUT VALIDATION
  const response = verifier({ context, workflow });
  if (response.status === "ok") {
    console.log({ context });
    console.log({ workflow });
  } else {
    throw new Error(response.errorMessage);
  }
}

export default executor;
