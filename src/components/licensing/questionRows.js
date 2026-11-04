import { isQuestionRowShown } from '../../constants';

// Rows that a request question hides stay in the saved list (their statuses
// survive a yes → no → yes), so tables work on the shown rows only.

const rowKey = (r) => r.id ?? r.label;

// kind: 'actions' | 'conditions'; answers: the request, which holds the answers.
export const shownRows = (rows, kind, answers) =>
  rows.filter(r => isQuestionRowShown(r.label, kind, answers));

// A table's edited (shown) rows → back into the full list: edits replace their
// row, hidden rows keep their place, rows the table removed are dropped and
// rows it added go at the end.
export const mergeShownRows = (all, nextShown, kind, answers) => {
  const edited = new Map(nextShown.map(r => [rowKey(r), r]));
  const kept = all.flatMap(r => {
    if (edited.has(rowKey(r))) return [edited.get(rowKey(r))];
    return isQuestionRowShown(r.label, kind, answers) ? [] : [r];
  });
  const known = new Set(all.map(rowKey));
  return [...kept, ...nextShown.filter(r => !known.has(rowKey(r)))];
};

// Appends a row for each label not in the list yet.
export const addMissingRows = (rows, labels, makeRow) =>
  [...rows, ...labels.filter(l => !rows.some(r => r.label === l)).map(makeRow)];
