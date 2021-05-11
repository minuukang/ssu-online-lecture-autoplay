import { BrowserContext } from 'playwright';
import playwrightCheerio from '../helpers/playwrightCheerio';

export default async function getCourses (context: BrowserContext) {
  return playwrightCheerio(context, 'http://myclass.ssu.ac.kr/local/ubion/user/', $ => {
    return $('.coursefullname').toArray().map(element => {
      const $element = $(element);
      return {
        id: $element.attr('href').match(/id=(.*?)$/)?.[1],
        title: $element.text().replace(/\(.*?\)/g, '').trim()
      };
    });
  });
}