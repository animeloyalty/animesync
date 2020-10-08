import * as app from '../..';
import * as subtitle from 'subtitle';
import fs from 'fs-extra';
import path from 'path';
import sanitizeFilename from 'sanitize-filename';
import scraper from './scraper';

export async function funimationAsync(rootPath: string, seriesUrl: string) {
  await app.browserAsync(async (page) => {
    const [metadataPromise] = new app.Watcher(page).getAsync(/\/api\/episodes\//i);
    await page.goto(seriesUrl, {waitUntil: 'domcontentloaded'});
    const metadata = await metadataPromise.then(x => x.json()) as SeasonMetadata;
    const seasons = [metadata];
    while (!page.isClosed()) {
      const [seasonPromise] = new app.Watcher(page).getAsync(/\/api\/episodes\//i);
      if (!await page.evaluate(scraper.nextSeason)) {
        seasonPromise.catch(() => undefined);
        await page.close();
        await seasons.reduce((p, x) => p.then(() => seasonAsync(rootPath, x)), Promise.resolve());
      } else {
        seasons.push(await seasonPromise.then(x => x.json()) as SeasonMetadata);
      }
    }
  });
}

async function seasonAsync(rootPath: string, metadata: SeasonMetadata) {
  for (const episode of metadata.items.filter(x => x.audio.includes('Japanese'))) {
    const episodeNumber = parseFloat(episode.item.episodeNum);
    const seasonNumber = parseFloat(episode.item.seasonNum);
    if (episodeNumber >= 0 && seasonNumber >= 0) {
      const elapsedTime = new app.Timer();
      const seriesName = sanitizeFilename(episode.item.titleName);
      const seriesPath = path.join(rootPath, seriesName);
      const seriesReport = await app.Series.loadAsync(seriesPath);
      const episodeName = `${seriesName} ${String(seasonNumber).padStart(2, '0')}x${String(episodeNumber).padStart(2, '0')} [Funimation].mkv`;
      const episodePath = path.join(seriesPath, episodeName);
      const episodeUrl = `https://www.funimation.com/shows/${episode.item.titleSlug}/${episode.item.episodeSlug}/?qid=&lang=japanese`;
      if (seriesReport.includes(episodeUrl)) {
        console.log(`Skipping ${episodeName}`);
      } else if (await fs.pathExists(episodePath)) {
        console.log(`Skipping ${episodeName}`);
        await seriesReport.trackAsync(episodeName, episodeUrl);
      } else try {
        console.log(`Fetching ${episodeName}`);
        await episodeAsync(episodePath, episodeUrl);
        await seriesReport.trackAsync(episodeName, episodeUrl);
        console.log(`Finished ${episodeName} (${elapsedTime})`);
      } catch (err) {
        console.log(`Rejected ${episodeName} (${elapsedTime})`);
        console.log(err);
      }
    }
  }
}

async function episodeAsync(episodePath: string, episodeUrl: string) {
  return await app.browserAsync(async (page) => {
    const [metadataPromise, vttSubtitlePromise] = new app.Watcher(page).getAsync(/\/api\/showexperience\//i, /\.vtt$/i);
    await page.goto(episodeUrl, {waitUntil: 'domcontentloaded'});
    const metadata = await metadataPromise.then(x => x.json()) as EpisodeMetadata;
    const vttSubtitle = await vttSubtitlePromise.then(x => x.text());
    await page.close();
    const stream = metadata.items.find(x => x.videoType === 'm3u8');
    const worker = new app.Worker(app.settings.sync);
    if (metadata && stream) try {
      await worker.writeAsync('en-US.srt', subtitle.stringifySync(subtitle.parseSync(vttSubtitle), {format: 'SRT'}));
      await worker.streamAsync(stream.src);
      await worker.mergeAsync(episodePath);
    } finally {
      await worker.disposeAsync();
    } else {
      throw new Error(`Invalid episode: ${episodeUrl}`);
    }
  });
}

type SeasonMetadata = {
  items: Array<{audio: Array<string>, item: {episodeNum: string, episodeSlug: string, seasonNum: string, titleName: string, titleSlug: string}}>;
};

type EpisodeMetadata = {
  items: Array<{src: string, videoType: string}>;
};