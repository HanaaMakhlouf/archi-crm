import { describeClientChange, describeChangeLines } from './changeSummary';

describe('describeClientChange (last-change summary)', () => {
  it('returns null for a new client or no change', () => {
    expect(describeClientChange({ phone: '1' }, null)).toBeNull();
    expect(describeClientChange({ phone: '1' }, { phone: '1' })).toBeNull();
  });

  it('shows the new value of a top-level field', () => {
    expect(describeClientChange({ city: 'חיפה' }, { city: 'עכו' })).toBe('עיר: חיפה');
  });

  it('truncates long free-text notes', () => {
    const summary = describeClientChange({ notes: 'א'.repeat(60) }, { notes: '' });
    expect(summary).toBe(`הערות: ${'א'.repeat(40)}…`);
  });

  it('points at the first changed leaf of nested data only', () => {
    const before = { planning_data: { tables: { offer: { status: 'a', notes: 'x' } } } };
    const after = { planning_data: { tables: { offer: { status: 'b', notes: 'y' } } } };
    expect(describeClientChange(after, before)).toBe('תכנון · הצעה - סטטוס: b');
  });
});

describe('describeChangeLines (activity log)', () => {
  it('lists every changed leaf with before ← after', () => {
    const oldData = { planning_data: { tables: { offer: { status: 'a', notes: 'x' } } } };
    const newData = { planning_data: { tables: { offer: { status: 'b', notes: 'y' } } } };
    expect(describeChangeLines(newData, oldData)).toEqual([
      'תכנון · הצעה - סטטוס: a ← b',
      'תכנון · הצעה - הערות: x ← y',
    ]);
  });

  it('describes a section that did not exist before field by field', () => {
    const lines = describeChangeLines({ planning_data: { notes: 'חדש' } }, { planning_data: null });
    expect(lines).toEqual(['תכנון · הערות: (ריק) ← חדש']);
  });

  it('describes added and removed table rows as counts', () => {
    const row = { label: 'r', status: '' };
    expect(describeChangeLines(
      { licensing_data: { info: { rows: [row, { ...row, label: 's' }] } } },
      { licensing_data: { info: { rows: [row] } } },
    )).toEqual(['רישוי · מידע - שורות: נוספה שורה']);
    expect(describeChangeLines(
      { licensing_data: { info: { rows: [] } } },
      { licensing_data: { info: { rows: [row, row, row] } } },
    )).toEqual(['רישוי · מידע - שורות: נמחקו 3 שורות']);
  });

  it('handles top-level fields and missing data', () => {
    expect(describeChangeLines({ city: 'חיפה', priority: null }, { city: 'עכו', priority: null }))
      .toEqual(['עיר: עכו ← חיפה']);
    expect(describeChangeLines(null, null)).toEqual([]);
  });
});
