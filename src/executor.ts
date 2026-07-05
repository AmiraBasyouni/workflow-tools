import verifier from "./verifier";

function executor({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  // INPUT VALIDATION
  const response = verifier({ context, workflow });
  if (response === "ok") {
    console.log({ context });
    console.log({ workflow });
  } else {
    throw new Error(response.errorMessage);
  }
}

export default executor;
