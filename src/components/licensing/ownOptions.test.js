import { selectFor } from './StatusTable';
import { CONDITION_COLUMNS } from './ConditionsPhase';
import { isActionDone } from './RequestPhase';
import { newStatusRow } from '../AddRow';
import { isConditionRowDone } from '../../constants';
import { addedRowHistory } from '../../utils/addedRows';

const OWN = [{ value: 'missing', label: 'חסר' }, { value: 'בבדיקה', label: 'בבדיקה' }, { value: 'אושר', label: 'אושר' }];
const statusCol = CONDITION_COLUMNS.find(c => c.key === 'status');

test('a row added with its own options shows them, last one green', () => {
  const row = newStatusRow('בדיקה', 'missing', OWN);
  const { options, statusColors } = selectFor(statusCol, row);
  expect(options).toBe(OWN);
  expect(statusColors['אושר']).toBe('green');
  expect(statusColors.missing).toBe('red');
});

test('a row without its own options keeps the usual dropdown', () => {
  const row = newStatusRow('בדיקה', 'missing');
  expect(row.options).toBeUndefined();
  expect(selectFor(statusCol, row).options.map(o => o.label)).toEqual(['חסר', 'נשלח', 'מוכן', 'לא נדרש']);
});

test('rows added before in a section are offered again, most used first, with their options', () => {
  const client = (rows) => ({ licensing_data: { conditions: { rows } } });
  const clients = [
    client([newStatusRow('השבחה', 'missing'), newStatusRow('בדיקה', 'missing', OWN), newStatusRow('מים', 'missing')]),
    client([newStatusRow('מים', 'sent')]),
    { licensing_data: null },
  ];
  expect(addedRowHistory(clients, 'conditions')).toEqual([
    { label: 'מים', options: null },
    { label: 'בדיקה', options: OWN },
  ]);
  expect(addedRowHistory(clients, 'actions')).toEqual([]);
});

test('the last own option counts as done', () => {
  expect(isConditionRowDone(newStatusRow('בדיקה', 'אושר', OWN))).toBe(true);
  expect(isConditionRowDone(newStatusRow('בדיקה', 'בבדיקה', OWN))).toBe(false);
  expect(isActionDone(newStatusRow('בדיקה', 'אושר', OWN))).toBe(true);
  expect(isActionDone(newStatusRow('בדיקה', 'בבדיקה', OWN))).toBe(false);
});
