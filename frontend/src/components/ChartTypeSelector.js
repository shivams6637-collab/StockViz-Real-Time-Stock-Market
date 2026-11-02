import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

const ChartTypes = {
  LINE: { value: "line", label: "Line Chart" },
  BAR: { value: "bar", label: "Bar Chart" },
  COLORED_BAR: { value: "colored_bar", label: "Candlestick Chart" },
};

const calculateRange = (data) => {
  if (!data || !data.length) return { min: 0, max: 100 };

  const prices = data
    .flatMap((d) => [d.high, d.low, d.open, d.close, d.price])
    .filter((v) => Number.isFinite(Number(v)))
    .map(Number);

  if (!prices.length) return { min: 0, max: 100 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1 || Math.abs(max) * 0.01 || 1;

  return { min: min - padding, max: max + padding };
};

const getThemeColors = () => {
  const dark = document.documentElement.getAttribute("data-theme") !== "light";

  return dark
    ? {
        text: "#a8b8cf",
        grid: "#34445b",
        tooltipBg: "#111d30",
        tooltipBorder: "#334863",
        tooltipText: "#edf4ff",
        line: "#38bdf8",
        bar: "#5687ff",
      }
    : {
        text: "#52647d",
        grid: "#d8e1ed",
        tooltipBg: "#ffffff",
        tooltipBorder: "#d5dfeb",
        tooltipText: "#172238",
        line: "#087fca",
        bar: "#4675e8",
      };
};

const CustomTooltip = ({ active, payload, label, formatDate, formatPrice }) => {
  if (!active || !payload || !payload.length) return null;

  const colors = getThemeColors();
  const item = payload.find((p) => p.value !== undefined);
  if (!item) return null;

  const raw = item.payload || {};
  const displayValue =
    raw.close ?? raw.price ?? raw.high ?? item.value;

  return (
    <div
      style={{
        background: colors.tooltipBg,
        border: `1px solid ${colors.tooltipBorder}`,
        borderRadius: 12,
        padding: "11px 14px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
        minWidth: 130,
      }}
    >
      <div
        style={{
          color: colors.text,
          fontSize: 12,
          marginBottom: 5,
          fontWeight: 500,
        }}
      >
        {formatDate ? formatDate(label) : label}
      </div>
      <div
        style={{
          color: colors.tooltipText,
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        {formatPrice ? formatPrice(displayValue) : displayValue}
      </div>
      {raw.open != null && raw.high != null && raw.low != null && raw.close != null && (
        <div style={{ color: colors.text, fontSize: 11, marginTop: 8, lineHeight: 1.7 }}>
          <div>O: {formatPrice ? formatPrice(raw.open) : raw.open}</div>
          <div>H: {formatPrice ? formatPrice(raw.high) : raw.high}</div>
          <div>L: {formatPrice ? formatPrice(raw.low) : raw.low}</div>
          <div>C: {formatPrice ? formatPrice(raw.close) : raw.close}</div>
        </div>
      )}
    </div>
  );
};

const CustomBar = (props) => {
  const { x, y, width, height, payload, minPrice } = props;
  if (!payload || !Number.isFinite(minPrice)) return null;

  const open = Number(payload.open);
  const close = Number(payload.close);
  const high = Number(payload.high);
  const low = Number(payload.low);

  if (![open, close, high, low].every(Number.isFinite)) return null;

  const range = high - minPrice;
  if (range <= 0 || !Number.isFinite(height) || height <= 0) return null;

  const scale = height / range;
  const priceY = (price) => y + (high - price) * scale;

  const openY = priceY(open);
  const closeY = priceY(close);
  const highY = priceY(high);
  const lowY = priceY(low);
  const centerX = x + width / 2;
  const bodyWidth = Math.max(Math.min(width * 0.7, 12), 2);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  const bodyY = Math.min(openY, closeY);
  const color = close >= open ? "#22c997" : "#f06470";

  return (
    <g>
      <line
        x1={centerX}
        y1={highY}
        x2={centerX}
        y2={lowY}
        stroke={color}
        strokeWidth={1.3}
      />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyY}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

const StockChart = ({
  data = [],
  chartType,
  formatDate,
  formatPrice,
  formatVolume,
  CustomTooltip: ProvidedTooltip,
  className,
}) => {
  const colors = getThemeColors();
  const { min, max } = calculateRange(data);

  const tooltip = (
    <Tooltip
      content={
        ProvidedTooltip ? (
          <ProvidedTooltip />
        ) : (
          <CustomTooltip formatDate={formatDate} formatPrice={formatPrice} />
        )
      }
      cursor={{ stroke: colors.line, strokeDasharray: "4 4", strokeOpacity: 0.45 }}
      isAnimationActive={false}
    />
  );

  const commonAxis = {
    tick: { fill: colors.text, fontSize: 11 },
    tickLine: { stroke: colors.grid },
    axisLine: { stroke: colors.grid },
    tickMargin: 10,
  };

  const grid = (
    <CartesianGrid
      stroke={colors.grid}
      strokeDasharray="3 5"
      vertical={false}
      strokeOpacity={0.75}
    />
  );

  const getChart = () => {
    switch (chartType) {
      case ChartTypes.COLORED_BAR.value:
        return (
          <BarChart data={data} margin={{ top: 12, right: 18, left: 8, bottom: 4 }} barCategoryGap={2}>
            {grid}
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              minTickGap={55}
              padding={{ left: 10, right: 10 }}
              {...commonAxis}
            />
            <YAxis
              domain={[min, max]}
              tickFormatter={formatPrice}
              width={76}
              tickCount={6}
              {...commonAxis}
            />
            {tooltip}
            <Bar
              dataKey="high"
              baseValue={min}
              shape={<CustomBar minPrice={min} />}
              isAnimationActive={false}
              maxBarSize={14}
            />
          </BarChart>
        );

      case ChartTypes.BAR.value:
        return (
          <BarChart data={data} margin={{ top: 12, right: 18, left: 8, bottom: 4 }}>
            {grid}
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              minTickGap={55}
              height={48}
              {...commonAxis}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={formatPrice}
              width={76}
              tickCount={6}
              {...commonAxis}
            />
            {tooltip}
            <Bar
              dataKey="close"
              fill={colors.bar}
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
              maxBarSize={18}
            />
          </BarChart>
        );

      default:
        return (
          <LineChart data={data} margin={{ top: 12, right: 18, left: 8, bottom: 4 }}>
            {grid}
            <XAxis
              dataKey="time"
              tickFormatter={formatDate}
              minTickGap={55}
              height={48}
              {...commonAxis}
            />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={formatPrice}
              width={76}
              tickCount={6}
              {...commonAxis}
            />
            {tooltip}
            <Line
              type="monotone"
              dataKey="price"
              stroke={colors.line}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: colors.line,
                stroke: colors.tooltipBg,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className={`sv-chart h-96 w-full min-w-0 ${className || ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        {getChart()}
      </ResponsiveContainer>
    </div>
  );
};

const ChartTypeSelector = ({ chartType, onChange }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const dark = document.documentElement.getAttribute("data-theme") !== "light";
  const selected = Object.values(ChartTypes).find((item) => item.value === chartType);

  const buttonStyle = {
    background: dark ? "#111d30" : "#ffffff",
    color: dark ? "#edf4ff" : "#172238",
    borderColor: dark ? "#30445e" : "#d3deeb",
  };

  return (
    <div className="relative min-w-0" ref={dropdownRef}>
      <button
        type="button"
        style={buttonStyle}
        className="w-full p-2.5 border rounded-xl flex items-center justify-between text-sm md:text-base"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
      >
        <span>{selected?.label || "Line Chart"}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showDropdown && (
        <div
          className="absolute left-0 mt-2 w-full min-w-36 py-1 border rounded-xl shadow-xl z-20"
          style={{
            background: dark ? "#111d30" : "#ffffff",
            borderColor: dark ? "#30445e" : "#d3deeb",
          }}
        >
          {Object.entries(ChartTypes).map(([key, item]) => (
            <button
              type="button"
              key={item.value}
              style={{
                color:
                  chartType === item.value
                    ? dark ? "#38bdf8" : "#087fca"
                    : dark ? "#dbe7f7" : "#34445b",
                background:
                  chartType === item.value
                    ? dark ? "#1a2b42" : "#eaf4ff"
                    : "transparent",
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:opacity-80"
              onClick={() => {
                onChange(item.value);
                setShowDropdown(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { ChartTypes, StockChart, ChartTypeSelector };
