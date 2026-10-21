import verify from "./validation.js";
import resolve from "./resolve.js";
import format from "./format.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const cwdStatus = verify.cwd(cwd);
  const resolvedArgs = resolve(args);

  // ERROR HANDLING
  if (cwdStatus.error) {
    console.error("\nError: invalid cwd.");
    console.error(cwdStatus.error.message);
    process.exit(1);
  } else if (resolvedArgs.error) {
    console.error("\nError: unable to resolve args.");
    console.error(resolvedArgs.error.message + "\n");
    console.error(
      "Available Verbs: \n" +
        format.bulletList(resolvedArgs.error.alternativeVerbs, 2),
    );
    process.exit(1);
  }

  // CORE LOGIC
  const { workflow, params } = resolvedArgs;
  const context = { cwd, params: params ?? [], array: [] };
  executor({ workflow, context });
}

export default core;
