import { buildInitialLd, computeCurrentPhase } from './licensingData';
import { licensingPhasesFor } from '../../constants';

const clientAt = (conditions, confirmation) => ({
  licensing_data: {
    info: { online_info_status: 'online_info_received' },
    application: { meeting: { status: 'approved' } },
    conditions: { fee_status: 'fee_paid', permit_status: 'signed', ...conditions },
    ...(confirmation && { confirmation }),
  },
});
const phaseOf = (conditions, confirmation) => computeCurrentPhase(buildInitialLd(clientAt(conditions, confirmation)));
const keys = (conditions) => licensingPhasesFor(conditions).map(p => p.key);

test('תנאים טופס 4 is a step only when the answer is yes', () => {
  expect(keys({})).toEqual(['info', 'application', 'conditions']);
  expect(keys({ open_form4: 'yes' })).toEqual(['info', 'application', 'conditions', 'form4']);
  expect(keys({ needs_start_approval: 'yes', open_form4: 'yes' }))
    .toEqual(['info', 'application', 'conditions', 'confirmation', 'form4']);
});

test('a new client gets the two טופס 4 rows, at לא', () => {
  const { form4 } = buildInitialLd({ licensing_data: {} });
  expect(form4.rows.map(r => [r.label, r.status])).toEqual([['מצבית עדכנית', 'no'], ['תשלום שיפור מיגון', 'no']]);
});

test('where the client stands', () => {
  // As before: no טופס 4 → תנאים or אישור התחלת עבודה.
  expect(phaseOf({ needs_start_approval: 'no' })).toBe('conditions');
  expect(phaseOf({ needs_start_approval: 'yes' })).toBe('confirmation');
  // טופס 4 without אישור התחלת עבודה.
  expect(phaseOf({ needs_start_approval: 'no', open_form4: 'yes' })).toBe('form4');
  // Both: טופס 4 once אישור התחלת עבודה is done.
  expect(phaseOf({ needs_start_approval: 'yes', open_form4: 'yes' })).toBe('confirmation');
  expect(phaseOf({ needs_start_approval: 'yes', open_form4: 'yes' }, { rows: [{ label: 'התארגנות', status: 'present' }] }))
    .toBe('form4');
});
