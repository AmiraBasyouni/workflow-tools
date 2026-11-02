import { Workflow, Context, ParamSpec } from "./types.js";

import fs from "node:fs";
import path from "node:path";
import process from "./process.js";

const verify = {
  cwd(cwd: unknown) {
    if (typeof cwd != "string") {
      const errorMessage = `Invalid cwd. A cwd must be of type string, received type ${typeof cwd}.`;
      return { valid: false, error: { message: errorMessage } };
    }

    if (cwd === "") {
      const errorMessage = `Invalid cwd. The provided cwd is an empty string: ${cwd}.`;
      return { valid: false, error: { message: errorMessage } };
    }

    const resolvedPath = path.resolve(cwd);
    const stat = fs.statSync(resolvedPath);

    if (!stat.isDirectory()) {
      const errorMessage = `Invalid cwd. The provided cwd is not a directory: ${cwd}.`;
      return { valid: false, error: { message: errorMessage } };
    }

    if (!fs.existsSync(resolvedPath)) {
      const errorMessage = `Invalid cwd. The provided cwd does not exist: ${cwd}.`;
      return { valid: false, error: { message: errorMessage } };
    }

    return { valid: true };
  },
  async workflowRequirements({
    workflow,
    context,
  }: {
    workflow: Workflow;
    context: Context;
  }) {
    let allArePassing = true;
    // Validate requirements asynchronously:
    const promises = workflow.requirements.map(async (requirement) => {
      const response = await process.runSteps(
        requirement.verificationSteps,
        context,
      );
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

    if (allArePassing && failedRequirements.length === 0) {
      return { valid: true, requirements: statuses };
    } else {
      return {
        valid: false,
        error: { failedRequirements },
        requirements: statuses,
      };
    }
  },
  step(step: unknown) {
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
  paramSpec(paramSpec: {
    type?: unknown;
    min?: unknown;
    max?: unknown;
    value?: unknown;
    values?: unknown;
  }): {
    valid: boolean;
    error?: { messages: string[][]; flags: Record<string, boolean> };
  } {
    const errorFlags = {
      invalidParamSpec: false,
      invalidType: false,
      invalidMin: false,
      invalidMax: false,
      invalidValues: false,
      invalidValue: false,
    };
    const errorMessages: string[][] = [];
    // VALIDATE shape:
    // paramSpec
    if (!paramSpec) {
      errorFlags.invalidParamSpec = true;
      errorMessages.push([
        `Missing paramSpec (param specification).`,
        `Expected: object with property type.`,
        `Received: ${JSON.stringify(paramSpec)}`,
      ]);
      return {
        valid: false,
        error: { messages: errorMessages, flags: errorFlags },
      };
    }

    const { type, min, max, value, values } = paramSpec;
    // type
    const isString = (t: unknown) => typeof t === "string";
    const isNumber = (n: unknown) => typeof n === "number";
    const isInteger = (n: unknown) =>
      typeof n === "number" && Number.isInteger(n);
    const correctValue = (v: string) =>
      v === "range" || v === "oneOf" || v === "exact";
    if (!isString(type) || (isString(type) && !correctValue(type))) {
      errorFlags.invalidType = true;
      errorMessages.push([
        `Expected property: type.`,
        `Permissible types: "range", "oneOf", "exact".`,
        `Received type: ${JSON.stringify(paramSpec.type)}`,
      ]);
    }
    if (type === "range") {
      // min
      if (!isInteger(min) || (isNumber(min) && min < 0)) {
        errorFlags.invalidMin = true;
        errorMessages.push([
          `Received type: "range", which requires property: min.`,
          `Expected min: an integer equal to or greater than 0.`,
          `Received min: ${JSON.stringify(paramSpec.min)}`,
        ]);
      }
      // max
      if (
        (!isInteger(max) && max !== null) ||
        (isNumber(min) && isNumber(max) && max < min) ||
        (isNumber(max) && max < 0)
      ) {
        errorFlags.invalidMax = true;
        errorMessages.push([
          `Received type: "range", which requires property: max.`,
          `Expected max: an integer greater than or equal to min, or null to indicate infinite range.`,
          `Received max: ${JSON.stringify(paramSpec.max)}`,
          `Received min: ${JSON.stringify(paramSpec.min)}`,
        ]);
      }
    }
    if (type === "oneOf") {
      const validValues =
        Array.isArray(values) && values.every((v) => isInteger(v) && v >= 0);
      // values
      if (!validValues || (Array.isArray(values) && values.length === 0)) {
        errorFlags.invalidValues = true;
        errorMessages.push([
          `Received type: "oneOf", which requires property: values.`,
          `Expected values: an array of integers greater than or equal to 0.`,
          `Received values: ${JSON.stringify(paramSpec.values)}`,
        ]);
      }
    }
    if (type === "exact") {
      // value
      if (!isInteger(value) || (isNumber(value) && value < 0)) {
        errorFlags.invalidValue = true;
        errorMessages.push([
          `Received type: "exact", which requires property: value.`,
          `Expected value: an integer greater than or equal to 0.`,
          `Received value: ${JSON.stringify(paramSpec.value)}`,
        ]);
      }
    }
    // return validity
    if (errorMessages.length > 0) {
      return {
        valid: false,
        error: { messages: errorMessages, flags: errorFlags },
      };
    } else {
      return { valid: true };
    }
  },
  params(
    paramSpec: ParamSpec,
    params: string[],
  ): { valid: boolean; error?: { messages: string[] } } {
    // VALIDATE content:
    if (paramSpec.type === "range") {
      if (
        (paramSpec.max && params.length > paramSpec.max) ||
        params.length < paramSpec.min
      ) {
        return {
          valid: false,
          error: {
            messages: [
              `Expected at least ${paramSpec.min} and at most ${paramSpec.max} params.`,
              `Received ${params.length} params.`,
            ],
          },
        };
      } else {
        return { valid: true };
      }
    } else if (paramSpec.type === "oneOf") {
      if (!paramSpec.values.includes(params.length)) {
        return {
          valid: false,
          error: {
            messages: [
              `Expected number of params to be one of the following: ${JSON.stringify(paramSpec.values)}.`,
              `Received ${params.length} params.`,
            ],
          },
        };
      } else {
        return { valid: true };
      }
    } else if (paramSpec.type === "exact") {
      if (params.length !== paramSpec.value) {
        return {
          valid: false,
          error: {
            messages: [
              `Expected exactly ${paramSpec.value} params.`,
              `Received ${params.length} params.`,
            ],
          },
        };
      } else {
        return { valid: true };
      }
    }
    return {
      valid: false,
      error: {
        messages: [
          `Expected type "range", "oneOf", or "exact".`,
          `Received ${paramSpec}.`,
        ],
      },
    };
  },
};

export default verify;
