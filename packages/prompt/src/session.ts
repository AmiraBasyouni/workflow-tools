import interaction from "./interaction.js";
import validator, { ValidationSchema } from "./validator.js";
import { UserResponse } from "./output.js";

async function session(
  prompt: string,
  schema: ValidationSchema,
): Promise<UserResponse> {
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
      console.error("\nOperation cancelled.");
      // END INTERACTION (escape hatch)
      interaction.end(rl);
      return { successful: false, exitCode: 130, data: null };
    }

    // INPUT VALIDATION
    const result = validator.validate(answer, schema);
    if (result.success) {
      // END INTERACTION (valid input)
      interaction.end(rl);
      return { successful: true, exitCode: 0, data: result.data };
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
