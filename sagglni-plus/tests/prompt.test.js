const { buildInterviewPrompt } = require('../src/popup/prompt-generator');

describe('Prompt Generator - Basic', () => {
  test('builds a comprehensive interview prompt from profile', () => {
    const profile = { data: { personalInfo: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+966555' } } };
    const prompt = buildInterviewPrompt(profile);
    // Comprehensive prompt should contain interview sections
    expect(prompt).toContain('PERSONAL INFORMATION');
    expect(prompt).toContain('EDUCATION');
    expect(prompt).toContain('WORK EXPERIENCE');
    expect(prompt).toContain('===== START PROFILE DATA =====');
  });

  test('builds a concise LM Studio prompt for local models', () => {
    const profile = { data: { personalInfo: { firstName: 'Jane', lastName: 'Roe', email: 'jane@ex.com', phone: '+96111' }, skills: { technical: ['js', 'node', 'react'] } } };
    const prompt = buildInterviewPrompt(profile, { modelType: 'lmstudio', concise: true });
    expect(prompt).toContain('===== START PROFILE DATA =====');
    expect(prompt).toContain('===== END PROFILE DATA =====');
    // concise prompt should be shorter than comprehensive
    const comprehensivePrompt = buildInterviewPrompt(profile);
    expect(prompt.length).toBeLessThan(comprehensivePrompt.length);
  });

  test('comprehensive prompt includes all profile data', () => {
    const profile = { 
      data: { 
        personalInfo: { 
          firstName: 'John', 
          lastName: 'Doe', 
          email: 'john@example.com', 
          phone: '+966555' 
        },
        skills: {
          technical: ['JavaScript', 'Python']
        }
      } 
    };
    const prompt = buildInterviewPrompt(profile);
    expect(prompt).toContain('full legal name');
    expect(prompt).toContain('email address');
    expect(prompt).toContain('phone number');
    expect(prompt).toContain('TECHNICAL SKILLS');
  });

  test('prompt includes JSON example', () => {
    const profile = { data: { personalInfo: { firstName: 'Test' } } };
    const prompt = buildInterviewPrompt(profile);
    expect(prompt).toContain('json');
    expect(prompt).toContain('firstName');
    expect(prompt).toContain('education');
  });

  test('prompt includes markers for JSON output', () => {
    const profile = { data: { personalInfo: { firstName: 'Test' } } };
    const prompt = buildInterviewPrompt(profile);
    expect(prompt).toContain('===== START PROFILE DATA =====');
    expect(prompt).toContain('===== END PROFILE DATA =====');
  });
});
