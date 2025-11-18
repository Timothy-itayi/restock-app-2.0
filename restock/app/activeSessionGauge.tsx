import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export default function ActiveSessionGauge({
  count,
  max = 5, // arbitrary scale
  size = 110,
  colors
}: {
  count: number;
  max?: number;
  size?: number;
  colors: {
    track: string;
    fill: string;
    center: string;
  };
}) {
  const percent = Math.min(count / max, 1);

  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = -90;
  const sweepAngle = percent * 360;
  const endAngle = startAngle + sweepAngle;

  const polar = (angle: number) => {
    const rad = (Math.PI * angle) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const start = polar(startAngle);
  const end = polar(endAngle);

  const largeArc = sweepAngle > 180 ? 1 : 0;

  const arcPath = `
    M ${start.x} ${start.y}
    A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}
  `;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.track}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Filled arc */}
        <Path
          d={arcPath}
          stroke={colors.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner dot */}
        <Circle cx={cx} cy={cy} r={6} fill={colors.center} />
      </Svg>
    </View>
  );
}
