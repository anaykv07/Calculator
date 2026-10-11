import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ThemeConfig } from '../types/calculator';
import { createFunctionEvaluator } from '../utils/mathEngine';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

interface GraphingCalculatorProps {
  theme: ThemeConfig;
}

interface PresetFunction {
  label: string;
  expression: string;
  rangeX: [number, number];
}

const PRESETS: PresetFunction[] = [
  { label: 'Sine Wave', expression: 'sin(x)', rangeX: [-6.5, 6.5] },
  { label: 'Cubic Polynomial', expression: 'x^3 - 3*x', rangeX: [-3, 3] },
  { label: 'Gaussian Bell', expression: 'exp(-x^2)', rangeX: [-4, 4] },
  { label: 'Damped Wave', expression: 'cos(3*x) * exp(-0.2*x)', rangeX: [-2, 8] },
  { label: 'Quadratic Parabola', expression: 'x^2 - 4', rangeX: [-5, 5] },
  { label: 'Hyperbola', expression: '1/x', rangeX: [-5, 5] },
];

export const GraphingCalculator: React.FC<GraphingCalculatorProps> = ({ theme }) => {
  const [expression, setExpression] = useState('sin(x)');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Viewport boundaries
  const [xMin, setXMin] = useState(-8);
  const [xMax, setXMax] = useState(8);
  const [yMin, setYMin] = useState(-5);
  const [yMax, setYMax] = useState(5);

  // Crosshair state
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; fVal: number | null } | null>(null);

  // Key stats
  const [yIntercept, setYIntercept] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0 });

  // Draw the graph
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversions
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toMathX = (px: number) => xMin + (px / width) * (xMax - xMin);

    // Calculate grid spacing adaptively
    const rangeX = xMax - xMin;
    const rawStepX = rangeX / 10;
    const magnitudeX = Math.pow(10, Math.floor(Math.log10(rawStepX)));
    const stepX = (rawStepX / magnitudeX > 5 ? 5 : rawStepX / magnitudeX > 2 ? 2 : 1) * magnitudeX;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';

    // Vertical grid
    const firstGridX = Math.floor(xMin / stepX) * stepX;
    for (let x = firstGridX; x <= xMax; x += stepX) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      // Label
      if (Math.abs(x) > 1e-6) {
        ctx.fillText(Number(x.toFixed(2)).toString(), sx + 3, toScreenY(0) + 12);
      }
    }

    // Horizontal grid
    const rangeY = yMax - yMin;
    const rawStepY = rangeY / 10;
    const magnitudeY = Math.pow(10, Math.floor(Math.log10(rawStepY)));
    const stepY = (rawStepY / magnitudeY > 5 ? 5 : rawStepY / magnitudeY > 2 ? 2 : 1) * magnitudeY;

    const firstGridY = Math.floor(yMin / stepY) * stepY;
    for (let y = firstGridY; y <= yMax; y += stepY) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      // Label
      if (Math.abs(y) > 1e-6) {
        ctx.fillText(Number(y.toFixed(2)).toString(), toScreenX(0) + 4, sy - 3);
      }
    }

    // Draw main axes (X and Y)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.5;

    // X Axis
    const axisY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    // Y Axis
    const axisX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
    ctx.stroke();

    // Plot Function f(x)
    const fn = createFunctionEvaluator(expression, 'RAD');

    // Test f(0)
    const intercept = fn(0);
    setYIntercept(intercept);

    ctx.strokeStyle = '#06b6d4'; // Laser cyan
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    const samples = width * 2; // High resolution sampling

    for (let i = 0; i <= samples; i++) {
      const px = (i / samples) * width;
      const x = toMathX(px);
      const y = fn(x);

      if (y === null || isNaN(y) || !isFinite(y)) {
        started = false;
        continue;
      }

      const py = toScreenY(y);

      // Avoid drawing wild vertical asymptote leaps
      if (py < -height || py > height * 2) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Draw hover crosshair if active
    if (hoverCoord) {
      const hx = toScreenX(hoverCoord.x);
      const hy = toScreenY(hoverCoord.y);

      // Crosshair lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // If function point is near, draw point on curve
      if (hoverCoord.fVal !== null && isFinite(hoverCoord.fVal)) {
        const curveY = toScreenY(hoverCoord.fVal);
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(hx, curveY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [xMin, xMax, yMin, yMax, expression, hoverCoord]);

  // Adjust canvas pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      renderCanvas();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Zoom controls
  const zoom = (factor: number) => {
    const centerX = (xMin + xMax) / 2;
    const centerY = (yMin + yMax) / 2;
    const halfWidth = ((xMax - xMin) / 2) * factor;
    const halfHeight = ((yMax - yMin) / 2) * factor;

    setXMin(centerX - halfWidth);
    setXMax(centerX + halfWidth);
    setYMin(centerY - halfHeight);
    setYMax(centerY + halfHeight);
  };

  const resetView = () => {
    setXMin(-8);
    setXMax(8);
    setYMin(-5);
    setYMax(5);
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mousePxX = e.clientX - rect.left;
    const mousePxY = e.clientY - rect.top;

    const mathX = xMin + (mousePxX / rect.width) * (xMax - xMin);
    const mathY = yMax - (mousePxY / rect.height) * (yMax - yMin);

    const fn = createFunctionEvaluator(expression, 'RAD');
    const fVal = fn(mathX);

    setHoverCoord({ x: mathX, y: mathY, fVal });

    if (isDraggingRef.current) {
      const dxPx = e.clientX - dragStartRef.current.x;
      const dyPx = e.clientY - dragStartRef.current.y;

      const scaleX = (dragStartRef.current.xMax - dragStartRef.current.xMin) / rect.width;
      const scaleY = (dragStartRef.current.yMax - dragStartRef.current.yMin) / rect.height;

      setXMin(dragStartRef.current.xMin - dxPx * scaleX);
      setXMax(dragStartRef.current.xMax - dxPx * scaleX);
      setYMin(dragStartRef.current.yMin + dyPx * scaleY);
      setYMax(dragStartRef.current.yMax + dyPx * scaleY);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoverCoord(null);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    zoom(factor);
  };

  const applyPreset = (preset: PresetFunction) => {
    setExpression(preset.expression);
    setXMin(preset.rangeX[0]);
    setXMax(preset.rangeX[1]);
    const spanY = (preset.rangeX[1] - preset.rangeX[0]) * 0.6;
    setYMin(-spanY / 2);
    setYMax(spanY / 2);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardClass}`}>
      {/* Top Function Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex-1 flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-white">
          <span className="font-mono text-cyan-400 font-semibold mr-2 shrink-0">
            f(x) =
          </span>
          <input
            type="text"
            value={expression}
            onChange={(e) => {
              setExpression(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="e.g. sin(x), x^2 - 4, cos(2*x)"
            className="w-full bg-transparent font-mono text-sm text-white focus:outline-none placeholder-slate-500"
          />
        </div>

        {/* Viewport Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          <button
            onClick={() => zoom(0.8)}
            title="Zoom In"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => zoom(1.25)}
            title="Zoom Out"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset View"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset pills (functional filter buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-2">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              expression === p.expression
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[380px] sm:h-[440px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Live HUD Coordinate Overlay */}
        {hoverCoord && (
          <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md pointer-events-none shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">x:</span>
              <span className="text-cyan-300 tabular-nums font-semibold">
                {hoverCoord.x.toFixed(3)}
              </span>
              <span className="text-slate-500 ml-1">y:</span>
              <span className="text-slate-200 tabular-nums">
                {hoverCoord.y.toFixed(3)}
              </span>
            </div>
            {hoverCoord.fVal !== null && (
              <div className="mt-0.5 text-cyan-400">
                f(x) = {hoverCoord.fVal.toFixed(4)}
              </div>
            )}
          </div>
        )}

        {/* Coordinates Range Badges */}
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800/60 pointer-events-none">
          X: [{xMin.toFixed(1)}, {xMax.toFixed(1)}] · Y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]
        </div>
      </div>

      {/* Function Analysis Bar */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Y-Intercept f(0)
          </div>
          <div className="text-sm font-bold text-cyan-300 tabular-nums">
            {yIntercept !== null ? yIntercept.toFixed(4) : 'Undefined'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Visible Domain
          </div>
          <div className="text-sm font-semibold text-slate-200 tabular-nums">
            Δx = {(xMax - xMin).toFixed(2)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Interaction Guide
          </div>
          <div className="text-[11px] text-slate-400">
            Drag to pan · Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
};
