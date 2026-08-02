import { Segment } from "./types.js";

const verbs: Segment = {
  branch: {
    list: {
      workflow: {
        name: "branch list",
        requirements: [
          {
            type: "program",
            description: "git is installed",
            verificationSteps: [
              { type: "process", program: "git", args: ["--version"] },
            ],
            fulfillmentInstructions: ["sudo apt install git"],
          },
        ],
        steps: [{ type: "process", program: "git", args: ["branch"], description: "run git branch"}],
      },
    },
  },
};

export default verbs;
