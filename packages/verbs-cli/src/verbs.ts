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
        steps: [
          {
            type: "process",
            program: "git",
            args: ["branch", "--color=always"],
            options: { stdout: "inherit" },
          },
        ],
      },
    },
    create: {
      workflow: {
        name: "branch create",
        requirements: [
          {
            type: "program",
            description: "git is installed",
            verificationSteps: [
              { type: "process", program: "git", args: ["--version"] },
            ],
            fulfillmentInstructions: ["sudo apt install -g git"],
          },
          {
            type: "program",
            description: "@amirab/prompt is installed",
            verificationSteps: [
              {
                type: "process",
                program: "prompt",
                args: ["--version"],
                options: { stdout: "pipe" },
              },
              {
                type: "process",
                program: "grep",
                args: ["^@amirab/prompt"],
                options: { stdin: "pipe" },
              },
            ],
            fulfillmentInstructions: ["npm install -g @amirab/prompt"],
          },
        ],
        steps: [
          {
            type: "process",
            program: "prompt",
            args: ["New branch name: ", "--type", "string", "--null"],
            // stdin from terminal, stderr to terminal, stdout to pipe
            options: { stdin: "inherit", stdout: "pipe", stderr: "inherit" },
          },
          {
            type: "process",
            program: "xargs",
            args: ["-0", "git", "branch"],
            options: { stdin: "pipe", stdout: "inherit" },
          },
        ],
      },
    },
  },
};

export default verbs;
