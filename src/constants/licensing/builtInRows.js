import {
  DEFAULT_REQUEST_ACTIONS, REMOVED_REQUEST_ACTIONS, QUESTION_ROWS,
} from './request';
import {
  DEFAULT_CONDITION_ROWS, RENAMED_CONDITION_ROWS,
} from './conditions';
import {
  DEFAULT_CONFIRMATION_ROWS,
} from './confirmation';
import {
  DEFAULT_FORM4_ROWS,
} from './form4';

// The rows the app itself creates in each licensing table. Any other row was
// added by a worker (+ הוסף שורה) and can be removed again.
const BUILT_IN_ROWS = {
  actions: new Set([
    ...DEFAULT_REQUEST_ACTIONS, ...REMOVED_REQUEST_ACTIONS,
    ...Object.values(QUESTION_ROWS).flatMap(q => q.actions),
  ]),
  conditions: new Set([
    ...DEFAULT_CONDITION_ROWS, ...Object.keys(RENAMED_CONDITION_ROWS), ...Object.values(RENAMED_CONDITION_ROWS),
    ...Object.values(QUESTION_ROWS).flatMap(q => q.conditions),
  ]),
  confirmation: new Set(DEFAULT_CONFIRMATION_ROWS),
  form4: new Set(DEFAULT_FORM4_ROWS),
};
export const isBuiltInRow = (kind, label) => BUILT_IN_ROWS[kind].has(label);
