import { Step, StepOptions, Context } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa } from "execa";
import verify from "./verify.js";

const process = {
  async runSteps(steps: Step[], context: Context) {
    // CACHE previous step and current step:
    const prevStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
      options: StepOptions | undefined;
    } = {
      result: undefined,
      resultPromise: undefined,
      options: undefined,
    };

    const currStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
    } = { result: undefined, resultPromise: undefined };

    // ITERATE steps:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, args, options } = currentStep;

      try {
        // VALIDATE step:
        const stepValidity = verify.stepValidity(currentStep);
        if (!stepValidity.valid) {
          // error-Messages: warnings array as a string: "warning_1, warning_2, ...":
          return {
            successful: false,
            errorMessages: [
              `Invalid step: ${JSON.stringify(currentStep)}.`,
              `Errors:`,
              `${stepValidity.errorMessages?.toString()}.`,
            ],
          };
        }
        // If current step stdin = pipe but prev-step stdout != pipe, halt with error.
        if (options?.stdin === "pipe" && prevStep?.options?.stdout !== "pipe") {
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Pipe error:",
              `  Previous step stdout: ${JSON.stringify(prevStep.options?.stdin)}.`,
              `  Current step stdin: ${JSON.stringify(currentStep.options?.stdin)}.\n`,
              `  Expected: 'Previous step stdout: "pipe".'`,
            ],
          };
        } else if (options?.stdin === "pipe" && !prevStep?.resultPromise) {
          // If current step stdin = pipe & streams, prev-step should have returned a promise.
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Pipe error:",
              `  Previous step:`,
              `    stdout: ${JSON.stringify(prevStep.options?.stdout)}.`,
              `  Current step:`,
              `    stdin: ${JSON.stringify(currentStep.options?.stdin)}.`,
              `  Expected:`,
              //`    Previous step: stdoutPipe: "stream"`,
              `    previous step to return a promise.`,
            ],
          };
        }

        // RUN STEP
        if (options?.stdin === "pipe") {
          // OPTIONS: if stdin = pipe, supply prev-step.
          if (prevStep.resultPromise) {
            currStep.resultPromise = process.runStep(program, args, {
              ...options,
            });
            prevStep.resultPromise.pipe(currStep.resultPromise);
          }
        } else {
          // OPTIONS: if stdin != pipe, disregard prev-step.
          currStep.resultPromise = process.runStep(program, args, options);
        }
        prevStep.options = options;

        // RESOLVE RESULT-PROMISE
        const stdout = options?.stdout;
        const stdoutIsStreaming = stdout === "pipe"; //&& options?.stdoutPipe === "stream";
        if (!stdoutIsStreaming && currStep.resultPromise) {
          // RESOLVE PROMISE
          const { result, error } = await process.utils.resolveResultPromise(
            currStep.resultPromise,
          );
          // if no execa-errors, record result and print progress message:
          if (result) {
            currStep.result = result;
            process.utils.printProgressMessage(currentStep.description);
            // if execa-errors:
          } else if (error) {
            // ERROR HANDLING: in case of Step failure caught by execa.
            prevStep.result = undefined;
            prevStep.resultPromise = undefined;
            return {
              successful: false,
              errorMessages: [
                `Failed to execute step: ${JSON.stringify(currentStep)}.`,
                `Execa:`,
                `${error.message}`,
              ],
            };
          }
        } else if (stdoutIsStreaming && i === steps.length - 1) {
          throw new Error(
            "Cannot stream stdout from the final step because there is no next step.",
          );
        }

        // CACHE STEP
        if (options?.stdout === "pipe") {
          prevStep.result = undefined;
          prevStep.resultPromise = currStep.resultPromise;
        } else {
          prevStep.result = currStep.result;
          prevStep.resultPromise = undefined;
          break;
        }

        // ERROR HANDLING: in case of Step failure not caught by execa.
      } catch (error) {
        return {
          successful: false,
          errorMessages: [`Failed to execute ${currentStep}. Error: ${error}`],
        };
      }
    }
    // All steps have been completed successfully.
    return { successful: true };
  },
  runStep(program: string, args: string[], stepOptions?: StepOptions) {
    // SET EXECA OPTIONS:
    // "timeout" is in milliseconds.
    // A false "reject" will return errors instead of throwing exceptions.
    // execa stdin/out/err all default to 'pipe', which does not benefit my users.
    // Instead, users can rely on pipe: buffer | stream
    // stdin: 'inherit', stdout: 'inherit', stderr: 'inherit', direct everything to the terminal.
    const execaOptions = {
      ...stepOptions,
    };

    // EXECUTE step:
    const resultPromise = execa(program, args, execaOptions);

    return resultPromise;
  },
  utils: {
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
    printProgressMessage(message: string | undefined) {
      if (message) {
        console.log(message);
      }
    },
  },
};

export default process;
