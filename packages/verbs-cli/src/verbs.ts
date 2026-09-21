import { Segment, Requirement } from "./types.js";

/* PROGRAMS */
const programs: Record<string, Requirement> = {
  git: {
    type: "program",
    description: "git is installed",
    verificationSteps: [
      { type: "process", program: "git", args: ["--version"] },
    ],
    fulfillmentInstructions: ["sudo apt install git"],
  },
  amirab_prompt: {
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
};

/* VERBS */
const verbs: Segment = {
  branch: {
    list: {
      workflow: {
        name: "branch list",
        requirements: [programs.git],
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
        requirements: [programs.git, programs.amirab_prompt],
        steps: [
          {
            type: "process",
            program: "git",
            args: ["branch", "--color=always"],
            options: { stdout: "inherit" },
          },
          {
            type: "process",
            program: "prompt",
            args: ["New branch name: ", "--type", "string", "--null"],
            // stdin from terminal, stderr to terminal, stdout to buffer
            options: { stderr: "inherit", stdin: "inherit", stdout: "buffer" },
          },
          {
            type: "process",
            program: "xargs",
            args: ["-0", "git", "branch"],
            options: { stdin: "buffer", stdout: "inherit", stderr: "inherit" },
          },
        ],
      },
    },
    delete: {
      workflow: {
        name: "branch delete",
        requirements: [programs.git, programs.amirab_prompt],
        steps: [
          {
            type: "process",
            program: "git",
            args: ["branch", "--color=always"],
            options: { stdout: "inherit" },
          },
          {
            type: "process",
            program: "prompt",
            args: ["Delete branch name: ", "--type", "string", "--null"],
            // stdin from terminal, stderr to terminal, stdout to pipe
            options: { stdin: "inherit", stdout: "buffer", stderr: "inherit" },
          },
          {
            type: "process",
            program: "xargs",
            args: ["-0", "git", "branch", "-d"],
            options: { stdin: "buffer", stdout: "inherit", stderr: "inherit" },
          },
        ],
      },
    },
  },
};

export default verbs;
