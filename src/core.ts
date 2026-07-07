import { isValidCWD } from "./verifier.js";
import resolver from "./resolver.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  isValidCWD(cwd);
  const { workflow, params } = resolver(args);

  // CORE LOGIC
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
