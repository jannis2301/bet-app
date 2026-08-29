import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useClickOutside } from './useClickOutside';

const TestComponent = ({
  onOutsideClick,
  enabled = true,
}: {
  onOutsideClick: () => void;
  enabled?: boolean;
}) => {
  const ref = useClickOutside<HTMLDivElement>(onOutsideClick, enabled);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <div data-testid="outside">outside</div>
    </div>
  );
};

describe('useClickOutside', () => {
  it('calls the handler on a click outside the referenced element', () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.mouseDown(getByTestId('outside'));

    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler on a click inside the referenced element', () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.mouseDown(getByTestId('inside'));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it('does nothing when disabled', () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} enabled={false} />
    );

    fireEvent.mouseDown(getByTestId('outside'));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });
});
