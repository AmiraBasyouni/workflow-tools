import { Segment } from "./types.js";

const verbs: Segment = {
  branch: {
    list: {
      isWorkflow: true,
      requirements: [
        {
          type: "program",
          program: "git",
          installation: "sudo apt install git",
        },
      ],
      steps: ["git list"],
    },
  },
};

export default verbs;
