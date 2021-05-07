import { BrowserContext } from 'playwright';
import * as cheerio from 'cheerio';

export default async function playwrightCheerio<R>(context: BrowserContext, url: string, callback: ($: cheerio.Root) => R): Promise<R> {
  const newPage = await context.newPage();
  await newPage.goto(url);
  const result: R = await callback(cheerio.load(await newPage.content()));
  await newPage.close();
  return result;
}