const sum = require('./subject');
const Subject = require('./subject');

test('creates subject with a shortName to equal the shortName', () => {
  const s = new Subject({shortName: 'TEST'});
  
  expect(s.shortName).toBe('TEST');
});