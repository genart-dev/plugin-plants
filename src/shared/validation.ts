import type { ValidationError, LayerProperties } from "@genart-dev/core";

/** Validate a numeric property is within range. */
export function validateNumber(
  props: LayerProperties,
  key: string,
  min: number,
  max: number,
  label: string,
): ValidationError | null {
  const val = props[key];
  if (typeof val !== "number") return { property: key, message: `${label} must be a number` };
  if (val < min || val > max) return { property: key, message: `${label} must be between ${min} and ${max}` };
  return null;
}

/** Validate a string property is non-empty. */
export function validateString(
  props: LayerProperties,
  key: string,
  label: string,
): ValidationError | null {
  const val = props[key];
  if (typeof val !== "string" || val.length === 0) {
    return { property: key, message: `${label} must be a non-empty string` };
  }
  return null;
}

/** Validate a select property matches one of the allowed values. */
export function validateSelect(
  props: LayerProperties,
  key: string,
  allowed: readonly string[],
  label: string,
): ValidationError | null {
  const val = props[key];
  if (typeof val !== "string" || !allowed.includes(val)) {
    return { property: key, message: `${label} must be one of: ${allowed.join(", ")}` };
  }
  return null;
}

/** Collect all non-null validation errors. */
export function collectErrors(
  ...checks: (ValidationError | null)[]
): ValidationError[] | null {
  const errors = checks.filter((e): e is ValidationError => e !== null);
  return errors.length > 0 ? errors : null;
}
