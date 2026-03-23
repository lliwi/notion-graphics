import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ChartType {
  BAR = 'bar',
  BAR_STACKED = 'bar_stacked',
  LINE = 'line',
  AREA = 'area',
  BAR_HORIZONTAL = 'bar_horizontal',
  BAR_HORIZONTAL_STACKED = 'bar_horizontal_stacked',
  PIE = 'pie',
  DONUT = 'donut',
  RADAR = 'radar',
  TABLE = 'table',
  KPI = 'kpi',
}

export type NotionFilterOperator =
  | 'equals'
  | 'does_not_equal'
  | 'contains'
  | 'does_not_contain'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal_to'
  | 'less_than_or_equal_to'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'
  | 'past_week'
  | 'past_month'
  | 'past_year'
  | 'next_week'
  | 'next_month'
  | 'next_year';

export interface NotionFilter {
  property: string;
  property_type: 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'checkbox' | 'rich_text' | 'title' | 'formula';
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
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none';
  aggregations?: Array<'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none'>;
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

@Entity('charts')
export class Chart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  type: ChartType;

  @Column({ type: 'jsonb' })
  config_json: ChartConfig;

  @Column({ type: 'uuid', unique: true, nullable: true })
  embed_token: string | null;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
