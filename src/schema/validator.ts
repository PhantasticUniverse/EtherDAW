import Ajv, { ErrorObject } from 'ajv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { EtherScore } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schema = JSON.parse(readFileSync(join(__dirname, 'etherscore.schema.json'), 'utf-8'));

const ajv = new Ajv.default({ allErrors: true });
const validateSchema = ajv.compile(schema);

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validate an EtherScore document against the JSON schema
 */
export function validate(score: unknown): ValidationResult {
  const valid = validateSchema(score);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validateSchema.errors || []).map((err: ErrorObject) => ({
    path: err.instancePath || '/',
    message: err.message || 'Unknown validation error',
  }));

  return { valid: false, errors };
}

/**
 * Validate and return typed EtherScore or throw
 */
export function validateOrThrow(score: unknown): EtherScore {
  const result = validate(score);

  if (!result.valid) {
    const errorMessages = result.errors
      .map(e => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid EtherScore:\n${errorMessages}`);
  }

  return score as EtherScore;
}

/**
 * Check if arrangement references valid sections
 */
export function validateArrangement(score: EtherScore): ValidationResult {
  const errors: ValidationError[] = [];
  const sectionNames = new Set(Object.keys(score.sections));

  for (let i = 0; i < score.arrangement.length; i++) {
    const sectionName = score.arrangement[i];
    if (!sectionNames.has(sectionName)) {
      errors.push({
        path: `/arrangement/${i}`,
        message: `Section "${sectionName}" not found in sections`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if tracks reference valid patterns and instruments
 */
export function validateReferences(score: EtherScore): ValidationResult {
  const errors: ValidationError[] = [];
  const patternNames = new Set(Object.keys(score.patterns));
  const instrumentNames = new Set(Object.keys(score.instruments || {}));

  for (const [sectionName, section] of Object.entries(score.sections)) {
    for (const [trackName, track] of Object.entries(section.tracks)) {
      // Check pattern reference
      if (track.pattern && !patternNames.has(track.pattern)) {
        errors.push({
          path: `/sections/${sectionName}/tracks/${trackName}/pattern`,
          message: `Pattern "${track.pattern}" not found`,
        });
      }

      // Check patterns array
      if (track.patterns) {
        for (let i = 0; i < track.patterns.length; i++) {
          if (!patternNames.has(track.patterns[i])) {
            errors.push({
              path: `/sections/${sectionName}/tracks/${trackName}/patterns/${i}`,
              message: `Pattern "${track.patterns[i]}" not found`,
            });
          }
        }
      }

      // Check instrument reference (track name should match instrument)
      if (instrumentNames.size > 0 && !instrumentNames.has(trackName)) {
        errors.push({
          path: `/sections/${sectionName}/tracks/${trackName}`,
          message: `No instrument defined for track "${trackName}"`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Run all validations
 */
export function validateFull(score: unknown): ValidationResult {
  const schemaResult = validate(score);
  if (!schemaResult.valid) {
    return schemaResult;
  }

  const etherScore = score as EtherScore;
  const allErrors: ValidationError[] = [];

  const arrangementResult = validateArrangement(etherScore);
  allErrors.push(...arrangementResult.errors);

  const referencesResult = validateReferences(etherScore);
  allErrors.push(...referencesResult.errors);

  return { valid: allErrors.length === 0, errors: allErrors };
}
