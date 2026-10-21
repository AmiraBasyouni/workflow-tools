import { Options, StdinOption, StdoutStderrOption } from "execa";

type Segment = {
  workflow?: Workflow;
  [seg: string]: Segment | Workflow | undefined;
};

type Workflow = {
  name: string;
  requirements: Requirement[];
  paramSpec?: ParamSpec;
  steps: Process[];
};

type ParamSpec = { count: number; required: boolean };

type Context = {
  params: string[];
  cwd: string;
  array: string[];
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
  stderr?: StdoutStderrOption | "buffer" | "context";
  stdin?: StdinOption | "buffer" | "context" | "param";
  stdout?: StdoutStderrOption | "buffer" | "context";
  timeout?: Options["timeout"];
  alt?: Process;
};

// We'll expand the Step type: Step = Process | Prompt | Filesystem.
type Step = Process;
type StepOptions = ProcessOptions;

export {
  Segment,
  Workflow,
  Context,
  Requirement,
  Step,
  StepOptions,
  ParamSpec,
};
