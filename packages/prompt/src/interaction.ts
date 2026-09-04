import { createInterface } from "readline";
import { Interface } from "readline";

const interaction = {
  // START INTERACTION
  start() {
    // Input: get input from the terminal
    // Output: send output to the terminal
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    // RESOLVE CTRL + C GRACEFULLY
    rl.on("SIGINT", () => {
      // Print newline so the ^C terminal text gets a clean break
      console.log("\n\nOperation cancelled.");
      rl.close();
      process.exit(130);
    });

    // FUNCTION TO ASK QUESTIONS
    const ask = (question: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    return { rl, ask };
  },
  // END INTERACTION
  end(rl: Interface) {
    rl.close();
  },
};

export default interaction;
