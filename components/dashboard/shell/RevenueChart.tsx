export type RevenuePoint = {
  day: string;
  amountCents: number;
};

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING_Y = 12;

function buildPath(points: RevenuePoint[]) {
  const max = Math.max(...points.map((point) => point.amountCents), 1);
  const stepX = CHART_WIDTH / (points.length - 1);
  const usableHeight = CHART_HEIGHT - PADDING_Y * 2;

  const coordinates = points.map((point, index) => {
    const x = index * stepX;
    const y = PADDING_Y + usableHeight - (point.amountCents / max) * usableHeight;
    return { x, y };
  });

  const linePath = coordinates
    .map((coordinate, index) => `${index === 0 ? "M" : "L"}${coordinate.x.toFixed(1)},${coordinate.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;

  return { linePath, areaPath };
}

function buildDateTicks(referenceDate: Date, pointCount: number) {
  const formatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });
  const daysAgo = (n: number) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - n);
    return formatter.format(date);
  };

  return {
    start: daysAgo(pointCount - 1),
    middle: daysAgo(Math.floor((pointCount - 1) / 2)),
    end: "Aujourd'hui",
  };
}

export function RevenueChart({ points, referenceDate }: { points: RevenuePoint[]; referenceDate: Date }) {
  const totalCents = points.reduce((sum, point) => sum + point.amountCents, 0);

  if (points.length < 2 || totalCents === 0) {
    return (
      <div>
        <p className="text-2xl font-semibold tracking-tight text-white">
          {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(0)}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">Cumul sur les 30 derniers jours</p>
        <div className="mt-6 flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-800 text-sm text-neutral-600">
          Pas encore de commande payée sur cette période.
        </div>
      </div>
    );
  }

  const { linePath, areaPath } = buildPath(points);
  const ticks = buildDateTicks(referenceDate, points.length);

  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-white">
        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(totalCents / 100)}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">Cumul sur les 30 derniers jours</p>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-4 h-32 w-full overflow-visible"
        role="img"
        aria-label="Évolution du chiffre d'affaires sur 30 jours"
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT * fraction}
            y2={CHART_HEIGHT * fraction}
            stroke="#27272a"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} fill="url(#revenue-fill)" />
        <path d={linePath} fill="none" stroke="#facc15" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-600">
        <span>{ticks.start}</span>
        <span>{ticks.middle}</span>
        <span>{ticks.end}</span>
      </div>
    </div>
  );
}
