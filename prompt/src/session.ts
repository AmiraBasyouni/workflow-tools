import interaction from "./interaction.js";
import validator, { ValidationSchema } from "./validator.js";

async function session(prompt: string, schema: ValidationSchema) {
  // START INTERACTION
  const { rl, ask } = interaction.start();

  // Let the user know right away that they aren't trapped.
  console.error("(Type 'exit' or press Ctrl+C at any time to cancel)\n");

  while (true) {
    // PROMPT USER
    const rawAnswer = await ask(prompt);
    const answer = rawAnswer.trim();

    // ESCAPE HATCH: Allow explicit keywords to quit gracefully.
    if (["exit", "quit", "cancel"].includes(answer.toLowerCase())) {
      console.log("\nOperation cancelled.");
      // END INTERACTION (escape hatch)
      interaction.end(rl);
      process.exit(130);
    }

    // INPUT VALIDATION
    const result = validator.validate(answer, schema);
    if (result.success) {
      // Print the valid output to stdout so shell scripts can capture it.
      console.log(result.data);
      // END INTERACTION (valid input)
      interaction.end(rl);
      process.exit(0);
    }
    if (!result.success) {
      // Print validation errors then loop.
      console.error("\nInvalid input:");
      for (const errorMessage of result.errors) {
        console.error(`* ${errorMessage}`);
      }
      console.error();
    }
  }
}

export default session;
