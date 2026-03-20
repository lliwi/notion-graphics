import type { ChartConfig, ChartType } from '../charts/entities/chart.entity';
import type { ChartDataResult } from '../notion-data/notion-data.service';

interface EmbedOptions {
  chartType: ChartType;
  config: ChartConfig;
  chartData: ChartDataResult;
  oembedUrl?: string;
  title?: string;
}

export function generateEmbedHtml(opts: EmbedOptions): string {
  const { chartType, config, chartData, oembedUrl, title: chartTitle } = opts;
  const title = config.title || chartTitle || 'Chart';
  const colors =
    config.colors?.length > 0
      ? config.colors
      : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const bg = config.background ?? '#1e2028';
  const fontFamily = config.font_family ?? 'system-ui';
  const legendPos = config.legend_position ?? 'bottom';
  const showGrid = config.show_grid !== false; // default true
  const borderRadius = config.border_radius ?? 4;

  if (chartType === 'table') return tableHtml(title, chartData, bg, fontFamily);
  if (chartType === 'kpi') return kpiHtml(title, chartData, bg, fontFamily);

  const isPolar = chartType === 'pie' || chartType === 'donut';
  const isRadar = chartType === 'radar';
  const isArea = chartType === 'area';
  const isHBar = chartType === 'bar_horizontal';

  let chartJsType: string = chartType;
  if (chartType === 'donut') chartJsType = 'doughnut';
  if (chartType === 'area') chartJsType = 'line';
  if (chartType === 'bar_horizontal') chartJsType = 'bar';

  const backgroundColors = isPolar || isRadar
    ? colors
    : colors.map((c) => c + '33');

  const datasetsJson = JSON.stringify(
    chartData.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: backgroundColors,
      borderColor: isPolar ? '#fff' : colors[i % colors.length],
      borderWidth: 2,
      borderRadius: isPolar || isRadar ? undefined : borderRadius,
      fill: isArea,
      tension: 0.4,
      pointBackgroundColor: isRadar ? colors[i % colors.length] : undefined,
    })),
  );

  const indexAxisOption = isHBar ? `indexAxis: 'y',` : '';

  const gridColor = showGrid ? '#2a3040' : 'transparent';
  const tickColor = '#8a8f9a';
  const legendColor = '#d1d5db';

  const scalesConfigFull = isRadar
    ? `scales: {
        r: {
          ticks: { color: '${tickColor}', backdropColor: 'transparent', font: { size: 10 } },
          grid: { color: '${gridColor}' },
          angleLines: { color: '${gridColor}' },
          pointLabels: { color: '${legendColor}', font: { size: 11 } },
        },
      },`
    : isPolar
    ? ''
    : isHBar
    ? `scales: {
        x: { grid: { color: '${gridColor}' }, beginAtZero: true, ticks: { color: '${tickColor}', font: { size: 11 } } },
        y: { grid: { color: '${gridColor}' }, ticks: { color: '${tickColor}', font: { size: 11 } } },
      },`
    : `scales: {
        x: { grid: { color: '${gridColor}' }, ticks: { color: '${tickColor}', font: { size: 11 } } },
        y: { grid: { color: '${gridColor}' }, ticks: { color: '${tickColor}', font: { size: 11 } }, beginAtZero: true },
      },`;

  const legendDisplay = isPolar || isRadar || legendPos !== 'none';
  const legendPosition = legendPos === 'none' ? 'bottom' : legendPos;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  ${oembedUrl ? `<link rel="alternate" type="application/json+oembed" href="${oembedUrl}" title="${esc(title)}">` : ''}
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      color-scheme: dark;
      background: ${bg};
    }
    body {
      width: 100%; height: 100%;
      background: ${bg};
      overflow: hidden;
      font-family: ${fontFamily}, -apple-system, sans-serif;
    }
    .wrapper {
      display: flex;
      flex-direction: column;
      width: 100%; height: 100%;
      padding: 14px;
    }
    h2 {
      font-size: 13px;
      font-weight: 600;
      color: #e5e7eb;
      margin-bottom: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }
    .chart-box { flex: 1; min-height: 0; position: relative; }
  </style>
</head>
<body>
<div class="wrapper">
  <h2>${esc(title)}</h2>
  <div class="chart-box">
    <canvas id="chart"></canvas>
  </div>
</div>
<script>
  const ctx = document.getElementById('chart');
  // Make canvas background transparent
  Chart.register({
    id: 'transparentBg',
    beforeDraw(chart) {
      const ctx2 = chart.canvas.getContext('2d');
      ctx2.save();
      ctx2.globalCompositeOperation = 'destination-over';
      ctx2.fillStyle = 'transparent';
      ctx2.fillRect(0, 0, chart.canvas.width, chart.canvas.height);
      ctx2.restore();
    }
  });
  new Chart(ctx, {
    type: ${JSON.stringify(chartJsType)},
    data: {
      labels:   ${JSON.stringify(chartData.labels)},
      datasets: ${datasetsJson},
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ${indexAxisOption}
      plugins: {
        legend: {
          display: ${legendDisplay},
          position: '${legendPosition}',
          labels: { color: '${legendColor}', font: { size: 11 }, padding: 12 },
        },
        tooltip: { enabled: true },
      },
      ${scalesConfigFull}
    },
  });
</script>
</body>
</html>`;
}

function tableHtml(title: string, data: ChartDataResult, bg: string, fontFamily: string): string {
  const rows = data.labels
    .map(
      (label, i) =>
        `<tr><td>${esc(label)}</td><td>${esc(String(data.datasets[0]?.data[i] ?? ''))}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { color-scheme: dark; }
    html, body {
      width: 100%; height: 100%;
      background: ${bg};
      overflow: auto;
      font-family: ${fontFamily}, -apple-system, sans-serif;
      font-size: 13px;
    }
    .wrapper { padding: 14px; }
    h2 { font-size: 13px; font-weight: 600; color: #e5e7eb; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #2a3040; }
    th { background: #252830; font-weight: 600; color: #8a8f9a; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    td { color: #d1d5db; }
    tbody tr:hover td { background: #252830; }
  </style>
</head>
<body>
<div class="wrapper">
  <h2>${esc(title)}</h2>
  <table>
    <thead><tr><th>Label</th><th>Value</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
</body>
</html>`;
}

function kpiHtml(title: string, data: ChartDataResult, bg: string, fontFamily: string): string {
  const total = (data.datasets[0]?.data ?? []).reduce(
    (sum, v) => sum + Number(v),
    0,
  );
  const formatted = Number.isInteger(total)
    ? total.toLocaleString()
    : total.toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { color-scheme: dark; }
    html, body {
      width: 100%; height: 100%;
      background: ${bg};
      overflow: hidden;
      font-family: ${fontFamily}, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card { text-align: center; padding: 16px; }
    .label { font-size: 11px; font-weight: 600; color: #8a8f9a; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; }
    .value { font-size: clamp(32px, 8vw, 64px); font-weight: 700; color: #e5e7eb; line-height: 1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="label">${esc(title)}</div>
    <div class="value">${esc(formatted)}</div>
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
