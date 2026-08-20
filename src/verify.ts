import { Context, Workflow } from "./types.js";

import fs from "node:fs";
import path from "node:path";
import process from "./process.js";

const verify = {
  cwdValidity(cwd: unknown) {
    if (typeof cwd != "string") {
      const error = `Invalid cwd. A cwd must be of type string, received type ${typeof cwd}.`;
      return { isValidCWD: false, error };
    }

    if (cwd === "") {
      const error = `Invalid cwd. The provided cwd is an empty string: ${cwd}.`;
      return { isValidCWD: false, error };
    }

    const resolvedPath = path.resolve(cwd);
    const stat = fs.statSync(resolvedPath);

    if (!stat.isDirectory()) {
      const error = `Invalid cwd. The provided cwd is not a directory: ${cwd}.`;
      return { isValidCWD: false, error };
    }

    if (!fs.existsSync(resolvedPath)) {
      const error = `Invalid cwd. The provided cwd does not exist: ${cwd}.`;
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
    // Validate requirements asynchronously:
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
  stepValidity(step: unknown) {
    const errors = {
      invalidStep: false,
      invalidType: false,
      invalidProgram: false,
      invalidArguments: false,
      invalidOptions: false,
      invalidTimeout: false,
      invalidPipeOption: false,
    };
    const errorMessages: string[] = [];
    // Verify type of step:
    if (!step || typeof step != "object") {
      errors.invalidStep = true;
      errorMessages.push(`invalid step: ${step}`);
      return { valid: false, errors, errorMessages };
    }
    const { type, program, args, options } = step as {
      type?: unknown;
      program?: unknown;
      args?: unknown;
      options?: unknown;
    };
    // Verify step type:
    if (!type || typeof type != "string") {
      errorMessages.push(`invalid type: ${type}`);
      errors.invalidType = true;
    }
    // Verify step program:
    if (!program || typeof program != "string") {
      errorMessages.push(`invalid program: ${program}`);
      errors.invalidProgram = true;
    }
    // Verify step args:
    if (!args || !Array.isArray(args)) {
      errorMessages.push(`invalid arguments: ${args}`);
      errors.invalidArguments = true;
    }
    // Verify step options
    if (options || options === null) {
      // reject wrong types and null
      if (typeof options != "object" || options === null) {
        errorMessages.push(`invalid options: ${options}`);
        errors.invalidOptions = true;
      } else {
        // for verify options: pipe and timeout,
        const { timeout, pipe } = options as {
          timeout?: unknown;
          pipe?: unknown;
        };
        if (timeout === null || (timeout && typeof timeout != "number")) {
          errorMessages.push(`invalid timeout: ${timeout}`);
          errors.invalidTimeout = true;
        }
        if (pipe || pipe === null) {
          switch (pipe) {
            case "stream":
            case "buffer":
            case undefined:
              break;
            default:
              errorMessages.push(`invalid pipe option: ${pipe}`);
              errors.invalidPipeOption = true;
          }
        }
      }
    }
    // return validity
    if (errorMessages.length > 0) {
      return { valid: false, errors, errorMessages };
    } else {
      return { valid: true, errors };
    }
  },
};

export default verify;
