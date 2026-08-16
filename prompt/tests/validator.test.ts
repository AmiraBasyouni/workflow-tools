import { test, describe } from "node:test";
import assert from "node:assert/strict";
import validator from "../src/validator.js";

describe("Validator - String Mode", () => {
  test("allows empty input when no min constraint is set", () => {
    const schema = validator.buildSchemaFromFlags({});
    const result = validator.validate("", schema);
    assert.equal(result.success, true);
  });

  test("enforces string length constraints", () => {
    const schema = validator.buildSchemaFromFlags({ min: "3", max: "5" });

    assert.equal(validator.validate("hi", schema).success, false);
    assert.equal(validator.validate("hello", schema).success, true);
    assert.equal(validator.validate("hello world", schema).success, false);
  });

  test("enforces regex patterns", () => {
    const schema = validator.buildSchemaFromFlags({ regex: "^[a-z]+$" });

    assert.equal(validator.validate("abc", schema).success, true);
    assert.equal(validator.validate("123", schema).success, false);
  });
});

describe("Validator - Number Mode", () => {
  test("rejects empty input on number prompts", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("", schema);

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.errors[0], "Input cannot be empty");
    }
  });

  test("coerces numeric strings into numbers", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("42", schema);

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data, 42);
      assert.equal(typeof result.data, "number");
    }
  });

  test("rejects non-numeric text", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("abc", schema);

    assert.equal(result.success, false);
  });

  test("enforces min and max numeric bounds", () => {
    const schema = validator.buildSchemaFromFlags({
      type: "number",
      min: "10",
      max: "20",
    });

    assert.equal(validator.validate("5", schema).success, false);
    assert.equal(validator.validate("15", schema).success, true);
    assert.equal(validator.validate("25", schema).success, false);
  });
});

describe("Edge Cases", () => {
  test("trims leading/trailing whitespace before validating", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    assert.equal(validator.validate("  42  ", schema).success, true);
  });

  test("handles decimal numbers correctly", () => {
    const schema = validator.buildSchemaFromFlags({ type: "number" });
    const result = validator.validate("3.14", schema);
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data, 3.14);
  });

  test("handles negative numbers correctly", () => {
    const schema = validator.buildSchemaFromFlags({
      type: "number",
      min: "-10",
    });
    assert.equal(validator.validate("-5", schema).success, true);
  });
});
