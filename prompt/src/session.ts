import interaction from "./interaction.js";
import validator, {ValidationSchema} from "./validator.js";

async function session(prompt: string, schema: ValidationSchema) {
  // START INTERACTION
  const { rl, ask } = interaction.start();

  // PROMPT USER
  const answer = await ask(prompt);

  // INPUT VALIDATION
  const result = validator.validate(answer, schema);
  if (result.success) {
    // Print the valid output to stdout so shell scripts can capture it
    console.log(result.data);
    interaction.end(rl);
    process.exit(0);
  }
  if (!result.success){
  // Print validation errors
  console.error("\nInvalid input:");
  for (const errorMessage of result.errors) {
    console.error(`* ${errorMessage}`);
  }
  console.error();
  }

  // END INTERACTION
  interaction.end(rl);
  return answer;
}

export default session;
