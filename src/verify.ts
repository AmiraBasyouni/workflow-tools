import { Context, Workflow, Step } from "./types.js";

import fs from "node:fs";
import path from "node:path";
import process from "./process.js";

const verify = {
  cwdValidity(cwd: string) {
    if (typeof cwd != "string") {
      const error = `Invalid cwd. A cwd must be of type string, received type ${typeof cwd}.`;
      return { isValidCWD: false, error };
    }

    if (cwd === "") {
      const error = `Invalid cwd. The provided cwd is an empty string.`;
      return { isValidCWD: false, error };
    }

    const resolvedPath = path.resolve(cwd);
    const stat = fs.statSync(resolvedPath);

    if (!stat.isDirectory()) {
      const error = `Invalid cwd: ${cwd}. The provided cwd is not a directory.`;
      return { isValidCWD: false, error };
    }

    if (!fs.existsSync(resolvedPath)) {
      const error = `Invalid cwd: ${cwd}. The provided cwd does not exist.`;
      return { isValidCWD: false, error };
    }

    return { isValidCWD: true };
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
      if (response.successful) {
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
      .filter((req) => !req.passing)
      .map((req) => req.requirement);

    return {
      allArePassing,
      failedRequirements:
        allArePassing && failedRequirements.length === 0
          ? undefined
          : failedRequirements,
    };
  },
  stepValidity(step: Step) {
    const warnings: string[] = [];
    // Verify type:
    const stepType = step.type;
    if (stepType && typeof stepType != "string") {
      warnings.push("invalid type");
    }
    // Verify program:
    const stepProgram = step.program;
    if (!stepProgram || typeof stepProgram != "string") {
      warnings.push("invalid program");
    }
    // Verify args:
    const stepArgs = step.args;
    if (stepArgs && !Array.isArray(stepArgs)) {
      warnings.push("invalid arguments");
    }
    // Verify step options: pipe and timeout.
    const stepOptions = step.options;
    if (stepOptions?.timeout && typeof stepOptions?.timeout != "number") {
      warnings.push("invalid timeout");
    }
    if (stepOptions?.pipe) {
      switch (stepOptions.pipe) {
        case "stream":
        case "buffer":
        case undefined:
          break;
        default:
          warnings.push(`invalid pipe option: ${stepOptions?.pipe}`);
      }
    }
    // return validity
    if (warnings.length > 0) {
      return { valid: false, warnings };
    } else {
      return { valid: true };
    }
  },
};

export default verify;
