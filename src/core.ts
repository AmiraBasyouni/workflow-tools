import verify from "./verify.js";
import resolve from "./resolve.js";
import executor from "./executor.js";

function core(cwd: string, args: string[]) {
  // INPUT VALIDATION
  const { isValidCWD, error } = verify.cwdValidity(cwd);
  const { workflow, params } = resolve(args);

  // ERROR HANDLING
  if (!isValidCWD) {
    throw new Error(error);
  } else if (!workflow) {
    throw new Error("invalid workflow");
  } else if (!params) {
    throw new Error("invalid params");
  }

  // CORE LOGIC
  const context = { params, cwd };
  executor({ context, workflow });
}

export default core;
