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
  @IsIn(['sum', 'count', 'avg', 'none'])
  aggregation?: 'sum' | 'count' | 'avg' | 'none';

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
