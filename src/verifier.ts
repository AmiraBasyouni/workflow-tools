import { Context, Workflow } from "./types.js";

import fs from "node:fs";
import path from "node:path";

function isValidCWD(cwd: string): boolean {
  const resolvedPath = path.resolve(cwd);
  const stat = fs.statSync(resolvedPath);

  if (!stat.isDirectory()) {
    throw new Error(
      `Invalid cwd: ${cwd}. The provided cwd is not a directory.`,
    );
    return false;
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Invalid cwd: ${cwd}. The provided cwd does not exist.`);
    return false;
  }

  return true;
}

function verifier({
  context,
  workflow,
}: {
  context: Context;
  workflow: Workflow;
}) {
  workflow.requirements.map((requirement) => {
    console.log({ requirement });
  });
  return { status: "ok", errorMessage: undefined };
}

export { isValidCWD };
export default verifier;
