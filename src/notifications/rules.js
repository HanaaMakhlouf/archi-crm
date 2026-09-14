import {
    LABEL_NEW,
    NOTIF_TYPE_NEW_CLIENT_STALE,
} from '../constants';

// Add new rules here. Each rule is evaluated against every client on every tick.
// type: unique string key (use NOTIF_TYPE_* constant)
// delayDays: how many calendar days after client.created_at before the rule can fire
// check(client): return true if the notification should show
// getMessage(client): return the Hebrew notification text

export const NOTIFICATION_RULES = [
    {
        type: NOTIF_TYPE_NEW_CLIENT_STALE,
        delayDays: 1,
        check: (client) => client.label === LABEL_NEW,
        getMessage: (client) => `הלקוח "${client.name}" עדיין מסומן כלקוח חדש`,
    },
];
