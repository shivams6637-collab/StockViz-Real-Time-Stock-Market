import React, { useLayoutEffect, useRef } from "react";

const barHeights = [
  24, 38, 19, 47, 31, 56, 27, 43, 35, 62, 29, 48,
  22, 53, 34, 44, 26, 59, 32, 46, 21, 51, 37, 28,
];

const markers = [
  { value: "09:15", top: "23%", left: "8%" },
  { value: "01", top: "37%", left: "24%" },
  { value: "15:30", top: "18%", left: "53%" },
  { value: "02", top: "61%", left: "68%" },
  { value: "03", top: "32%", left: "84%" },
  { value: "04", top: "72%", left: "43%" },
];

const particles = Array.from({ length: 20 }, (_, index) => ({
  left: `${(index * 47 + 13) % 100}%`,
  top: `${(index * 61 + 19) % 100}%`,
  size: `${2 + (index % 3)}px`,
  delay: `${-(index % 10) * 1.7}s`,
  duration: `${9 + (index % 6) * 2}s`,
}));

const trendPath =
  "M-30 590 H110 L168 558 L220 574 L286 490 L345 520 L412 452 L470 485 L542 421 L604 448 L670 374 L728 410 L795 356 L852 383 L916 315 L979 348 L1048 285 L1102 321 L1171 252 L1228 286 L1292 222 L1355 251 L1470 174";
const trendDashLength = 8.86;
const trendCycleLength = 100 - trendDashLength;
const trendDuration = 22_000;

function MarketBackground() {
  const blueLineRef = useRef(null);
  const redLineRef = useRef(null);

  useLayoutEffect(() => {
    const blueLine = blueLineRef.current;
    const redLine = redLineRef.current;
    if (!blueLine || !redLine) return undefined;

    const svg = blueLine.closest("svg");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const blueHalo = blueLine.querySelector(".sv-market-line-halo");
    const blueTrace = blueLine.querySelector(".sv-market-line-trace");
    const redHalo = redLine.querySelector(".sv-market-line-red-halo");
    const redTrace = redLine.querySelector(".sv-market-line-red-trace");
    const linePaths = [blueHalo, blueTrace, redHalo, redTrace];
    let frameId;
    let startTime;

    const updateTrendLine = (timestamp) => {
      if (reducedMotion.matches) {
        linePaths.forEach((path) => {
          path.style.removeProperty("stroke-dashoffset");
        });
        blueLine.style.removeProperty("opacity");
        redLine.style.removeProperty("opacity");
        delete svg.dataset.activeSegment;
        return;
      }
      if (startTime === undefined) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const phase = Math.floor(elapsed / trendDuration) % 2;
      const progress = (elapsed % trendDuration) / trendDuration;
      const dashOffset = -trendCycleLength * progress;
      const dashOffsetValue = `${dashOffset}px`;
      linePaths.forEach((path) => {
        path.style.strokeDashoffset = dashOffsetValue;
      });
      blueLine.style.opacity = phase === 0 ? "1" : "0";
      redLine.style.opacity = phase === 1 ? "1" : "0";
      svg.dataset.activeSegment = phase === 0 ? "blue" : "red";
      frameId = window.requestAnimationFrame(updateTrendLine);
    };

    const startAnimation = () => {
      window.cancelAnimationFrame(frameId);
      startTime = undefined;
      if (reducedMotion.matches) {
        linePaths.forEach((path) => {
          path.style.removeProperty("stroke-dashoffset");
        });
        blueLine.style.removeProperty("opacity");
        redLine.style.removeProperty("opacity");
        delete svg.dataset.activeSegment;
        return;
      }
      frameId = window.requestAnimationFrame(updateTrendLine);
    };

    startAnimation();
    reducedMotion.addEventListener("change", startAnimation);

    return () => {
      window.cancelAnimationFrame(frameId);
      reducedMotion.removeEventListener("change", startAnimation);
    };
  }, []);

  return (
    <div className="sv-market-background" aria-hidden="true">
      <div className="sv-market-grid" />
      <div className="sv-market-glow" />
      <div className="sv-market-bars">
        {barHeights.map((height, index) => (
          <span
            key={index}
            style={{
              "--bar-height": `${height}%`,
              "--bar-delay": `${(index % 9) * -0.37}s`,
              "--bar-duration": `${4 + (index % 5) * 0.6}s`,
            }}
          />
        ))}
      </div>
      <div className="sv-market-particles">
        {particles.map((particle, index) => (
          <span
            key={index}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              "--particle-delay": particle.delay,
              "--particle-duration": particle.duration,
            }}
          />
        ))}
      </div>
      <svg
        className="sv-market-line"
        data-active-segment="blue"
        viewBox="0 0 1480 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="sv-market-line-red-halo-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff174d" />
            <stop offset="52%" stopColor="#ff3b36" />
            <stop offset="100%" stopColor="#ff4f79" />
          </linearGradient>
          <linearGradient id="sv-market-line-red-trace-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#c9183d" />
            <stop offset="52%" stopColor="#ff294f" />
            <stop offset="100%" stopColor="#d51d43" />
          </linearGradient>
        </defs>
        <path
          className="sv-market-line-base"
          d={trendPath}
        />
        <g ref={blueLineRef} className="sv-market-line-segment sv-market-line-segment-blue">
          <path
            className="sv-market-line-halo"
            pathLength="100"
            d={trendPath}
          />
          <path
            className="sv-market-line-trace"
            pathLength="100"
            d={trendPath}
          />
        </g>
        <g ref={redLineRef} className="sv-market-line-segment sv-market-line-segment-red">
          <path
            className="sv-market-line-red-halo"
            pathLength="100"
            d={trendPath}
          />
          <path
            className="sv-market-line-red-trace"
            pathLength="100"
            d={trendPath}
          />
        </g>
      </svg>
      <div className="sv-market-markers">
        {markers.map(({ value, top, left }) => (
          <span key={`${value}-${left}`} style={{ top, left }}>
            {value}
          </span>
        ))}
      </div>
      <div className="sv-market-overlay" />
    </div>
  );
}

export default MarketBackground;
