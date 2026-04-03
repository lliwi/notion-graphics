import type { ChartConfig, ChartType } from '../charts/entities/chart.entity';
import type { ChartDataResult } from '../notion-data/notion-data.service';

interface EmbedOptions {
  chartType: ChartType;
  config: ChartConfig;
  chartData: ChartDataResult;
  oembedUrl?: string;
  title?: string;
}

const isTransparent = (bg: string) => bg === 'transparent' || bg === 'rgba(0,0,0,0)';

/**
 * When background is transparent, we generate adaptive CSS that responds
 * to the host page's color scheme (e.g. Notion light vs dark mode).
 */
function adaptiveColors(bg: string) {
  const transparent = isTransparent(bg);
  return {
    transparent,
    // Dark-mode defaults (used when bg is opaque dark, or transparent + dark host)
    title: transparent ? 'var(--fg-title)' : '#e5e7eb',
    legend: transparent ? 'var(--fg-legend)' : '#d1d5db',
    tick: transparent ? 'var(--fg-tick)' : '#8a8f9a',
    grid: transparent ? 'var(--fg-grid)' : '#2a3040',
    tableTh: transparent ? 'var(--fg-tick)' : '#8a8f9a',
    tableTd: transparent ? 'var(--fg-legend)' : '#d1d5db',
    tableThBg: transparent ? 'var(--bg-th)' : '#252830',
    tableBorder: transparent ? 'var(--fg-grid)' : '#2a3040',
    tableHoverBg: transparent ? 'var(--bg-hover)' : '#252830',
  };
}

function adaptiveCssVars(bg: string): string {
  if (!isTransparent(bg)) return '';
  return `
    /* Default: dark mode colors */
    :root {
      --fg-title: #e5e7eb;
      --fg-legend: #d1d5db;
      --fg-tick: #8a8f9a;
      --fg-grid: #2a3040;
      --bg-th: #252830;
      --bg-hover: #252830;
    }
    /* Light mode override when host uses light scheme */
    @media (prefers-color-scheme: light) {
      :root {
        --fg-title: #1a1a1a;
        --fg-legend: #374151;
        --fg-tick: #6b7280;
        --fg-grid: #e5e7eb;
        --bg-th: #f3f4f6;
        --bg-hover: #f9fafb;
      }
    }`;
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
  const isRadar = chartType === 'radar' || chartType === 'radar_area';
  const isArea = chartType === 'area' || chartType === 'radar_area';
  const isHBar = chartType === 'bar_horizontal' || chartType === 'bar_horizontal_stacked';
  const isStacked = chartType === 'bar_stacked' || chartType === 'bar_horizontal_stacked';
  const isBar = chartType === 'bar' || chartType === 'bar_stacked' || isHBar;
  const isMultiDataset = chartData.datasets.length > 1;

  let chartJsType: string = chartType;
  if (chartType === 'donut') chartJsType = 'doughnut';
  if (chartType === 'area') chartJsType = 'line';
  if (isHBar || chartType === 'bar_stacked') chartJsType = 'bar';
  if (chartType === 'radar_area') chartJsType = 'radar';

  const datasetsJson = JSON.stringify(
    chartData.datasets.map((ds, i) => {
      const dsColor = colors[i % colors.length];
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: isPolar || isRadar
          ? colors
          : isMultiDataset
            ? dsColor + '99'
            : colors.map((c) => c + '33'),
        borderColor: isPolar ? '#fff' : isMultiDataset ? dsColor : colors[i % colors.length],
        borderWidth: 2,
        borderRadius: isPolar || isRadar ? undefined : borderRadius,
        fill: isArea,
        tension: 0.4,
        pointBackgroundColor: isRadar ? dsColor : undefined,
      };
    }),
  );

  const indexAxisOption = isHBar ? `indexAxis: 'y',` : '';

  const ac = adaptiveColors(bg);
  const gridColor = showGrid ? ac.grid : 'transparent';
  const tickColor = ac.tick;
  const legendColor = ac.legend;
  const titleColor = ac.title;

  // For adaptive mode, grid/tick/legend are CSS var references — wrap in getComputedStyle
  const useAdaptive = ac.transparent;

  const stackedOpt = isStacked ? ', stacked: true' : '';

  const scalesConfigFull = isRadar
    ? `scales: {
        r: {
          ticks: { color: tickColor, backdropColor: 'transparent', font: { size: 10 } },
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: { color: legendColor, font: { size: 11 } },
        },
      },`
    : isPolar
    ? ''
    : isHBar
    ? `scales: {
        x: { grid: { color: gridColor }, beginAtZero: true, ticks: { color: tickColor, font: { size: 11 } }${stackedOpt} },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }${stackedOpt} },
      },`
    : `scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }${stackedOpt} },
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, beginAtZero: true${stackedOpt} },
      },`;

  const legendDisplay = isPolar || isRadar || legendPos !== 'none';
  const legendPosition = legendPos === 'none' ? 'bottom' : legendPos;

  const colorScheme = isTransparent(bg) ? 'light dark' : 'dark';

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
    ${adaptiveCssVars(bg)}
    html, body {
      width: 100%; height: 100%;
      color-scheme: ${colorScheme};
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
      color: ${titleColor};
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
  ${useAdaptive ? `
  // Read CSS custom properties for adaptive colors
  function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  var tickColor = getCssVar('--fg-tick');
  var legendColor = getCssVar('--fg-legend');
  var gridColor = ${showGrid} ? getCssVar('--fg-grid') : 'transparent';
  ` : `
  var tickColor = '${tickColor}';
  var legendColor = '${legendColor}';
  var gridColor = '${gridColor}';
  `}

  var ctx = document.getElementById('chart');
  var chartInstance = new Chart(ctx, {
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
          labels: { color: legendColor, font: { size: 11 }, padding: 12 },
        },
        tooltip: { enabled: true },
      },
      ${scalesConfigFull}
    },
  });

  // Fallback resize listener for iframes that don't propagate ResizeObserver
  window.addEventListener('resize', function() {
    if (chartInstance) chartInstance.resize();
  });

  ${useAdaptive ? `
  // Re-read adaptive colors when color scheme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    tickColor = getCssVar('--fg-tick');
    legendColor = getCssVar('--fg-legend');
    gridColor = ${showGrid} ? getCssVar('--fg-grid') : 'transparent';
    chartInstance.options.plugins.legend.labels.color = legendColor;
    ${!isPolar ? `
    Object.values(chartInstance.options.scales || {}).forEach(function(s) {
      if (s.ticks) s.ticks.color = tickColor;
      if (s.grid) s.grid.color = gridColor;
      if (s.pointLabels) s.pointLabels.color = legendColor;
      if (s.angleLines) s.angleLines.color = gridColor;
    });` : ''}
    chartInstance.update('none');
  });
  ` : ''}
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

  const ac = adaptiveColors(bg);
  const colorScheme = isTransparent(bg) ? 'light dark' : 'dark';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ${adaptiveCssVars(bg)}
    html, body {
      width: 100%; height: 100%;
      color-scheme: ${colorScheme};
      background: ${bg};
      overflow: auto;
      font-family: ${fontFamily}, -apple-system, sans-serif;
      font-size: 13px;
    }
    .wrapper { padding: 14px; }
    h2 { font-size: 13px; font-weight: 600; color: ${ac.title}; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid ${ac.tableBorder}; }
    th { background: ${ac.tableThBg}; font-weight: 600; color: ${ac.tableTh}; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    td { color: ${ac.tableTd}; }
    tbody tr:hover td { background: ${ac.tableHoverBg}; }
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

  const ac = adaptiveColors(bg);
  const colorScheme = isTransparent(bg) ? 'light dark' : 'dark';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ${adaptiveCssVars(bg)}
    html, body {
      width: 100%; height: 100%;
      color-scheme: ${colorScheme};
      background: ${bg};
      overflow: hidden;
      font-family: ${fontFamily}, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card { text-align: center; padding: 16px; }
    .label { font-size: 11px; font-weight: 600; color: ${ac.tick}; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; }
    .value { font-size: clamp(32px, 8vw, 64px); font-weight: 700; color: ${ac.title}; line-height: 1; }
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
