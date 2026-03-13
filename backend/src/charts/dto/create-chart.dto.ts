import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
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

class ChartConfigDto {
  @IsUUID()
  database_id: string;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  x_field: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  y_field: string;

  @IsIn(['sum', 'count', 'avg', 'none'])
  aggregation: 'sum' | 'count' | 'avg' | 'none';

  @IsArray()
  @IsOptional()
  filters?: unknown[];

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
