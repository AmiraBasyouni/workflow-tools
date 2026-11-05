function printHelp() {
  console.log(`
Description:
  Prompt for user input and validate the response.
	      
Usage:
  prompt [options]

Options:
  -v, --version
      Print the version and exit.

  -h, --help
      Show this help message and exit.
	      
  --type <type>
      Expected input type. Accepted values: string, number. Default: string.

  --min <value>
      Minimum length for strings or minimum value for numbers.

  --max <value>
      Maximum length for strings or maximum value for numbers.

  --regex <pattern>
      Regular expression used to validate string.

  --regex-message <error-message>
      Custom error message displayed when the response fails regex validation.
      Default: "Must match format: <pattern>".

  --null
      Terminate output with a NUL character instead of a newline.

  --answer
      Validate answer. Skips prompting if answer is valid.

  --no-hint
      Hide the message: "Type 'exit' or press Ctrl+C at any time to cancel".
`);
}

export default printHelp;
