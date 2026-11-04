import { shownRows, mergeShownRows, addMissingRows } from './questionRows';
import {
  isQuestionRowShown, Q_PUBLIC_USE, Q_RELIEFS, ANSWER_YES, ANSWER_NO,
  ACTION_LABEL_TRANSPORT, CONDITION_CONTROL_INSTITUTE,
} from '../../constants';

const row = (id, label, status = 'x') => ({ id, label, status });

describe('isQuestionRowShown', () => {
  it('shows regular rows always, question rows only on yes', () => {
    expect(isQuestionRowShown('בעלות', 'actions', {})).toBe(true);
    expect(isQuestionRowShown(ACTION_LABEL_TRANSPORT, 'actions', {})).toBe(false);
    expect(isQuestionRowShown(ACTION_LABEL_TRANSPORT, 'actions', { [Q_PUBLIC_USE]: ANSWER_NO })).toBe(false);
    expect(isQuestionRowShown(ACTION_LABEL_TRANSPORT, 'actions', { [Q_PUBLIC_USE]: ANSWER_YES })).toBe(true);
    expect(isQuestionRowShown('צילום בשטח', 'actions', { [Q_RELIEFS]: ANSWER_YES })).toBe(true);
    expect(isQuestionRowShown('בטיחות', 'conditions', {})).toBe(false);
    expect(isQuestionRowShown(CONDITION_CONTROL_INSTITUTE, 'conditions', { [Q_PUBLIC_USE]: ANSWER_YES })).toBe(true);
  });
});

describe('question rows in tables', () => {
  const all = [row(1, 'בעלות'), row(2, 'בטיחות', 'present'), row(3, 'בטון')];
  const answers = { [Q_PUBLIC_USE]: ANSWER_NO };

  it('hides rows the answers do not call for', () => {
    expect(shownRows(all, 'conditions', answers).map(r => r.id)).toEqual([1, 3]);
  });

  it('merges edits back, keeping hidden rows and their statuses in place', () => {
    const edited = [row(1, 'בעלות', 'done'), row(3, 'בטון'), row(9, 'חדש')];
    expect(mergeShownRows(all, edited, 'conditions', answers)).toEqual([
      row(1, 'בעלות', 'done'), row(2, 'בטיחות', 'present'), row(3, 'בטון'), row(9, 'חדש'),
    ]);
  });

  it('drops a shown row the table removed', () => {
    expect(mergeShownRows(all, [row(3, 'בטון')], 'conditions', answers).map(r => r.id)).toEqual([2, 3]);
  });

  it('adds only the missing labels', () => {
    const next = addMissingRows(all, ['בטיחות', 'נגישות'], (label) => row(7, label));
    expect(next.map(r => r.label)).toEqual(['בעלות', 'בטיחות', 'בטון', 'נגישות']);
  });
});
