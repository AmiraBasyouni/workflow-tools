import { Segment } from "./types.js";

const verbs: Segment = {
  nodeType: "segment",
  children: {
    branch: {
      nodeType: "segment",
      children: {
        list: {
          nodeType: "workflow",
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
    },
  },
};

export default verbs;
