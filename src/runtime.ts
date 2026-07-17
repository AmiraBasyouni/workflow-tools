import { Context, Workflow } from "./types.js";

function runtime({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  console.log({ context });
  console.log({ workflow });
}

export default runtime;
