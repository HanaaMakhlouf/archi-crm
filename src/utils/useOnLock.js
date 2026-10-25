import { useEffect, useRef } from 'react';

// Runs onLock when `unlocked` turns from true to false — a section greys out
// again — e.g. to clear the reminders of the sections it gates.
export function useOnLock(unlocked, onLock) {
  const prev = useRef(unlocked);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    if (!unlocked && prev.current) onLockRef.current();
    prev.current = unlocked;
  }, [unlocked]);
}
