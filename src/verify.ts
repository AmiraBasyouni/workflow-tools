import { Context, Workflow } from "./types.js";

import fs from "node:fs";
import path from "node:path";
import process from "./process.js";

const verify = {
  isValidCWD(cwd: string): boolean {
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
  },
  async workflowRequirements({
    context,
    workflow,
  }: {
    context: Context;
    workflow: Workflow;
  }) {
    let allArePassing = true;
    // Validate all requirements asynchronously:
    const promises = workflow.requirements.map(async (requirement) => {
      const response = await process.runSteps(requirement.verificationSteps);
      if (response.success) {
        return { requirement, passing: true };
      } else {
        allArePassing = false;
        return { requirement, passing: false };
      }
    });

    // Wait until all requirement validations' promises are resolved.
    // The order of each requirement status matches the original array, not the completion order.
    const statuses = await Promise.all(promises);
    const failedRequirements = statuses
      .filter((req) => req.passing === false)
      .map((req) => req.requirement);

    return {
      allArePassing,
      failedRequirements: allArePassing ? undefined : failedRequirements,
    };
  },
};

export default verify;
