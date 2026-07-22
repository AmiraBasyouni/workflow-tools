import { StdinOption, InputOption, Result, ResultPromise } from "./typesExeca.js";

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
  input?: StdinOption | InputOption;
  prevResult: Result | undefined;
  prevResultPromise: ResultPromise | undefined;
}

type Step = Process;
type StepOptions = ProcessOptions;

export { Segment, Workflow, Context, Requirement, Step, StepOptions };
