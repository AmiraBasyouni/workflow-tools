import interaction from "./interaction.js";
import validator, { ValidationSchema } from "./validator.js";
import { SessionResponse } from "./types.js";

async function runPromptingSession(
  prompt: string,
  schema: ValidationSchema,
): Promise<SessionResponse> {

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
    if (result.valid) {
      // END INTERACTION (valid input)
      interaction.end(rl);
      return { successful: true, exitCode: 0, data: result.data };
    }
    if (!result.valid) {
      validator.printValidationErrors(result.errors);
    }
  }

}

export default runPromptingSession;
