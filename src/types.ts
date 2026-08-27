import { Result, ResultPromise, Options } from "execa";

type Segment = {
  workflow?: Workflow;
  [seg: string]: Segment | Workflow | undefined;
};

type Workflow = {
  name: string;
  requirements: Requirement[];
  params?: string[];
  steps: Process[];
};

type Context = {
  params?: string[];
  cwd: string;
};

interface Requirement {
  type: string;
  description: string;
  verificationSteps: Process[];
  fulfillmentInstructions: string[];
}

// The "description" will be used for displaying progress messages.
type Process = {
  type: "process";
  description?: string;
  program: string;
  args: string[];
  options?: ProcessOptions;
};

// execa options + my own internal cache
type ProcessOptions = Options & {
  prevStep?: Cache;
  stdinPipe?: PipeOptions;
  stdoutPipe?: PipeOptions;
};
type Cache = {
  result: Result | undefined;
  resultPromise: ResultPromise | undefined;
};
type PipeOptions = "stream" | "buffer";
/*type ProcessOptions = {
  timeout?: number;
  pipe?: "stream" | "buffer";
  stdout?: boolean;
  cache?: {
    prevResult: Result | undefined;
    prevResultPromise: ResultPromise | undefined;
  };
};*/

// We'll expand the Step type: Step = Process | Prompt | Filesystem.
type Step = Process;
type StepOptions = ProcessOptions;

export { Segment, Workflow, Context, Requirement, Step, StepOptions };
