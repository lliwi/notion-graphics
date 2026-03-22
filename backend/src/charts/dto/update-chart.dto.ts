import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
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

class UpdateChartConfigDto {
  @IsOptional()
  @IsUUID()
  database_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  x_field?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  y_field?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  y_fields?: string[];

  @IsOptional()
  @IsIn(['sum', 'count', 'avg', 'min', 'max', 'median', 'count_unique', 'percent', 'range', 'none'])
  aggregation?: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none';

  @IsOptional()
  @IsArray()
  @IsIn(['sum', 'count', 'avg', 'min', 'max', 'median', 'count_unique', 'percent', 'range', 'none'], { each: true })
  aggregations?: Array<'sum' | 'count' | 'avg' | 'min' | 'max' | 'median' | 'count_unique' | 'percent' | 'range' | 'none'>;

  @IsOptional()
  @IsArray()
  filters?: unknown[];

  @IsOptional()
  @IsArray()
  colors?: string[];

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

export class UpdateChartDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(ChartType)
  type?: ChartType;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateChartConfigDto)
  config_json?: UpdateChartConfigDto;
}
