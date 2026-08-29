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

  return (
    <svg width={width} height={height} className="overflow-visible" viewBox={`0 0 ${width} ${height}`}>
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

