const buildInterviewPrompt = require('../src/popup/prompt-generator').buildInterviewPrompt;

describe('Prompt Generator', () => {
  test('builds a basic interview prompt from profile basics', () => {
    const profile = { data: { personalInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+966555' } } };
    const prompt = buildInterviewPrompt(profile);
    expect(prompt).toContain('First Name: John');
    expect(prompt).toContain('Last Name: Doe');
    expect(prompt).toContain('Email: john@example.com');
    expect(prompt).toContain('Phone: +966555');
  });
});
