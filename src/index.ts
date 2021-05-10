import * as playwright from 'playwright';
import * as dotenv from 'dotenv';
import * as prompt from 'prompt';
import * as alert from 'alert';

// services
import authentication from './service/authentication';
import getCourseActiveLectures from './service/getCourseActiveLectures';
import getCourseUncompleteLectures from './service/getCourseUncompleteLectures';
import getCourses from './service/getCourses';
import viewVideo from './service/viewVideo';

dotenv.config();
prompt.start();

async function main () {
  const browser = await playwright.firefox.launch({
    headless: !process.env.DO_AT_BACKGROUND
  });
  const context = await browser.newContext({
    locale: 'ko-KR',
    extraHTTPHeaders: {
      ['accept-lanauge']: 'ko,en-US;q=0.9,en;q=0.8,ko-KR;q=0.7,ro;q=0.6,vi;q=0.5'
    }
  });
  try {
    // authencaition
    const login = {
      id: process.env.SSU_ID,
      password: process.env.SSU_PASSWORD
    };

    await authentication(context, login.id && login.password ? login : await prompt.get([
      { properties: { id: { message: 'http://myclass.ssu.ac.kr ID' } } },
      { properties: { password: { message: 'http://myclass.ssu.ac.kr Password', hidden: true } as unknown } }
    ]));

    // get courses
    const courses = await getCourses(context);
    console.log(`Your course [${courses.map(c => c.title).join(', ')}]`);

    // get uncomplete & active lectures
    const today = new Date();
    const lectures = (await Promise.all(courses.map(async course => {
      const [activeLectures, uncompleteLectures] = await Promise.all([
        getCourseActiveLectures(context, { courseId: course.id }),
        getCourseUncompleteLectures(context, { courseId: course.id })
      ]);
      return activeLectures.filter(lecture => {
        return uncompleteLectures.some(l => l.title === lecture.title) && lecture.startDate <= today && lecture.endDate >= today;
      });
    }))).reduce((result, lectures) => {
      return [
        ...result,
        ...lectures
      ];
    }, []);

    console.log(`Uncomplete ${lectures.length} lectures.`);
    if (lectures.length) {
      console.log(`Lets play!`);
      // view videos
      for (const lecture of lectures) {
        console.log(`View start [${lecture.title}] (${lecture.length})`);
        await viewVideo(context, {
          lectureId: lecture.id,
          timeLength: lecture.length
        });
        console.log(`View end [${lecture.title}]`);
      }
    }
    console.log(`ByeBye!`);
  } catch (e) {
    alert(e.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

main();