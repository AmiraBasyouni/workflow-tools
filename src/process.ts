import { Step, StepOptions, Context } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa } from "execa";
import verify from "./verify.js";

const process = {
  async runSteps(steps: Step[], context: Context) {
    // CACHE previous result and previous result promise:
    const prevStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
      options: StepOptions | undefined;
    } = {
      result: undefined,
      resultPromise: undefined,
      options: undefined,
    };
    // ITERATE steps:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, args, options } = currentStep;
      let resultPromise: ResultPromise | undefined = undefined;

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
        // If current step says stdin = pipe but prev-step says stdout != pipe, halt with error.
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
        } else if (
          options?.stdin === "pipe" &&
          options?.stdinPipe === "stream" &&
          !prevStep?.resultPromise
        ) {
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Pipe error: current step expects stdin: 'pipe' through stdinPipe: 'stream', " +
                "but previous step failed to stream.\nCheck that stdout: 'pipe' and stdoutPipe: 'stream'.",
              `  Previous step:`,
              `    stdout: ${JSON.stringify(prevStep.options?.stdout)}.`,
              `    stdoutPipe: ${JSON.stringify(prevStep.options?.stdoutPipe)}.`,
              `  Current step:`,
              `    stdin: ${JSON.stringify(currentStep.options?.stdin)}.`,
              `    stdinPipe: ${JSON.stringify(prevStep.options?.stdinPipe)}.\n`,
              `  Expected: 'Previous step stdoutPipe: "stream"'`,
            ],
          };
        }

        // RESOLVE PREV-STEP-PROMISE
        const stdin = options?.stdin;
        const stdinIsStreaming =
          stdin === "pipe" && options?.stdinPipe === "stream";
        if (prevStep.resultPromise && !stdinIsStreaming) {
          const { result, error } = await process.utils.resolveResultPromise(
            prevStep.resultPromise,
          );
          // & CACHE PREV-STEP
          // if no execa-errors, cache result:
          if (result) {
            prevStep.result = result;
            prevStep.resultPromise = undefined;
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
        }

        // RUN STEP
        if (options?.stdin === "pipe") {
          // OPTIONS: if stdin = pipe, supply prev-step.
          switch (options?.stdinPipe) {
            // If pipe-stdin = stream, pass prev-step-result-promise to stdin
            case "stream": {
              resultPromise = process.runStep(program, args, {
                ...options,
                prevStep: {
                  result: undefined,
                  resultPromise: prevStep.resultPromise,
                },
              });
              prevStep.resultPromise = resultPromise;
              prevStep.result = undefined;
              break;
            }
            // If pipe-stdin is undefined, default to buffer.
            // If pipe-stdin = buffer, pass prev-step-result to stdin
            case undefined:
            case "buffer": {
              resultPromise = process.runStep(program, args, {
                ...options,
                prevStep: {
                  result: prevStep.result,
                  resultPromise: undefined,
                },
              });
              break;
            }
          }
        } else {
          // OPTIONS: if stdin != pipe, disregard prev-step.
          resultPromise = process.runStep(program, args, options);
        }
        prevStep.options = options;

        // RESOLVE RESULT-PROMISE
        const stdout = options?.stdout;
        const stdoutIsStreaming =
          stdout === "pipe" && options?.stdoutPipe === "stream";
        if (!stdoutIsStreaming) {
          // RESOLVE PROMISE
          const { result, error } =
            await process.utils.resolveResultPromise(resultPromise);
          // & CACHE PREV-STEP
          // if no execa-errors, cache result:
          if (result) {
            prevStep.result = result;
            prevStep.resultPromise = undefined;
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
      pipe: undefined,
      prevStep: undefined,
      stdin:
        stepOptions?.stdinPipe === "buffer"
          ? [[stepOptions.prevStep?.result?.stdout]]
          : stepOptions?.stdinPipe === "stream"
            ? [[stepOptions.prevStep?.resultPromise]]
            : stepOptions?.stdin,
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
    handleExecaError() {},
  },
};

export default process;
