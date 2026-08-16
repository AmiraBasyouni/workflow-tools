import { z } from "zod";

// Flag value "type" is optional because parsed CLI options may technically be undefined if omitted.
type FlagValues = {
  type?: string;
  min?: string | undefined;
  max?: string | undefined;
  regex?: string | undefined;
};

export type ValidationSchema = z.ZodTypeAny;

export type ValidationResult =
  { success: true; data: unknown } | { success: false; errors: string[] };

const validator = {
  // Build Zod Schema from parsed flags
  buildSchemaFromFlags(flagValues: FlagValues) {
    if (flagValues.type === "number") {
      // Build number schema for flag rules (min/max)
      let flagSchema = z.number();
      if (flagValues.min)
        flagSchema = flagSchema.min(
          Number(flagValues.min),
          `Must be >= ${flagValues.min}`,
        );
      if (flagValues.max)
        flagSchema = flagSchema.max(
          Number(flagValues.max),
          `Must be <= ${flagValues.max}`,
        );
      // 1. Don't accept an empty string as a number. Input: unknown, Output: string.
      const nonEmptyString = z.string().min(1, "Input cannot be empty");
      // 2. Coerce string into a number. Input: string, Output: number.
      const numberSchema = z.coerce.number<string>({
        message: "Must be a valid number",
      });
      // 3. Apply flags: min, max, etc.
      return nonEmptyString.pipe(numberSchema).pipe(flagSchema);
    }

    // Default: String
    let schema = z.string();
    if (flagValues.min)
      schema = schema.min(
        Number(flagValues.min),
        `Must be at least ${flagValues.min} characters`,
      );
    if (flagValues.max)
      schema = schema.max(
        Number(flagValues.max),
        `Must be at most ${flagValues.max} characters`,
      );
    if (flagValues.regex)
      try {
        const rx = new RegExp(flagValues.regex);
        schema = schema.regex(rx, `Must match format: ${flagValues.regex}`);
      } catch {
        console.error(
          `\nError: Invalid regular expression provided to --regex: "${flagValues.regex}"\n`,
        );
        process.exit(1);
      }
    return schema;
  },

  validate(input: string, schema: ValidationSchema): ValidationResult {
    // parse without throwing an exception
    const result = schema.safeParse(input.trim());
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  },
};

export default validator;
