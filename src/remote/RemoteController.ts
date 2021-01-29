import * as app from '.';
import * as ncm from '@nestjs/common';
import * as nsg from '@nestjs/swagger';

@ncm.Controller('api/remote')
@ncm.UseInterceptors(app.ResponseLoggerInterceptor)
@nsg.ApiTags('remote')
@nsg.ApiBadRequestResponse()
@nsg.ApiInternalServerErrorResponse()
export class RemoteController {
  private readonly _cacheService: app.CacheService;
  private readonly _providerService: app.ProviderService;

  constructor(cacheService: app.CacheService, providerService: app.ProviderService) {
    this._cacheService = cacheService;
    this._providerService = providerService;
  }

  @app.ResponseValidator(app.api.RemoteSearch)
  @ncm.Get('popular')
  @nsg.ApiResponse({status: 200, type: app.api.RemoteSearch})
  async popularAsync(@ncm.Query() model: app.api.RemoteQueryPopular) {
    const cacheKey = `popular/${model.providerName}/${model.pageNumber || 1}`;
    const cacheTimeout = app.settings.cacheRemoteSearchTimeout;
    return await this._cacheService.getAsync(cacheKey, cacheTimeout, () => this._providerService.popularAsync(model.providerName, model.pageNumber));
  }

  @app.ResponseValidator(app.api.RemoteSeries)
  @ncm.Get('series')
  @nsg.ApiResponse({status: 200, type: app.api.RemoteSeries})
  async seriesAsync(@ncm.Query() model: app.api.RemoteQuerySeries) {
    const cacheKey = `series/${model.url}`;
    const cacheTimeout = app.settings.cacheRemoteSeriesTimeout;
    return await this._cacheService.getAsync(cacheKey, cacheTimeout, () => this._providerService.seriesAsync(model.url));
  }

  @app.ResponseValidator(app.api.RemoteStream)
  @ncm.Get('stream')
  @nsg.ApiResponse({status: 200, type: app.api.RemoteStream})
  async streamAsync(@ncm.Query() model: app.api.RemoteQueryStream) {
    const cacheKey = `stream/${model.url}`;
    const cacheTimeout = app.settings.cacheRemoteStreamTimeout;
    return await this._cacheService.getAsync(cacheKey, cacheTimeout, () => this._providerService.streamAsync(model.url));
  }
}
