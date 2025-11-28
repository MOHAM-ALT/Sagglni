const { stripMarkers, parseProfileJSON, validateProfile } = require('../src/popup/validation');

describe('Validation Utilities', () => {
  test('stripMarkers removes markers', () => {
    const raw = '===== START PROFILE DATA ===== {"personalInfo": {"firstName":"A"}} ===== END PROFILE DATA =====';
    const s = stripMarkers(raw);
    expect(s).toContain('"personalInfo"');
  });

  test('parseProfileJSON parses valid JSON', () => {
    const raw = '{"personalInfo": {"firstName":"A","lastName":"B","email":"a@b.com","phone":"+123"}}';
    const obj = parseProfileJSON(raw);
    expect(obj.personalInfo.firstName).toBe('A');
  });

  test('validateProfile returns errors for missing fields', () => {
    const obj = { personalInfo: { firstName: 'A' } };
    const v = validateProfile(obj);
    expect(v.isValid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  test('validateProfile accepts well-formed profile', () => {
    const obj = { personalInfo: { firstName: 'A', lastName: 'B', email: 'test@example.com', phone: '+123' } };
    const v = validateProfile(obj);
    expect(v.isValid).toBe(true);
  });
});
