import verify from "./verify.js";
import resolve from "./resolve.js";
import format from "./format.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const { isValidCWD, error: cwdError } = verify.cwdValidity(cwd);
  const resolvedArgs = resolve(args);

  // ERROR HANDLING
  if (!isValidCWD) {
    console.error("\nError: " + cwdError);
    process.exit(1);
  } else if ("error" in resolvedArgs) {
    console.error("\nError: " + resolvedArgs.error + "\n");
    console.error(
      "Available Verbs: \n" + format.bulletList(resolvedArgs.alternativeVerbs),
    );
    process.exit(1);
  }

  // CORE LOGIC
  const { workflow, params } = resolvedArgs;
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
