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
  instructions: string[];
}

type Process = {
  type: "process";
  program: string;
  args: string[];
  timeout?: number;
};

type Step = Process;

export { Segment, Workflow, Context, Requirement, Step };
