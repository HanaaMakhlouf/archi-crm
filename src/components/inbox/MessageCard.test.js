import { render, screen, fireEvent } from '@testing-library/react';
import MessageCard from './MessageCard';

const message = {
  id: 'm1',
  sender_email: 'dana@example.com',
  created_at: '2026-11-20T09:30:00Z',
  client_id: '7',
  client_name: 'לקוח לדוגמה',
  section_key: 'licensing.conditions.rows',
  notification_text: 'השבחה',
  message: 'נא לעדכן עד מחר',
  read_at: null,
  attachments: [{ path: 'o/a.pdf', name: 'תוכנית.pdf', size: 2048 }],
};

test('shows the message, its file and the actions; עבור ללקוח marks it read and opens the client', () => {
  const onMarkRead = jest.fn();
  const onOpenClient = jest.fn();
  const client = { id: 7 };
  render(<MessageCard message={message} client={client} onMarkRead={onMarkRead} onOpenClient={onOpenClient} onEnlarge={() => {}} />);

  expect(screen.getByText('חדש')).toBeInTheDocument();
  expect(screen.getByText('לקוח לדוגמה')).toBeInTheDocument();
  expect(screen.getByText('נא לעדכן עד מחר')).toBeInTheDocument();
  expect(screen.getByText('תוכנית.pdf')).toBeInTheDocument();
  expect(screen.queryByText('עדכון סטטוס')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('עבור ללקוח'));
  expect(onMarkRead).toHaveBeenCalledWith('m1');
  expect(onOpenClient).toHaveBeenCalledWith(client, 'licensing.conditions.rows');
});

test('a worker status update is tagged; a read message has no חדש / סמן כנקרא; no client → no עבור ללקוח', () => {
  render(<MessageCard message={{ ...message, kind: 'status_update', read_at: '2026-11-21T00:00:00Z', attachments: [] }}
    client={null} onMarkRead={() => {}} onOpenClient={() => {}} onEnlarge={() => {}} />);
  expect(screen.getByText('עדכון סטטוס')).toBeInTheDocument();
  expect(screen.queryByText('חדש')).not.toBeInTheDocument();
  expect(screen.queryByText('סמן כנקרא')).not.toBeInTheDocument();
  expect(screen.queryByText('עבור ללקוח')).not.toBeInTheDocument();
});
