import { Step, StepOptions, Context } from "./types.js";
import { Result, ResultPromise } from "execa";

import { execa, Options } from "execa";
import verify from "./validation.js";

type Response = { successful: boolean; errorMessages?: string[] };

const process = {
  async runSteps(steps: Step[], context: Context): Promise<Response> {
    // CACHE previous step:
    const prevStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
      options: StepOptions;
    } = {
      result: undefined,
      resultPromise: undefined,
      options: {},
    };

    // CACHE current step:
    const currStep: {
      result: Result | undefined;
      resultPromise: ResultPromise | undefined;
    } = { result: undefined, resultPromise: undefined };

    // ITERATE steps:
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];
      const { program, options, alt } = currentStep;
      let { args } = currentStep;

      try {
        // VALIDATE current step:
        const stepValidity = verify.step(currentStep);
        if (!stepValidity.valid) {
          const errorMessages = [
            `Invalid step: ${JSON.stringify(currentStep)}`,
            // error-Messages: warnings array as a string: "warning_1, warning_2, ...":
            `${stepValidity.errorMessages?.toString()}.`,
          ];
          return process.processError(errorMessages);
        }

        // VALIDATE options (stdin/stdout):
        // If current step stdin = pipe but prev-step stdout != pipe, halt with error.
        if (options.stdin === "pipe" && prevStep.options.stdout !== "pipe") {
          const errorMessages = [
            "Pipe error:",
            `  Previous step stdout: ${prevStep.options.stdin}`,
            `  Current step stdin: ${currentStep.options.stdin}\n`,
            `  Expected: "Previous step stdout: pipe"`,
          ];

          return process.stepError(currentStep, errorMessages);
        } else if (options.stdin === "pipe" && !prevStep?.resultPromise) {
          // If current step stdin = pipe & streams, prev-step should have returned a promise.
          const errorMessages = [
            "Pipe error:",
            `  Previous step:`,
            `    stdout: ${prevStep.options.stdout}.`,
            `  Current step:`,
            `    stdin: ${currentStep.options.stdin}.`,
            `  Expected:`,
            //`    Previous step: stdoutPipe: "stream"`,
            `    previous step to return a promise.`,
          ];
          return process.stepError(currentStep, errorMessages);
        }
        // VALIDATE context:
        // If current step resolveVariable = context but context is empty.
        if (options.resolveVariable === "context" && context.array.length < 1) {
          const errorMessages = ["Context error:", "  Context is empty."];
          return process.stepError(currentStep, errorMessages);
        }
        // VALIDATE param:
        // If current step contains a param variable, a fallback process must exist.
        if (options.resolveVariable === "param" && alt === undefined) {
          const errorMessages = [
            "Param error:",
            "  This step uses a param variable, but does not include a fallback.",
            "  include an alternative process in options: { alt }.",
            "  when user fails to provide a param, the alternative steps will run.",
          ];
          return process.stepError(currentStep, errorMessages);
        }

        // RESOLVE VARIABLES -------------------------------------------------------------------------
        if (options.resolveVariable === "context" && context.array.length > 0) {
          // options: if resolveVariable = context,
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
            // replace args
            args = argsWithContext.newArgs;
          }
        } else if (options.resolveVariable === "param") {
          // options: if resolveVariable = param,
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
              // replace args
              args = argsWithParams.newArgs;
            }
          } else if (context.params.length === 0 && alt) {
            // if params were not provided:
            // clear stdout.
            options.stdout = undefined;
            // run alternative step.
            if (Array.isArray(alt)) {
              steps.splice(i + 1, 0, ...alt);
            } else {
              steps.splice(i + 1, 0, alt);
            }
            continue;
          } else {
            const errorMessages = ["Param error: Unexpected error."];
            return process.stepError(currentStep, errorMessages);
          }
        }

        // RUN step: ---------------------------------------------------------------------------------
        if (options.stdin === "pipe" && prevStep.resultPromise) {
          // options: if stdin = pipe, use prev-step.
          currStep.resultPromise = process.runStep(program, args, {
            ...options,
          });
          // STREAM
          prevStep.resultPromise.pipe(currStep.resultPromise);
        } else if (options.stdin === "buffer" && prevStep.result?.stdout) {
          // options: if stdin = buffer, use prev-step.
          currStep.resultPromise = process.runStep(program, args, {
            ...options,
            stdin: [[prevStep.result.stdout]],
          });
        } else {
          // options: if stdin != pipe/buffer, disregard prev-step.
          currStep.resultPromise = process.runStep(program, args, options);
        }
        // CACHE options:
        prevStep.options = options;

        const stdout = options.stdout;
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
            if (error.exitCode === 130) {
              return process.stepError(currentStep, [
                "Process terminated with exiit code 130.",
              ]);
            }
            const errorMessages = [`Execa Error: ${error.message}`];
            return process.stepError(currentStep, errorMessages);
          }
        } else if (stdoutIsStreaming && i === steps.length - 1) {
          throw new Error(
            "Cannot stream stdout from the final step because there is no next step.",
          );
        }

        // CACHE step: ---------------------------------------------------------------------------------
        if (options.stdout === "pipe") {
          prevStep.result = undefined;
          prevStep.resultPromise = currStep.resultPromise;
        } else {
          prevStep.result = currStep.result;
          prevStep.resultPromise = undefined;
        }

        // STORE CONTEXT
        if (options.stdout === "context") {
          const result = currStep.result?.stdout;
          if (typeof result === "string") {
            context.array.push(result);
          } else {
            const errorMessages = [
              `Context error:`,
              `  Output is not a string.`,
              `  stdout = context, expected a string but received: ${typeof result}.`,
            ];
            return process.stepError(currentStep, errorMessages);
          }
        }

        // ERROR HANDLING: in case of Step failure not caught by execa.
      } catch (error) {
        const errorMessages = [`${error}`];
        return process.stepError(currentStep, errorMessages);
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
      stdin: stdin === "buffer" ? undefined : stdin,
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
        const errorMessages = [
          "Variable error:",
          `  Missing variable.`,
          `  stdin = '${variable}' but args does not contain a variable (e.g. ${variable.toUpperCase()}_1).`,
        ];
        return {
          newArgs: [],
          error: process.stepError(currentStep, errorMessages),
        };
      } else if (flags.variableNotFound.bool) {
        // if stdin = context but a context variable doesn't successfully map to a value,
        const errorMessages = [
          "Variable error:",
          `  Failed to retrieve variable ${flags.variableNotFound.variable}.`,
        ];
        return {
          newArgs: [],
          error: process.stepError(currentStep, errorMessages),
        };
      }

      return { newArgs };
    },
  },
  processError(messages: string[]) {
    return {
      successful: false,
      errorMessages: messages,
    };
  },
  stepError(currentStep: Step, messages: string[]) {
    const args = currentStep.args.map((element) =>
      element.includes(" ") ? `"${element}"` : element,
    );
    return {
      successful: false,
      errorMessages: [
        `Failed to execute step: ${currentStep.program} ${args.join(" ")}`,
        ``,
        ...messages,
      ],
    };
  },
};

export default process;
