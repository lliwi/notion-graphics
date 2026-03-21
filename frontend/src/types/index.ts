export type ChartType = 'bar' | 'line' | 'area' | 'bar_horizontal' | 'pie' | 'donut' | 'radar' | 'table' | 'kpi';
export type Aggregation = 'sum' | 'count' | 'avg' | 'none';

export interface ChartConfig {
  database_id: string;
  title: string;
  x_field: string;
  y_field: string;
  aggregation: Aggregation;
  filters: unknown[];
  colors: string[];
  legend_position?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  background?: string;
  font_family?: 'system-ui' | 'serif' | 'monospace';
  show_grid?: boolean;
  border_radius?: number;
  font_size?: number;
  chart_height?: number;
  bar_width?: number;
  radar_label_field?: string;
  radar_axes?: string[];
}

export interface Chart {
  id: string;
  user_id: string;
  name: string;
  type: ChartType;
  config_json: ChartConfig;
  embed_token: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChartDataResult {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  last_edited_time: string;
}

export interface AuthResponse {
  access_token: string;
}
