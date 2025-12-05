/**
 * Test suite for interview prompt generation
 * Tests comprehensive prompt creation, JSON examples, and formatting
 */

const { buildInterviewPrompt, generateExampleJSON, buildQuickUpdatePrompt } = require('../src/popup/prompt-generator');

describe('Prompt Generator', () => {
  const mockProfile = {
    name: 'Test Profile',
    data: {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      skills: {
        technical: ['JavaScript', 'Python', 'React', 'Node.js', 'PostgreSQL', 'Docker']
      },
      experience: [
        {
          jobTitle: 'Senior Engineer',
          company: 'Tech Corp',
          currentlyWorking: true
        }
      ]
    }
  };

  describe('generateExampleJSON', () => {
    test('should generate valid example JSON', () => {
      const example = generateExampleJSON();
      expect(example).toBeDefined();
      expect(example.firstName).toBe('John');
      expect(example.lastName).toBe('Doe');
      expect(example.email).toBe('john.doe@example.com');
    });

    test('should include all required fields', () => {
      const example = generateExampleJSON();
      expect(example.firstName).toBeDefined();
      expect(example.lastName).toBeDefined();
      expect(example.email).toBeDefined();
      expect(example.phone).toBeDefined();
      expect(example.dateOfBirth).toBeDefined();
      expect(example.gender).toBeDefined();
      expect(example.nationality).toBeDefined();
    });

    test('should have education array', () => {
      const example = generateExampleJSON();
      expect(Array.isArray(example.education)).toBe(true);
      expect(example.education.length).toBeGreaterThan(0);
      expect(example.education[0].university).toBeDefined();
      expect(example.education[0].degree).toBeDefined();
    });

    test('should have experience array', () => {
      const example = generateExampleJSON();
      expect(Array.isArray(example.experience)).toBe(true);
      expect(example.experience.length).toBeGreaterThan(0);
      expect(example.experience[0].jobTitle).toBeDefined();
      expect(example.experience[0].company).toBeDefined();
    });

    test('should have skills object with arrays', () => {
      const example = generateExampleJSON();
      expect(example.skills).toBeDefined();
      expect(Array.isArray(example.skills.technical)).toBe(true);
      expect(Array.isArray(example.skills.soft)).toBe(true);
      expect(example.skills.technical.length).toBeGreaterThan(0);
    });

    test('should have languages array', () => {
      const example = generateExampleJSON();
      expect(Array.isArray(example.languages)).toBe(true);
      expect(example.languages.length).toBeGreaterThan(0);
      expect(example.languages[0].language).toBeDefined();
      expect(example.languages[0].level).toBeDefined();
    });

    test('should have preferences object', () => {
      const example = generateExampleJSON();
      expect(example.preferences).toBeDefined();
      expect(example.preferences.targetPositions).toBeDefined();
      expect(example.preferences.willingToRelocate).toBeDefined();
      expect(example.preferences.willingToTravel).toBeDefined();
    });

    test('example JSON should be valid JSON', () => {
      const example = generateExampleJSON();
      const jsonStr = JSON.stringify(example);
      expect(() => JSON.parse(jsonStr)).not.toThrow();
    });
  });

  describe('buildInterviewPrompt - comprehensive mode', () => {
    test('should generate comprehensive prompt by default', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(500);
    });

    test('comprehensive prompt should include all sections', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('PERSONAL INFORMATION');
      expect(prompt).toContain('EDUCATION');
      expect(prompt).toContain('WORK EXPERIENCE');
      expect(prompt).toContain('TECHNICAL SKILLS');
      expect(prompt).toContain('SOFT SKILLS');
      expect(prompt).toContain('LANGUAGES');
      expect(prompt).toContain('WORK PREFERENCES');
    });

    test('comprehensive prompt should include detailed questions', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('What is your full legal name');
      expect(prompt).toContain('email address');
      expect(prompt).toContain('phone number');
      expect(prompt).toContain('educational');
    });

    test('comprehensive prompt should include JSON example', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('json');
      expect(prompt).toContain('firstName');
      expect(prompt).toContain('education');
      expect(prompt).toContain('experience');
    });

    test('comprehensive prompt should include markers', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('===== START PROFILE DATA =====');
      expect(prompt).toContain('===== END PROFILE DATA =====');
    });

    test('comprehensive prompt should include instructions', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('INSTRUCTIONS');
      expect(prompt).toContain('Answer each question');
      expect(prompt).toContain('JSON format');
    });

    test('comprehensive prompt should include format examples', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('YYYY-MM-DD');
      expect(prompt).toContain('Example:');
    });
  });

  describe('buildInterviewPrompt - concise mode', () => {
    test('should generate concise prompt with lmstudio type', () => {
      const prompt = buildInterviewPrompt(mockProfile, { modelType: 'lmstudio', concise: true });
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeLessThan(500);
    });

    test('concise prompt should include markers', () => {
      const prompt = buildInterviewPrompt(mockProfile, { modelType: 'lmstudio' });
      expect(prompt).toContain('===== START PROFILE DATA =====');
      expect(prompt).toContain('===== END PROFILE DATA =====');
    });

    test('concise prompt should be shorter than comprehensive', () => {
      const comprehensive = buildInterviewPrompt(mockProfile);
      const concise = buildInterviewPrompt(mockProfile, { modelType: 'lmstudio', concise: true });
      expect(concise.length).toBeLessThan(comprehensive.length);
    });

    test('concise prompt with concise option should use short format', () => {
      const prompt = buildInterviewPrompt(mockProfile, { concise: true });
      expect(prompt).toContain('===== START PROFILE DATA =====');
    });
  });

  describe('buildInterviewPrompt - edge cases', () => {
    test('should handle empty profile', () => {
      const prompt = buildInterviewPrompt({});
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    test('should handle profile without skills', () => {
      const profile = { data: { personalInfo: mockProfile.data.personalInfo } };
      const prompt = buildInterviewPrompt(profile);
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
    });

    test('should handle profile without experience', () => {
      const profile = {
        data: {
          personalInfo: mockProfile.data.personalInfo,
          skills: mockProfile.data.skills
        }
      };
      const prompt = buildInterviewPrompt(profile);
      expect(prompt).toBeDefined();
    });

    test('should handle null profile gracefully', () => {
      const prompt = buildInterviewPrompt(null);
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
    });

    test('should handle undefined profile gracefully', () => {
      const prompt = buildInterviewPrompt(undefined);
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
    });
  });

  describe('buildQuickUpdatePrompt', () => {
    test('should generate quick update prompt', () => {
      const prompt = buildQuickUpdatePrompt(mockProfile);
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
    });

    test('quick update prompt should include current info', () => {
      const prompt = buildQuickUpdatePrompt(mockProfile);
      expect(prompt).toContain('John');
      expect(prompt).toContain('Doe');
      expect(prompt).toContain('john@example.com');
    });

    test('quick update prompt should include markers', () => {
      const prompt = buildQuickUpdatePrompt(mockProfile);
      expect(prompt).toContain('===== START PROFILE DATA =====');
      expect(prompt).toContain('===== END PROFILE DATA =====');
    });

    test('quick update prompt should be shorter than comprehensive', () => {
      const comprehensive = buildInterviewPrompt(mockProfile);
      const quickUpdate = buildQuickUpdatePrompt(mockProfile);
      expect(quickUpdate.length).toBeLessThan(comprehensive.length);
    });

    test('quick update prompt should reference current role', () => {
      const prompt = buildQuickUpdatePrompt(mockProfile);
      expect(prompt).toContain('Senior Engineer');
    });

    test('quick update prompt should include skills', () => {
      const prompt = buildQuickUpdatePrompt(mockProfile);
      expect(prompt).toContain('JavaScript');
    });
  });

  describe('prompt content quality', () => {
    test('comprehensive prompt should be well-formatted', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('#');
      expect(prompt).toContain('---');
    });

    test('comprehensive prompt should have clear structure', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      const lines = prompt.split('\n');
      expect(lines.length).toBeGreaterThan(50);
    });

    test('prompt should include date format guidance', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toMatch(/YYYY-MM-DD|date-time/i);
    });

    test('prompt should specify JSON format requirements', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('double quotes');
    });

    test('prompt should include field type examples', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      expect(prompt).toContain('name@example.com');
      expect(prompt).toContain('+1-555-123-4567');
    });
  });

  describe('prompt markers and format', () => {
    test('all prompts should have start/end markers', () => {
      const p1 = buildInterviewPrompt(mockProfile);
      const p2 = buildInterviewPrompt(mockProfile, { modelType: 'lmstudio' });
      const p3 = buildQuickUpdatePrompt(mockProfile);

      [p1, p2, p3].forEach(prompt => {
        expect(prompt).toContain('===== START PROFILE DATA =====');
        expect(prompt).toContain('===== END PROFILE DATA =====');
      });
    });

    test('markers should be properly positioned', () => {
      const prompt = buildInterviewPrompt(mockProfile);
      const startIdx = prompt.indexOf('===== START PROFILE DATA =====');
      const endIdx = prompt.indexOf('===== END PROFILE DATA =====');
      expect(startIdx).toBeGreaterThan(-1);
      expect(endIdx).toBeGreaterThan(startIdx);
    });
  });
});
