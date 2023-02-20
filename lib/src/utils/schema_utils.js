"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaUtils = void 0;
const json_schemas_1 = require("@0x/json-schemas");
const errors_1 = require("../errors");
const schemas_1 = require("../schemas");
const schemaValidator = new json_schemas_1.SchemaValidator();
for (const schema of Object.values(schemas_1.schemas)) {
    if (schema !== undefined) {
        schemaValidator.addSchema(schema);
    }
}
exports.schemaUtils = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validateSchema(instance, schema) {
        const validationResult = schemaValidator.validate(instance, schema);
        if (!validationResult.errors || validationResult.errors.length === 0) {
            return;
        }
        else {
            const validationErrorItems = validationResult.errors.map((schemaValidationError) => schemaValidationErrorToValidationErrorItem(schemaValidationError));
            throw new errors_1.ValidationError(validationErrorItems);
        }
    },
    addSchema(schema) {
        schemaValidator.addSchema(schema);
    },
};
function schemaValidationErrorToValidationErrorItem(schemaValidationErrorObject) {
    const description = schemaValidationErrorObject.description;
    const reason = schemaValidationErrorObject.message || '';
    if ([
        'type',
        'anyOf',
        'allOf',
        'oneOf',
        'additionalProperties',
        'minProperties',
        'maxProperties',
        'pattern',
        'format',
        'uniqueItems',
        'items',
        'dependencies',
    ].includes(schemaValidationErrorObject.keyword)) {
        return {
            field: schemaValidationErrorObject.dataPath.replace('.', ''),
            code: errors_1.ValidationErrorCodes.IncorrectFormat,
            reason,
            ...(description && { description }),
        };
    }
    else if (['minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'enum', 'const'].includes(schemaValidationErrorObject.keyword)) {
        return {
            field: schemaValidationErrorObject.dataPath.replace('.', ''),
            code: errors_1.ValidationErrorCodes.ValueOutOfRange,
            reason,
            ...(description && { description }),
        };
    }
    else if (schemaValidationErrorObject.keyword === 'required') {
        return {
            field: schemaValidationErrorObject.params.missingProperty,
            code: errors_1.ValidationErrorCodes.RequiredField,
            reason,
            ...(description && { description }),
        };
    }
    else if (schemaValidationErrorObject.keyword === 'not') {
        return {
            field: schemaValidationErrorObject.dataPath.replace('.', ''),
            code: errors_1.ValidationErrorCodes.UnsupportedOption,
            reason,
            ...(description && { description }),
        };
    }
    else {
        throw new Error(`Unknown schema validation error name: ${schemaValidationErrorObject.keyword}`);
    }
}
//# sourceMappingURL=schema_utils.js.map