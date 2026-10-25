import { helkaToStrings, landFromClient, landToPayload } from './land';

describe('land helpers', () => {
  it('shapes a client for editing, with at least one חלקה field', () => {
    expect(landFromClient({ city: 'עכו', gush: 12, helka: [3, 4], migrash: '6א' }))
      .toEqual({ city: 'עכו', gush: 12, helka: ['3', '4'], migrash: '6א' });
    expect(landFromClient({})).toEqual({ city: '', gush: '', helka: [''], migrash: '' });
    expect(helkaToStrings(null)).toEqual(['']);
  });

  it('turns edited fields into the saved columns', () => {
    expect(landToPayload({ city: 'עכו', gush: '12', helka: ['3', ' ', 'x', '-1', '4'], migrash: ' 6א ' }))
      .toEqual({ city: 'עכו', gush: 12, helka: [3, 4], migrash: '6א' });
    expect(landToPayload({ city: '', gush: '', helka: [''], migrash: '' }))
      .toEqual({ city: '', gush: '', helka: null, migrash: null });
  });
});
