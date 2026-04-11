import { useMemo } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/lib/constants';

interface Props {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

const TRACK_COLOR = '#E5E7EB';
const PROGRESS_COLOR = Colors.lavenderLight; // #C4B5FD

export function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 4,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const strokeDashoffset = useMemo(
    () => circumference * (1 - Math.min(Math.max(progress, 0), 1)),
    [circumference, progress],
  );

  return (
    <Svg width={size} height={size}>
      {/* Background track */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={TRACK_COLOR}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress fill */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={PROGRESS_COLOR}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}
