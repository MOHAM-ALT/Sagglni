/**
 * Test suite for parseProfileJSON functionality
 * Tests JSON parsing, marker removal, error handling, and schema validation
 */

const { parseProfileJSON, stripMarkers, validateProfileWithSchema } = require('../src/popup/validation');

describe('parseProfileJSON', () => {
  describe('valid JSON parsing', () => {
    test('should parse valid JSON without markers', () => {
      const json = '{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "phone": "+1234567890"}';
      const result = parseProfileJSON(json);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john@example.com');
    });

    test('should parse valid JSON with start/end markers', () => {
      const json = `===== START PROFILE DATA =====
{"firstName": "Jane", "lastName": "Smith", "email": "jane@example.com", "phone": "+1987654321"}
===== END PROFILE DATA =====`;
      const result = parseProfileJSON(json);
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    test('should parse nested profile objects', () => {
      const json = `{
  "id": "profile-1",
  "name": "Test Profile",
  "data": {
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}`;
      const result = parseProfileJSON(json);
      expect(result.id).toBe('profile-1');
      expect(result.data.personalInfo.firstName).toBe('John');
    });

    test('should handle whitespace in markers', () => {
      const json = `
      ===== START PROFILE DATA =====
      {"firstName": "Bob", "lastName": "Johnson", "email": "bob@example.com", "phone": "+5555555555"}
      ===== END PROFILE DATA =====
      `;
      const result = parseProfileJSON(json);
      expect(result.firstName).toBe('Bob');
    });
  });

  describe('marker removal', () => {
    test('should strip START/END markers correctly', () => {
      const raw = `===== START PROFILE DATA =====
{"test": "value"}
===== END PROFILE DATA =====`;
      const stripped = stripMarkers(raw);
      expect(stripped).toBe('{"test": "value"}');
      expect(stripped).not.toContain('START');
      expect(stripped).not.toContain('END');
    });

    test('should handle input without markers', () => {
      const raw = '{"test": "value"}';
      const stripped = stripMarkers(raw);
      expect(stripped).toBe('{"test": "value"}');
    });

    test('should handle empty markers', () => {
      const raw = `===== START PROFILE DATA =====
===== END PROFILE DATA =====`;
      const stripped = stripMarkers(raw);
      expect(stripped).toBe('');
    });
  });

  describe('error handling', () => {
    test('should throw error on invalid JSON', () => {
      const invalidJson = '{invalid json}';
      expect(() => parseProfileJSON(invalidJson)).toThrow();
    });

    test('should throw error on single quotes in JSON', () => {
      const json = "{'firstName': 'John'}";
      expect(() => parseProfileJSON(json)).toThrow();
    });

    test('should throw error on empty input', () => {
      expect(() => parseProfileJSON('')).toThrow();
    });

    test('should throw error on null input', () => {
      expect(() => parseProfileJSON(null)).toThrow();
    });

    test('should throw error on non-string input', () => {
      expect(() => parseProfileJSON(123)).toThrow();
    });

    test('should throw error on JSON with trailing comma', () => {
      const json = '{"firstName": "John",}';
      expect(() => parseProfileJSON(json)).toThrow();
    });

    test('should provide helpful error messages', () => {
      const invalidJson = '{invalid}';
      expect(() => parseProfileJSON(invalidJson)).toThrow(/JSON/);
    });

    test('should throw error on non-object JSON', () => {
      const json = '"just a string"';
      expect(() => parseProfileJSON(json)).toThrow(/object/);
    });

    test('should throw error on JSON array', () => {
      const json = '[{"firstName": "John"}]';
      expect(() => parseProfileJSON(json)).toThrow(/object/);
    });
  });

  describe('complex JSON structures', () => {
    test('should parse profile with education array', () => {
      const json = `{
  "data": {
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "education": [
      {
        "university": "MIT",
        "degree": "Bachelor",
        "field": "Computer Science",
        "graduationYear": 2020,
        "gpa": "3.8"
      }
    ]
  }
}`;
      const result = parseProfileJSON(json);
      expect(result.data.education).toBeDefined();
      expect(result.data.education[0].university).toBe('MIT');
      expect(Array.isArray(result.data.education)).toBe(true);
    });

    test('should parse profile with experience array', () => {
      const json = `{
  "data": {
    "personalInfo": {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "phone": "+1987654321"
    },
    "experience": [
      {
        "jobTitle": "Senior Engineer",
        "company": "Google",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "description": "Worked on backend systems"
      }
    ]
  }
}`;
      const result = parseProfileJSON(json);
      expect(result.data.experience).toBeDefined();
      expect(result.data.experience[0].jobTitle).toBe('Senior Engineer');
    });

    test('should parse profile with skills', () => {
      const json = `{
  "data": {
    "personalInfo": {
      "firstName": "Bob",
      "lastName": "Johnson",
      "email": "bob@example.com",
      "phone": "+5555555555"
    },
    "skills": {
      "technical": ["JavaScript", "Python", "Go"],
      "soft": ["Leadership", "Communication"]
    }
  }
}`;
      const result = parseProfileJSON(json);
      expect(Array.isArray(result.data.skills.technical)).toBe(true);
      expect(result.data.skills.technical[0]).toBe('JavaScript');
    });
  });

  describe('schema validation integration', () => {
    test('should parse and validate profile with valid data', () => {
      const json = `{
  "data": {
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}`;
      const parsed = parseProfileJSON(json);
      const validated = validateProfileWithSchema(parsed);
      expect(validated.isValid).toBe(true);
    });

    test('should catch missing required fields', () => {
      const json = `{
  "data": {
    "personalInfo": {
      "firstName": "John",
      "email": "john@example.com"
    }
  }
}`;
      const parsed = parseProfileJSON(json);
      const validated = validateProfileWithSchema(parsed);
      expect(validated.isValid).toBe(false);
      expect(validated.errors.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('should handle JSON with comments (should fail)', () => {
      const json = `{
  /* comment */
  "firstName": "John"
}`;
      expect(() => parseProfileJSON(json)).toThrow();
    });

    test('should handle unicode characters', () => {
      const json = '{"firstName": "François", "lastName": "Müller", "email": "test@example.com"}';
      const result = parseProfileJSON(json);
      expect(result.firstName).toBe('François');
      expect(result.lastName).toBe('Müller');
    });

    test('should handle JSON with null values', () => {
      const json = '{"firstName": "John", "middleName": null, "email": "john@example.com"}';
      const result = parseProfileJSON(json);
      expect(result.middleName).toBeNull();
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const json = JSON.stringify({ firstName: longString });
      const result = parseProfileJSON(json);
      expect(result.firstName.length).toBe(10000);
    });

    test('should handle deeply nested objects', () => {
      const json = `{
  "level1": {
    "level2": {
      "level3": {
        "level4": {
          "level5": {
            "value": "deep"
          }
        }
      }
    }
  }
}`;
      const result = parseProfileJSON(json);
      expect(result.level1.level2.level3.level4.level5.value).toBe('deep');
    });
  });
});
