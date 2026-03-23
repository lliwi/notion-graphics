export type ChartType = 'bar' | 'bar_stacked' | 'line' | 'area' | 'bar_horizontal' | 'bar_horizontal_stacked' | 'pie' | 'donut' | 'radar' | 'table' | 'kpi';
export type Aggregation = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none';

export type NotionFilterOperator =
  | 'equals' | 'does_not_equal'
  | 'contains' | 'does_not_contain'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than' | 'greater_than_or_equal_to' | 'less_than_or_equal_to'
  | 'is_empty' | 'is_not_empty'
  | 'before' | 'after' | 'on_or_before' | 'on_or_after'
  | 'past_week' | 'past_month' | 'past_year' | 'next_week' | 'next_month' | 'next_year';

export type NotionFilterPropertyType = 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'rich_text' | 'title' | 'formula';

export interface NotionFilter {
  property: string;
  property_type: NotionFilterPropertyType;
  operator: NotionFilterOperator;
  value?: string | number | boolean;
}

export interface NotionSort {
  property: string;
  direction: 'ascending' | 'descending';
}

export type HavingOperator = 'greater_than' | 'less_than' | 'greater_than_or_equal_to' | 'less_than_or_equal_to' | 'equals' | 'does_not_equal';

export interface HavingCondition {
  operator: HavingOperator;
  value: number;
}

export interface ChartConfig {
  database_id: string;
  title: string;
  x_field: string;
  y_field: string;
  y_fields?: string[];
  aggregation: Aggregation;
  aggregations?: Aggregation[];
  filters?: NotionFilter[];
  filter_logic?: 'and' | 'or';
  sorts?: NotionSort[];
  having?: HavingCondition;
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
