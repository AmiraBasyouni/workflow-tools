import { Options, StdinOption, StdoutStderrOption } from "execa";

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
type ProcessOptions = {
  stderr?: StdoutStderrOption | "buffer";
  stdin?: StdinOption | "buffer";
  stdout?: StdoutStderrOption | "buffer";
  timeout?: Options["timeout"];
};

// We'll expand the Step type: Step = Process | Prompt | Filesystem.
type Step = Process;
type StepOptions = ProcessOptions;

export { Segment, Workflow, Context, Requirement, Step, StepOptions };
