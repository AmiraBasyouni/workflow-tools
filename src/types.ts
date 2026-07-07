type Segment = {
  nodeType: "segment";
  children: {[key: string]: Segment | Workflow}
};

type Workflow = {
  nodeType: "workflow";
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
