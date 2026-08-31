import type { ReactNode } from 'react';
import { HiArrowSmLeft, HiArrowSmRight } from 'react-icons/hi';

interface MatchdayHeadlineProps {
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}

const MatchdayHeadline = ({
  isLoading,
  onPrev,
  onNext,
  children,
}: MatchdayHeadlineProps) => (
  <div className="matchday-headline">
    <button
      type="button"
      className="prev-btn"
      onClick={onPrev}
      disabled={isLoading}
    >
      <HiArrowSmLeft />
      <p>vorheriger Spieltag</p>
    </button>
    <h1>{children}</h1>
    <button
      type="button"
      className="next-btn"
      onClick={onNext}
      disabled={isLoading}
    >
      <p>nächster Spieltag</p>
      <HiArrowSmRight />
    </button>
  </div>
);

export default MatchdayHeadline;
