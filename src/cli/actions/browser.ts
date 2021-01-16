import * as ace from '../..';

export async function browserAsync() {
  console.log(`Starting ${ace.settings.serverUrl}`);
  await ace.Server.usingAsync(async (api) => {
    ace.settings.chromeHeadless = false;
    ace.settings.chromeInactiveTimeout = 1000;
    console.log('Spawning browser ...');
    await api.get(ace.shr.BrowserService).pageAsync(async (page) => {
      const context = page.context();
      const pages = context.pages();
      if (pages.length > 0) pages[0].goto('https://www.crunchyroll.com/').catch(() => undefined);
      if (pages.length > 1) pages[1].goto('https://www.funimation.com/').catch(() => undefined);
      await new Promise<void>((resolve) => context.on('close', resolve));
    });
  });
}
