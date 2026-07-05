import fs from "node:fs";
import path from "node:path";

function isValidCWD(cwd: string): boolean {
  const resolved = path.resolve(cwd);
  const stat = fs.statSync(resolved);

  if (!stat.isDirectory()) {
    throw new Error(
      `Invalid cwd: ${cwd}. The provided cwd is not a directory.`,
    );
  }

  if (!fs.existsSync(resolved)) {
    throw new Error(`Invalid cwd: ${cwd}. The provided cwd does not exist.`);
  }

  return true;
}

function verifier({ context, workflow }) {
  workflow.requirements.map((requirenment) => {
    console.log({ requirenment });
  });
  return "ok";
}

export { isValidCWD };
export default verifier;
