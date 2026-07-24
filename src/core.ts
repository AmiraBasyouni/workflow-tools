import verify from "./verify.js";
import resolve from "./resolve.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const { isValidCWD, error: cwdError } = verify.cwdValidity(cwd);
  const resolvedArgs = resolve(args);

  // ERROR HANDLING
  if (!isValidCWD) {
    throw new Error(cwdError);
  } else if ("error" in resolvedArgs) {
    throw new Error(resolvedArgs.error);
  }

  // CORE LOGIC
  const { workflow, params } = resolvedArgs;
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
