import { isValidCWD } from "./verifier";
import resolver from "./resolver";
import executor from "./executor";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  isValidCWD(cwd);
  const { workflow, params }: { Workflow; Params } = resolver(args);

  // CORE LOGIC
  const context: Context = { params, cwd };
  executor({ context, workflow });
}

export default core;
