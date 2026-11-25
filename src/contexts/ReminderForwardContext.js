import { createContext } from 'react';

// Lets a row's reminder (StatusTable's תזכורת cell) be forwarded to a worker
// before it's due. ClientDetail provides forward(reminder) for managers on an
// open file; null everywhere else, so the button doesn't show.
export const ReminderForwardContext = createContext(null);
