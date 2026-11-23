import { buildInitialLd, computeCurrentPhase } from '../LicensingTab';
import { isPermitSigned } from '../../constants';

// The test runner has no crypto.randomUUID (new rows' ids).
beforeAll(() => { if (!global.crypto) global.crypto = { randomUUID: () => String(Math.random()) }; });

const conditionsOf =(permit_status) => buildInitialLd({ licensing_data: { conditions: { permit_status } } }).conditions;
const pick = (c) => [c.fee_status, c.permit_status];

test("clients saved before אגרות: היתר's old fee steps become the fee's status", () => {
  expect(pick(conditionsOf(undefined))).toEqual(['fee_not_issued', 'not_printed']);
  expect(pick(conditionsOf('fee_not_given'))).toEqual(['fee_not_issued', 'not_printed']);
  expect(pick(conditionsOf('fee_given'))).toEqual(['fee_paid', 'not_printed']);
  expect(pick(conditionsOf('printed'))).toEqual(['fee_paid', 'printed']);
  expect(pick(conditionsOf('signed'))).toEqual(['fee_paid', 'signed']);
});

test('a saved fee status is kept', () => {
  const ld = buildInitialLd({ licensing_data: { conditions: { fee_status: 'fee_issued', permit_status: 'not_printed' } } });
  expect(pick(ld.conditions)).toEqual(['fee_issued', 'not_printed']);
});

test('היתר counts as signed only once the fee is settled', () => {
  expect(isPermitSigned({ fee_status: 'fee_paid', permit_status: 'signed' })).toBe(true);
  expect(isPermitSigned({ fee_status: 'fee_not_required', permit_status: 'signed' })).toBe(true);
  expect(isPermitSigned({ fee_status: 'fee_issued', permit_status: 'signed' })).toBe(false);
});

test('a client whose old היתר was signed keeps moving to אישור התחלת עבודה', () => {
  const ld = buildInitialLd({
    licensing_data: {
      info: { online_info_status: 'online_info_received' },
      application: { meeting: { status: 'approved' } },
      conditions: { permit_status: 'signed', needs_start_approval: 'yes' },
    },
  });
  expect(computeCurrentPhase(ld)).toBe(computeCurrentPhase({ ...ld, conditions: { ...ld.conditions, fee_status: 'fee_paid' } }));
});
