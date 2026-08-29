export function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return <div className="w-16 h-8" />;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  // Define SVG dimensions
  const width = 64; // 4rem (w-16)
  const height = 32; // 2rem (h-8)
  
  // Generate polyline points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    // Invert Y axis so higher values go up
    const y = range === 0 ? height / 2 : height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `sparkline-gradient-${color.replace("#", "")}`;

  return (
    <svg width={width} height={height} className="overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      <polygon
        fill={`url(#${gradientId})`}
        points={fillPoints}
      />
      
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

