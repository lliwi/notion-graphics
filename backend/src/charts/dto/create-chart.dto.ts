import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChartType } from '../entities/chart.entity';

export class HavingConditionDto {
  @IsIn(['greater_than', 'less_than', 'greater_than_or_equal_to', 'less_than_or_equal_to', 'equals', 'does_not_equal'])
  operator: string;

  @IsNumber()
  value: number;
}

export class NotionFilterDto {
  @IsString()
  @MaxLength(100)
  property: string;

  @IsIn(['text', 'number', 'select', 'multi_select', 'date', 'checkbox', 'rich_text', 'title', 'formula'])
  property_type: string;

  @IsIn([
    'equals', 'does_not_equal', 'contains', 'does_not_contain',
    'starts_with', 'ends_with',
    'greater_than', 'less_than', 'greater_than_or_equal_to', 'less_than_or_equal_to',
    'is_empty', 'is_not_empty',
    'before', 'after', 'on_or_before', 'on_or_after',
    'past_week', 'past_month', 'past_year', 'next_week', 'next_month', 'next_year',
  ])
  operator: string;

  @IsOptional()
  value?: string | number | boolean;
}

export class NotionSortDto {
  @IsString()
  @MaxLength(100)
  property: string;

  @IsIn(['ascending', 'descending'])
  direction: 'ascending' | 'descending';
}

class ChartConfigDto {
  @IsUUID()
  database_id: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  x_field?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  y_field?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  y_fields?: string[];

  @IsIn(['sum', 'count', 'avg', 'min', 'max', 'median', 'count_unique', 'percent', 'range', 'none'])
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none';

  @IsOptional()
  @IsArray()
  @IsIn(['sum', 'count', 'avg', 'min', 'max', 'median', 'count_unique', 'percent', 'range', 'none'], { each: true })
  aggregations?: Array<'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none'>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotionFilterDto)
  filters?: NotionFilterDto[];

  @IsOptional()
  @IsIn(['and', 'or'])
  filter_logic?: 'and' | 'or';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotionSortDto)
  sorts?: NotionSortDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => HavingConditionDto)
  having?: HavingConditionDto;

  @IsArray()
  @IsOptional()
  colors?: string[];

  // Personalización visual
  @IsOptional()
  @IsIn(['top', 'bottom', 'left', 'right', 'none'])
  legend_position?: 'top' | 'bottom' | 'left' | 'right' | 'none';

  @IsOptional()
  @IsString()
  @MaxLength(30)
  background?: string;

  @IsOptional()
  @IsIn(['system-ui', 'serif', 'monospace'])
  font_family?: 'system-ui' | 'serif' | 'monospace';

  @IsOptional()
  @IsBoolean()
  show_grid?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  border_radius?: number;

  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(24)
  font_size?: number;

  @IsOptional()
  @IsInt()
  @Min(150)
  @Max(800)
  chart_height?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  bar_width?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  radar_label_field?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  radar_axes?: string[];
}

export class CreateChartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(ChartType)
  type: ChartType;

  @ValidateNested()
  @Type(() => ChartConfigDto)
  config_json: ChartConfigDto;
}
