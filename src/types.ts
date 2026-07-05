type Workflow = {
  isWorkflow: boolean;
  requirenments: Requirenment[];
  params?: string[];
  steps: string[];
};

type Context = {
  params?: string[];
  cwd: string;
};

type Requirenment = {
  type: string;
};

export { Workflow, Context, Requirenment };
