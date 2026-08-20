import verify from "./verify.js";
import resolve from "./resolve.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const { isValidCWD, error: cwdError } = verify.cwdValidity(cwd);
  const resolvedArgs = resolve(args);

  // ERROR HANDLING
  if (!isValidCWD) {
    console.error("Error: " + cwdError);
    process.exit(1);
  } else if ("error" in resolvedArgs) {
    console.error("Error: " + resolvedArgs.error);
    process.exit(1);
  }

  // CORE LOGIC
  const { workflow, params } = resolvedArgs;
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
