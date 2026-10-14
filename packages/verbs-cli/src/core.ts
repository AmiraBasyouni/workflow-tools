import verify from "./validation.js";
import resolve from "./resolve.js";
import format from "./format.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const { isValidCWD, cwdError } = verify.cwd(cwd);
  const resolvedArgs = resolve(args);

  // ERROR HANDLING
  if (!isValidCWD) {
    console.error("\nError: " + cwdError);
    process.exit(1);
  } else if ("error" in resolvedArgs) {
    console.error("\nError: " + resolvedArgs.error + "\n");
    console.error(
      "Available Verbs: \n" +
        format.bulletList(resolvedArgs.alternativeVerbs, 2),
    );
    process.exit(1);
  }

  // CORE LOGIC
  const { workflow, params } = resolvedArgs;
  const context = { params, cwd, array: [""] };
  executor({ workflow, context });
}

export default core;
