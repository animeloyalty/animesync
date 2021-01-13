import * as clv from 'class-validator';
import * as swg from '@nestjs/swagger';

export class RewriteParamHls {
  @clv.IsString()
  @clv.IsUrl()
  @swg.ApiProperty()
  readonly url!: string;
}