const verbs = {
  branch: {
    list: {
      isWorkflow: true,
      requirements: [{ type: "program", program: "git" }],
      steps: ["git list"],
    },
  },
};

export default verbs;
