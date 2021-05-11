import { BrowserContext } from 'playwright';
import playwrightCheerio from '../helpers/playwrightCheerio';

type Props = {
  courseId: string;
};

export default async function getCourseUncompleteLectures (context: BrowserContext, props: Props) {
  const { courseId } = props;
  return playwrightCheerio(context, `http://myclass.ssu.ac.kr/report/ubcompletion/user_progress_a.php?id=${courseId}`, $ => {
    return $('.user_progress_table tbody tr').toArray().map(element => {
      const $element = $(element);
      const $title = $element.find('.text-left');
      // if ($title.next().next().next().text() === 'X') {
        return {
          title: $title.text().trim()
        };
      // }
      // return null;
    }).filter((v): v is NonNullable<typeof v> => Boolean(v));
  });
}