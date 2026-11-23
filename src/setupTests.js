// Runs before every test file.

// jest-dom adds DOM matchers, e.g. expect(element).toHaveTextContent(/react/i)
// https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';

// The test environment has no crypto.randomUUID, which the app uses for new rows' ids.
if (!global.crypto?.randomUUID) global.crypto = webcrypto;
