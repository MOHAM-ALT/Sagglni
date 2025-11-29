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

  test('builds a concise LM Studio prompt for local models', () => {
    const profile = { data: { personalInfo: { firstName: 'Jane', lastName: 'Roe', email: 'jane@ex.com', phone: '+96111' }, skills: { technical: ['js','node','react'] } } };
    const prompt = buildInterviewPrompt(profile, { modelType: 'lmstudio', concise: true });
    expect(prompt).toContain('Output between markers');
    // concise prompt should not contain long repeated instructions
    expect(prompt.length).toBeLessThan(600);
  });
});
