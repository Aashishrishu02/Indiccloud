import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsIn(['VPS_HOSTING', 'LINUX_IP_VPS'])
  productType!: 'VPS_HOSTING' | 'LINUX_IP_VPS';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(1)
  cpuCores!: number;

  @IsInt()
  @Min(1)
  ramGb!: number;

  @IsInt()
  @Min(1)
  storageGb!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bandwidthGb?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price!: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsInt()
  @Min(1)
  durationDays!: number;

  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  supportedOS!: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
