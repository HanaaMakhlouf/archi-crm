// Clients saved by version 1.2.0 must open in the new version with nothing lost.
import { buildInitialLd, getCurrentLicensingPhaseLabel } from '../components/LicensingTab';
import { syncTextRows } from '../components/licensing/RequestPhase';
import { getCurrentPlanningStageLabel } from '../components/PlanningTab';
import {
  FIELD_LICENSING_DATA, FIELD_PLANNING_DATA,
  ONLINE_INFO_NOT_SENT, ONLINE_INFO_SENT, ONLINE_INFO_PASSED, ONLINE_INFO_RECEIVED,
  ACTION_LABEL_TAKANA, ACTION_LABEL_ESTATE_NOTICE,
  TEXT_STATUS_PREPARING, TEXT_STATUS_READY, TEXT_STATUS_RECEIVED,
} from '../constants';

// The test environment has no crypto.randomUUID (the app uses it for new people rows).
if (!global.crypto?.randomUUID) {
  global.crypto = { ...global.crypto, randomUUID: require('crypto').randomUUID };
}

const licensingClient = (info) => ({ id: 1, name: 'לקוח', [FIELD_LICENSING_DATA]: { info } });
const infoOf = (info) => buildInitialLd(licensingClient(info)).info;

describe('בקשת מידע לזמין — clients saved by 1.2.0', () => {
  it('keeps the old fields as saved', () => {
    const old = { info_note_status: 'sent', info_note_note: 'א', conditions_passed: 'cond_sent', conditions_note: 'ב' };
    expect(infoOf(old)).toMatchObject(old);
  });

  it('maps each old state to the new status', () => {
    expect(infoOf({}).online_info_status).toBe(ONLINE_INFO_NOT_SENT);
    expect(infoOf({ info_note_status: 'sent' }).online_info_status).toBe(ONLINE_INFO_SENT);
    expect(infoOf({ conditions_passed: 'cond_sent' }).online_info_status).toBe(ONLINE_INFO_SENT);
    expect(infoOf({ conditions_passed: 'cond_returned' }).online_info_status).toBe(ONLINE_INFO_SENT);
    expect(infoOf({ conditions_passed: 'cond_passed' }).online_info_status).toBe(ONLINE_INFO_PASSED);
    expect(infoOf({ conditions_passed: 'cond_received' }).online_info_status).toBe(ONLINE_INFO_RECEIVED);
    expect(infoOf({ conditions_passed: true }).online_info_status).toBe(ONLINE_INFO_RECEIVED);
  });

  it('keeps both notes, and הועבר לתיקון in the note', () => {
    const info = infoOf({ conditions_passed: 'cond_returned', info_note_note: 'א', conditions_note: 'ב' });
    expect(info.online_info_note).toBe('הועבר לתיקון · א · ב');
  });

  it('never re-migrates once the new row is saved', () => {
    const info = infoOf({ conditions_passed: 'cond_received', online_info_status: ONLINE_INFO_SENT, online_info_note: '' });
    expect(info.online_info_status).toBe(ONLINE_INFO_SENT);
    expect(info.online_info_note).toBe('');
  });

  it('keeps a client past מידע in the phase it was in', () => {
    expect(getCurrentLicensingPhaseLabel(licensingClient({ conditions_passed: 'cond_received' }))).not.toBe('מידע');
    expect(getCurrentLicensingPhaseLabel(licensingClient({ info_note_status: 'sent' }))).toBe('מידע');
  });
});

describe('תקנה / פרסום עזבון sync', () => {
  const rows = (takana, estate) => [
    { label: ACTION_LABEL_TAKANA, status: takana },
    { label: ACTION_LABEL_ESTATE_NOTICE, status: estate },
  ];
  const statusOf = (list, label) => list.find(r => r.label === label).status;

  it('moves the other row along its first two steps', () => {
    const next = syncTextRows(rows(TEXT_STATUS_PREPARING, TEXT_STATUS_PREPARING), rows(TEXT_STATUS_READY, TEXT_STATUS_PREPARING));
    expect(statusOf(next, ACTION_LABEL_ESTATE_NOTICE)).toBe(TEXT_STATUS_READY);
  });

  it('never undoes the other row once it is past them', () => {
    const next = syncTextRows(rows(TEXT_STATUS_RECEIVED, TEXT_STATUS_RECEIVED), rows(TEXT_STATUS_PREPARING, TEXT_STATUS_RECEIVED));
    expect(statusOf(next, ACTION_LABEL_ESTATE_NOTICE)).toBe(TEXT_STATUS_RECEIVED);
    const back = syncTextRows(rows(TEXT_STATUS_PREPARING, 'sent'), rows(TEXT_STATUS_PREPARING, TEXT_STATUS_READY));
    expect(statusOf(back, ACTION_LABEL_TAKANA)).toBe(TEXT_STATUS_READY);
  });
});

describe('planning — clients saved by 1.2.0', () => {
  const planningClient = (offer) => ({ id: 1, [FIELD_PLANNING_DATA]: { tables: { offer: { status: offer }, visualization: { status: 'not_started' } } } });

  it('an offer saved as מאושר counts as מוכן לביצוע and moves on to הדמיה', () => {
    expect(getCurrentPlanningStageLabel(planningClient('agreed'))).toMatch(/^הדמיה/);
  });

  it('an offer saved as מוכן reads as מוכן לביצוע', () => {
    expect(getCurrentPlanningStageLabel(planningClient('ready'))).toMatch(/^הדמיה/);
  });
});
