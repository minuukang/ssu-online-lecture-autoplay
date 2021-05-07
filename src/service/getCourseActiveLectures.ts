import { BrowserContext } from 'playwright';
import playwrightCheerio from '../helpers/playwrightCheerio';

type Props = {
  courseId: string;
};

export default async function getCourseActiveLectures (context: BrowserContext, props: Props) {
  const { courseId } = props;
  return playwrightCheerio(context, `http://myclass.ssu.ac.kr/course/view.php?id=${courseId}`, $ => {
    return $('.course_box_current .modtype_xncommons').toArray().map(element => {
      const $element = $(element);
      const period = $element.find('.text-ubstrap').text().trim().split(' ~ ');
      const length = $element.find('.text-info').text().trim().replace(/^,\s*/, '');
      return {
        id: $element.find('a').attr('onclick').match(/\?i=(.*?)\'/)?.[1],
        title: $element.find('.instancename').text().trim().replace(/\s*Commons$/, ''),
        startDate: new Date(period[0]),
        endDate: new Date(period[1]),
        length
      };
    });
  });
}