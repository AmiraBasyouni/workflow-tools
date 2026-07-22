import { Step, StepOptions } from "./types.js";
import { Result, ResultPromise } from "./typesExeca.js";

import { execa } from "execa";

const process = {
  async runSteps(steps: Step[]) {
    // Cache previous result and previous result promise:
    let prevStepResult: Result | undefined = undefined;
    let prevStepResultPromise: ResultPromise | undefined = undefined;
    // Go through the steps array:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, args, options } = currentStep;
      let resultPromise: ResultPromise | undefined = undefined;
      try {
        // Run a step, capture result promise:
        switch (options.pipe) {
          case "stream": {
            resultPromise = process.runStep(program, args, {
              ...options,
              prevResultPromise: prevStepResultPromise,
            });
            prevStepResultPromise = resultPromise;
            prevStepResult = undefined;
            break;
          }
          case "buffer": {
            resultPromise = process.runStep(program, args, {
              ...options,
              prevResult: prevStepResult,
            });
            break;
          }
          case undefined: {
            resultPromise = process.runStep(program, args, options);
          }
        }

        // Resolve result promise:
        if (options.pipe === "buffer" || !options.pipe) {
          const { result, error } = await resolveResultPromise(resultPromise);
          if (result) {
            prevStepResult = result;
            prevStepResultPromise = undefined;
          }
          // ERROR HANDLING: Step failure caught by execa.
          if (error) {
            prevStepResult = undefined;
            prevStepResultPromise = undefined;
            return {
              successful: false,
              message: `Failed to execute ${currentStep}. Error: ${error.message}`,
            };
          }
        }
        // ERROR HANDLING: Step failure not caught by execa.
      } catch (error) {
        return {
          successful: false,
          message: `Failed to execute ${currentStep}. Error: ${error}`,
        };
      }
    }
    // All steps have been completed successfully.
    return { successful: true };
  },
  runStep(program: string, args: string[], stepOptions?: StepOptions) {
    // SET execa options:
    // "timeout" is in milliseconds.
    // A false "reject" will return errors instead of throwing exceptions.
    const execaOptions = {
      timeout: stepOptions?.timeout,
      reject: false,
      stdin:
        stepOptions?.pipe === "buffer"
          ? [[stepOptions.prevResult?.stdout]]
          : stepOptions?.pipe === "stream"
            ? [[stepOptions.prevResultPromise]]
            : undefined,
    };

    // EXECUTE step:
    const resultPromise = execa(program, args, execaOptions);

    return resultPromise;
  },
};

// Resolve result promise:
async function resolveResultPromise(resultPromise: ResultPromise) {
  const resultOrError = await resultPromise;
  const response: {
    result: undefined | Result;
    error: undefined | Result;
  } = { result: undefined, error: undefined };
  if (resultOrError.failed) {
    response.error = resultOrError;
  } else {
    response.result = resultOrError;
  }
  return response;
}

export default process;
