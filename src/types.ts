type Segment = {
  //  This explicitly forbids the key "isWorkflow" from being a segment
  [key in string as key extends "isWorkflow" ? never : key]: Segment | Workflow;
};

type Workflow = {
  isWorkflow: true;
  requirements: Requirement[];
  params?: string[];
  steps: string[];
};

type Context = {
  params?: string[];
  cwd: string;
};

type Requirement = Program;

type Program = { type: "program"; program: string; installation: string };

export { Segment, Workflow, Context, Requirement };
