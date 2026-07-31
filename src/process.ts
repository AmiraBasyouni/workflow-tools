import { Step, StepOptions } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa } from "execa";
import verify from "./verify.js";

const process = {
  async runSteps(steps: Step[]) {
    // CACHE previous result and previous result promise:
    let prevStepResult: Result | undefined = undefined;
    let prevStepResultPromise: ResultPromise | undefined = undefined;
    // ITERATE steps array:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, args, options } = currentStep;
      let resultPromise: ResultPromise | undefined = undefined;
      try {
        // VALIDATE step:
        const { valid, errorMessages } = verify.stepValidity(currentStep);
        if (!valid) {
          // Warnings array as a string: "warning_1, warning_2, ...":
          return {
            successful: false,
            errorMessage: `Invalid step: ${currentStep}. Errors: ${errorMessages?.toString()}.`,
          };
        }
        // RUN step, capture result promise:
        switch (options?.pipe) {
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
        if (options?.pipe === "buffer" || !options?.pipe) {
          const { result, error } =
            await process.util.resolveResultPromise(resultPromise);
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
              errorMessage: `Failed to execute ${currentStep}. Error: ${error.message}`,
            };
          }
        }
        // ERROR HANDLING: Step failure not caught by execa.
      } catch (error) {
        return {
          successful: false,
          errorMessage: `Failed to execute ${currentStep}. Error: ${error}`,
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
  util: {
    async resolveResultPromise(resultPromise: ResultPromise) {
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
    },
  },
};

export default process;
