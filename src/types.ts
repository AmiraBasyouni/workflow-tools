import { Result, ResultPromise } from "execa";

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

type Process = {
  type: "process";
  program: string;
  args: string[];
  options: ProcessOptions;
};

type ProcessOptions = {
  timeout?: number;
  pipe?: "stream" | "buffer";
  prevResult: Result | undefined;
  prevResultPromise: ResultPromise | undefined;
}

// We'll expand the Step type: Step = Process | Prompt | Filesystem.
type Step = Process;
type StepOptions = ProcessOptions;

export { Segment, Workflow, Context, Requirement, Step, StepOptions };
