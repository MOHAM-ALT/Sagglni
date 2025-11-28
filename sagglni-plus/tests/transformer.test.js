const DataTransformer = require('../src/transformer/transformer');

describe('DataTransformer', () => {
  test('transformPhone adds +966 for 9-digit local numbers starting with 5', () => {
    const dt = new DataTransformer();
    const result = dt.transformPhone('555555555');
    expect(result).toBe('+966555555555');
  });

  test('transformEmail lowercases', () => {
    const dt = new DataTransformer();
    expect(dt.transformEmail('Test@Example.COM')).toBe('test@example.com');
  });
});
