import { Step } from "./types.js";

import { execa, type Result } from "execa";

const process = {
  async runSteps(steps: Step[]) {
    // Run all steps.
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const { program, args, timeout } = step;
        const { error } = await process.runStep(program, args, timeout);
        // Step failure caught by execa
        if (error) {
          return {
            success: false,
            message: `Failed to execute ${step}. Error: ${error.message}`,
          };
        }
        // Step failure not caught by execa
      } catch (error) {
        return {
          success: false,
          message: `Failed to execute ${step}. Error: ${error}`,
        };
      }
    }
    // All steps completed successfully.
    return { success: true };
  },
  async runStep(
    program: string,
    args: string[],
    timeout: number | undefined = undefined,
  ) {
    // Option "timeout" is in milliseconds.
    // A false reject will return errors instead of throwing exceptions.
    const resultOrError = await execa(program, args, {
      timeout,
      reject: false,
    });
    const response: { result: undefined | Result; error: undefined | Result } =
      { result: undefined, error: undefined };
    if (resultOrError.failed) {
      response.error = resultOrError;
    } else {
      response.result = resultOrError;
    }

    return response;
  },
};

export default process;
