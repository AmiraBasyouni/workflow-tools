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
            program: "prompt",
            args: ["New branch name: ", "--type", "string", "--null"],
            // stdin from terminal, stderr to terminal, stdout as buffer
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
            program: "prompt",
            args: ["Delete branch name: ", "--type", "string", "--null"],
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
  tag: {
    list: {
      workflow: {
        name: "tag list",
        requirements: [programs.git],
        steps: [
          {
            type: "process",
            program: "git",
            args: ["tag"],
            options: { stdout: "inherit" },
          },
        ],
      },
    },
    create: {
      lightweight: {
        workflow: {
          name: "tag create lightweight",
          requirements: [programs.git, programs.amirab_prompt],
          steps: [
            {
              type: "process",
              program: "prompt",
              args: ["Tag name: ", "--type", "string", "--null"],
              options: {
                stdin: "inherit",
                stdout: "buffer",
                stderr: "inherit",
              },
            },
            {
              type: "process",
              program: "xargs",
              args: ["-0", "git", "tag"],
              options: {
                stdin: "buffer",
                stdout: "inherit",
                stderr: "inherit",
              },
            },
          ],
        },
      },
      annotated: {
        workflow: {
          name: "tag create annotated",
          requirements: [programs.git, programs.amirab_prompt],
          steps: [
            {
              type: "process",
              program: "prompt",
              args: ["Tag name: ", "--type", "string"],
              options: {
                stdin: "inherit",
                stdout: "context",
                stderr: "inherit",
              },
            },
            {
              type: "process",
              program: "prompt",
              args: ["Message: ", "--type", "string"],
              options: {
                stdin: "inherit",
                stdout: "context",
                stderr: "inherit",
              },
            },

            {
              type: "process",
              program: "git",
              args: ["tag", "-a", "CONTEXT_1", "-m", "CONTEXT_2"],
              options: {
                stdin: "context",
                stdout: "inherit",
                stderr: "inherit",
              },
            },
          ],
        },
      },
    },
    delete: {
      workflow: {
        name: "tag delete",
        requirements: [programs.git, programs.amirab_prompt],
        steps: [
          {
            type: "process",
            program: "prompt",
            args: ["Delete tag name: ", "--type", "string", "--null"],
            options: { stdin: "inherit", stdout: "buffer", stderr: "inherit" },
          },
          {
            type: "process",
            program: "xargs",
            args: ["-0", "git", "tag", "-d"],
            options: { stdin: "buffer", stdout: "inherit", stderr: "inherit" },
          },
        ],
      },
    },
    show: {
      workflow: {
        name: "tag show",
        requirements: [programs.git, programs.amirab_prompt],
        steps: [
          {
            type: "process",
            program: "prompt",
            args: ["Tag to show: ", "--type", "string", "--null"],
            options: { stdin: "inherit", stdout: "buffer", stderr: "inherit" },
          },
          {
            type: "process",
            program: "xargs",
            args: ["-0", "git", "show"],
            options: { stdin: "buffer", stdout: "inherit", stderr: "inherit" },
          },
        ],
      },
    },
  },
};

export default verbs;
