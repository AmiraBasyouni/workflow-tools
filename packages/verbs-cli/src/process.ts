import { Step, StepOptions, Context, ParamSpec } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa, Options } from "execa";
import verify from "./validation.js";

type Response = { successful: boolean; errorMessages?: string[] };

const process = {
  async runSteps(
    steps: Step[],
    paramSpec: ParamSpec | undefined,
    context: Context,
  ): Promise<Response> {
    if (!paramSpec) {
      paramSpec = { count: 0, required: false };
    }

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
        // If current step stdin = context but context is empty.
        if (options?.stdin === "context" && context.array.length < 1) {
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Context error:",
              "  Context is empty.",
            ],
          };
        }
        // VALIDATE param:
        // If current step stdin = param and workflow does not require a param, an alt process must exist.
        if (
          options?.stdin === "param" &&
          !paramSpec.required &&
          options.alt === undefined
        ) {
          return {
            successful: false,
            errorMessages: [
              `Failed to run step: ${JSON.stringify(currentStep)}.`,
              "Param error:",
              "  when stdin is param and param is not required, step must contain an alternative.",
              "  include an alternative step in options: { alt }.",
              "  when user chooses not to provide a param, the alternative step will run.",
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
        } else if (options?.stdin === "context" && context.array.length > 0) {
          // options: if stdin = context,
          // replace CONTEXT_1 with CONTEXT[0], CONTEXT_2 with CONTEXT[1], etc.
          const argsWithContext = process.utils.replaceVariable(
            args,
            context.array,
            "context",
            currentStep,
          );
          // ERROR HANDLING
          if (argsWithContext.error) {
            return argsWithContext.error;
          } else {
            // run step with resolved context variables.
            currStep.resultPromise = process.runStep(
              program,
              argsWithContext.newArgs,
              options,
            );
          }
        } else if (options?.stdin === "param") {
          // options: if stdin = param,
          // if params were provided:
          if (context.params.length > 0) {
            // replace PARAM_1 with param[0], PARAM_2 with param[1], etc.
            const argsWithParams = process.utils.replaceVariable(
              args,
              context.params,
              "param",
              currentStep,
            );
            // ERROR HANDLING
            if (argsWithParams.error) {
              return argsWithParams.error;
            } else {
              // run step with resolved context variables.
              currStep.resultPromise = process.runStep(
                program,
                argsWithParams.newArgs,
                options,
              );
            }
          } else if (context.params.length === 0 && options.alt) {
            // if params were not provided:
            // clear stdout.
            options.stdout = undefined;
            // run alternative step.
            steps.splice(i + 1, 0, options.alt);
          } else {
            return {
              successful: false,
              errorMessages: [
                `Failed to run step: ${JSON.stringify(currentStep)}.`,
                "Param error: Unexpected error.",
              ],
            };
          }
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
      stdin:
        stdin === "buffer" || stdin === "context" || stdin === "param"
          ? undefined
          : stdin,
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
    // REPLACE VARIABLE
    replaceVariable(
      args: string[],
      values: string[],
      variable: string,
      currentStep: Step,
    ) {
      // replace VARIABLE_1 with values[0], VARIABLE_2 with values[1], etc.
      const flags = {
        argsContainsVariable: false,
        variableNotFound: { bool: false, variable: "" },
      };
      const newArgs = args.map((arg) => {
        // look for format "VARIABLE_<number>"
        const regex = new RegExp(`^${variable.toUpperCase()}_\\d+$`);
        if (regex.test(arg)) {
          // extract the number
          const match = arg.match(/\d+$/);
          const number = match ? Number(match[0]) : undefined;
          // if a value exists at number - 1, replace arg with value
          if (number && typeof values[number - 1] === "string") {
            flags.argsContainsVariable = true;
            return values[number - 1];
          } else {
            flags.variableNotFound.bool = true;
            flags.variableNotFound.variable = arg;
            return arg;
          }
        } else {
          return arg;
        }
      });
      if (!flags.argsContainsVariable) {
        // if stdin = context but args doesn't contain a context variable,
        const error = {
          successful: false,
          errorMessages: [
            `Failed to run step: ${JSON.stringify(currentStep)}.`,
            "Variable error:",
            `  Missing variable.`,
            `  stdin = '${variable}' but args does not contain a variable (e.g. ${variable.toUpperCase()}_1).`,
          ],
        };
        return { newArgs: [], error };
      } else if (flags.variableNotFound.bool) {
        // if stdin = context but a context variable doesn't successfully map to a value,
        const error = {
          successful: false,
          errorMessages: [
            `Failed to run step: ${JSON.stringify(currentStep)}.`,
            "Variable error:",
            `  Failed to retrieve variable ${flags.variableNotFound.variable}.`,
          ],
        };
        return { newArgs: [], error };
      }

      return { newArgs };
    },
  },
};

export default process;
