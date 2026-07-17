import verify from "./verify.js";
import resolve from "./resolve.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  verify.isValidCWD(cwd);
  const { workflow, params } = resolve(args);

  // CORE LOGIC
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
