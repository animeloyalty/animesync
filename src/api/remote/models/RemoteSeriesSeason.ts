import * as api from '../..';
import * as clv from 'class-validator';
import * as nsg from '@nestjs/swagger';

export class RemoteSeriesSeason {
  constructor(source?: RemoteSeriesSeason, sourcePatch?: Partial<RemoteSeriesSeason>) {
    this.episodes = api.property('episodes', source, sourcePatch, []);
    this.title = api.property('title', source, sourcePatch, '');
  }

  @clv.IsArray()
  @clv.ArrayNotEmpty()
  @clv.ValidateNested()
  @nsg.ApiProperty({type: [api.RemoteSeriesSeasonEpisode]})
  readonly episodes: Array<api.RemoteSeriesSeasonEpisode>;

  @clv.IsString()
  @clv.IsNotEmpty()
  @nsg.ApiProperty()
  readonly title: string;
}
