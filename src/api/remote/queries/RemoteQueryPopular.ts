import * as clt from 'class-transformer';
import * as clv from 'class-validator';
import * as swg from '@nestjs/swagger';

export class RemoteQueryPopular {
  @clv.IsString()
  @clv.IsIn(['crunchyroll', 'funimation'])
  @swg.ApiProperty({enum: ['crunchyroll', 'funimation']})
  readonly providerName!: 'crunchyroll' | 'funimation';
  
  @clv.IsOptional()
  @clv.IsNumber()
  @clv.Min(1)
  @clt.Type(() => Number)
  @swg.ApiPropertyOptional()
  readonly pageNumber?: number;
}