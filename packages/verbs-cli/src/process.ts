import { Step, StepOptions, Context } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa, Options } from "execa";
import verify from "./validation.js";

const process = {
  async runSteps(steps: Step[], context: Context) {
    // CACHE previous step:
    const prevStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
      options: StepOptions | undefined;
    } = {
      result: undefined,
      resultPromise: undefined,
      options: undefined,
    };

    // CACHE current step:
    const currStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
    } = { result: undefined, resultPromise: undefined };

    // ITERATE steps:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, args, options } = currentStep;

      try {
        // VALIDATE current step:
        const stepValidity = verify.step(currentStep);
        if (!stepValidity.valid) {
          return {
            successful: false,
            errorMessages: [
              `Invalid step: ${JSON.stringify(currentStep)}.`,
              `Errors:`,
              // error-Messages: warnings array as a string: "warning_1, warning_2, ...":
              `${stepValidity.errorMessages?.toString()}.`,
            ],
          };
        }

        // VALIDATE options (stdin/stdout):
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
        // VALIDATE context:
        // If current step stdin = context but context is empty
        if (options?.stdin === "context" && context.array.length < 2) {
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Context error:",
              "  Context is empty.",
            ],
          };
        }

        // RUN step: ---------------------------------------------------------------------------------
        if (options?.stdin === "pipe" && prevStep.resultPromise) {
          // options: if stdin = pipe, use prev-step.
          currStep.resultPromise = process.runStep(program, args, {
            ...options,
          });
          // STREAM
          prevStep.resultPromise.pipe(currStep.resultPromise);
        } else if (options?.stdin === "buffer" && prevStep.result?.stdout) {
          // options: if stdin = buffer, use prev-step.
          currStep.resultPromise = process.runStep(program, args, {
            ...options,
            stdin: [[prevStep.result.stdout]],
          });
        } else if (options?.stdin === "context" && context.array.length > 1) {
          // options: if stdin = context,

          // replace CONTEXT_1 with context.array[1], CONTEXT_2 with context.array[2], etc.
          const contextFlags = {
            argsContainsContextVariable: false,
            contextVariableNotFound: { bool: false, variable: "" },
          };
          const newArgs = args.map((arg) => {
            // look for format "CONTEXT_<number>"
            if (/^CONTEXT_\d+$/.test(arg)) {
              // extract the number
              const match = arg.match(/\d+$/);
              const number = match ? Number(match[0]) : undefined;
              // if a context exists at said number, replace arg with context
              if (number && context.array[number]) {
                contextFlags.argsContainsContextVariable = true;
                return context.array[number];
              } else {
                contextFlags.contextVariableNotFound.bool = true;
                contextFlags.contextVariableNotFound.variable = arg;
                return arg;
              }
            } else {
              return arg;
            }
          });

          if (!contextFlags.argsContainsContextVariable) {
            // if stdin = context but args doesn't contain a context variable,
            return {
              successful: false,
              errorMessages: [
                `Failed to run step: ${JSON.stringify(currentStep)}.`,
                "Context error:",
                `  Missing context variable.`,
                `  stdin = 'context' but args does not contain a context variable (e.g. CONTEXT_1).`,
              ],
            };
          } else if (contextFlags.contextVariableNotFound.bool) {
            // if stdin = context but a context variable doesn't successfully map to a value,
            return {
              successful: false,
              errorMessages: [
                `Failed to run step: ${JSON.stringify(currentStep)}.`,
                "Context error:",
                `  Failed to retrieve context variable ${contextFlags.contextVariableNotFound.variable}.`,
              ],
            };
          }

          // run step with resolved context variables.
          currStep.resultPromise = process.runStep(program, newArgs, options);
        } else {
          // options: if stdin != pipe/buffer, disregard prev-step.
          currStep.resultPromise = process.runStep(program, args, options);
        }
        // CACHE options:
        prevStep.options = options;

        const stdout = options?.stdout;
        const stdoutIsStreaming = stdout === "pipe";
        if (!stdoutIsStreaming && currStep.resultPromise) {
          // RESOLVE PROMISE (result-promise):
          const { result, error } = await process.utils.resolveResultPromise(
            currStep.resultPromise,
          );

          // SUCCESS HANDLING when promise resolves:
          // if no execa-errors, record result and print progress message:
          if (result) {
            // CACHE resolved result:
            currStep.result = result;
            process.utils.printProgressMessage(currentStep.description);
          } else if (error) {
            // ERROR HANDLING when execa errors:
            // Empty the cache:
            prevStep.result = undefined;
            prevStep.resultPromise = undefined;
            // Return unsuccessful:
            return {
              successful: false,
              errorMessages: [
                `Failed to execute step: ${JSON.stringify(currentStep)}.`,
                `Execa Error: ${error.message}`,
              ],
            };
          }
        } else if (stdoutIsStreaming && i === steps.length - 1) {
          throw new Error(
            "Cannot stream stdout from the final step because there is no next step.",
          );
        }

        // CACHE step: ---------------------------------------------------------------------------------
        if (options?.stdout === "pipe") {
          prevStep.result = undefined;
          prevStep.resultPromise = currStep.resultPromise;
        } else {
          prevStep.result = currStep.result;
          prevStep.resultPromise = undefined;
        }

        // STORE CONTEXT
        if (options?.stdout === "context") {
          const result = currStep.result?.stdout;
          if (typeof result === "string") {
            context.array.push(result);
          } else {
            return {
              successful: false,
              errorMessages: [
                `Context error:`,
                `  Output is not a string.`,
                `  stdout = context, expected a string but received: ${typeof result}.`,
              ],
            };
          }
        }

        // ERROR HANDLING: in case of Step failure not caught by execa.
      } catch (error) {
        return {
          successful: false,
          errorMessages: [
            `Failed to execute step: ${JSON.stringify(currentStep)}.`,
            `${error}`,
          ],
        };
      }
    }
    // All steps have been completed successfully.
    return { successful: true };
  },
  runStep(program: string, args: string[], stepOptions?: StepOptions) {
    const { stdin, stdout, stderr } = stepOptions ?? {};

    // SET EXECA OPTIONS:
    // "timeout" is in milliseconds.
    // A false "reject" will return errors instead of throwing exceptions.
    // execa stdin/out/err all default to 'pipe', which does not benefit my users.
    // Instead, users can rely on pipe: buffer | stream
    // stdin: 'inherit', stdout: 'inherit', stderr: 'inherit', direct everything to the terminal.
    const execaOptions: Options = {
      ...stepOptions,
      stdin: stdin === "buffer" || stdin === "context" ? undefined : stdin,
      stdout: stdout === "buffer" || stdout === "context" ? undefined : stdout,
      stderr: stderr === "buffer" || stderr === "context" ? undefined : stderr,
      reject: false,
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
