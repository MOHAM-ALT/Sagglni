const Ajv = require('ajv');
const schema = require('../src/schema/profileSchema.json');

describe('Profile Schema (AJV)', () => {
  test('valid profile passes', () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    require('ajv-formats')(ajv);
    const validate = ajv.compile(schema);
    const profile = {
      data: {
        personalInfo: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '+123' }
      }
    };
    expect(validate(profile)).toBe(true);
  });

  test('invalid education graduationYear type yields error message', () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    require('ajv-formats')(ajv);
    const validate = ajv.compile(schema);
    const profile = {
      data: {
        personalInfo: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '+123' },
        education: [ { id: 'e1', degree: 'Bachelor', field: 'CS', university: 'U', country: 'X', graduationYear: '2023' } ]
      }
    };
    const valid = validate(profile);
    expect(valid).toBe(false);
    const errs = validate.errors.map(e => `${e.instancePath} ${e.message}`);
    expect(errs.some(m => m.includes('graduationYear') || m.includes('integer'))).toBe(true);
  });
});
