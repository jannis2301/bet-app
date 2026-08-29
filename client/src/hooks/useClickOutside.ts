import { type RefObject, useEffect, useRef } from 'react';

// touchstart is needed alongside mousedown — some mobile browsers don't
// synthesize a mousedown from a tap quickly enough to close the element
// before the next interaction
export const useClickOutside = <T extends HTMLElement>(
  onOutsideClick: () => void,
  enabled = true
): RefObject<T | null> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [enabled, onOutsideClick]);

  return ref;
};
