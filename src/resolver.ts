import verbs from "./verbs";

function throwError({ condition, verb, message }) {
  if (condition) {
    // capture verb as a string for error messages
    const verbString = verb.join(" ");
    const errorMessage = `Invalid verb: "${verbString}". ` + message;
    throw new Error(errorMessage);
  }
}

function resolver(verb: string[]) {
  let resolveWorkflow = verbs;
  let workflow = {};
  let params = [];
  for (let i = 0; i < verb.length; i++) {
    const word = verb[i];
    resolveWorkflow = resolveWorkflow[word];
    throwError({
      condition: !resolveWorkflow,
      message: "The verb does not exist.",
      verb,
    });
    if (resolveWorkflow.isWorkflow) {
      workflow = resolveWorkflow;
      params = verb.slice(i + 1);
      break;
    }
  }
  throwError({
    condition: !workflow.isWorkflow,
    message: "The verb does not map to a workflow.",
    verb,
  });
  return { workflow, params };
}

export default resolver;
