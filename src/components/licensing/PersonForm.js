export const makeEmptyPerson = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: '', surname: '', id_number: '', phone: '', email: '',
  ...overrides,
});
