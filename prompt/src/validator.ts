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
      let schema = z.coerce.number({ message: "Must be a valid number" });
      if (flagValues.min)
        schema = schema.min(
          Number(flagValues.min),
          `Must be >= ${flagValues.min}`,
        );
      if (flagValues.max)
        schema = schema.max(
          Number(flagValues.max),
          `Must be <= ${flagValues.max}`,
        );
      return schema;
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
      schema = schema.regex(
        new RegExp(flagValues.regex),
        `Must match format: ${flagValues.regex}`,
      );
    return schema;
  },

  validate(input: string, schema: ValidationSchema): ValidationResult {
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
