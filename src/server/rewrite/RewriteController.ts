import * as app from '.';
import * as api from '@nestjs/common';
import * as swg from '@nestjs/swagger';
import express from 'express';

@api.Controller('api/rewrite')
@swg.ApiTags('rewrite')
@swg.ApiBadRequestResponse()
@swg.ApiInternalServerErrorResponse()
export class RewriteController {
  private readonly _agentService: app.AgentService;
  private readonly _hlsService: app.HlsService;

  constructor(agentService: app.AgentService, hlsService: app.HlsService) {
    this._agentService = agentService;
    this._hlsService = hlsService;
  }
  
  @api.Get(':url')
  async emulateAsync(
    @api.Headers() headers: Record<string, string>,
    @api.Query() query: Record<string, string>,
    @api.Param() params: app.api.RewriteParamEmulate,
    @api.Res() response: express.Response) {
    await this._agentService.forwardAsync(new URL(params.url), response, {headers: {...headers, ...query}});
  }

  @api.Get('hls/:url')
  async hlsAsync(
    @api.Headers() headers: Record<string, string>,
    @api.Query() query: Record<string, string>,
    @api.Param() params: app.api.RewriteParamHls,
    @api.Res() response: express.Response) {
    delete headers['range'];
    const result = await this._agentService.fetchAsync(new URL(params.url), {headers: {...headers, ...query}});
    if (result.status === 200) {
      const manifest = await result.text();
      const streamUrl = this._hlsService.getBestStreamUrl(manifest);
      if (streamUrl) await this.hlsAsync(headers, query, {url: streamUrl}, response);
      else response.send(this._hlsService.rewrite(manifest, query));
    } else {
      response.sendStatus(500);
    }
  }
}
