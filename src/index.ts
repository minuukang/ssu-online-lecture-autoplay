import * as playwright from 'playwright';
import * as dotenv from 'dotenv';
import * as prompt from 'prompt';
import * as alert from 'alert';
import { MultiBar, Presets } from 'cli-progress';

// services
import authentication from './service/authentication';
import getCourseActiveLectures from './service/getCourseActiveLectures';
import getCourseUncompleteLectures from './service/getCourseUncompleteLectures';
import getCourses from './service/getCourses';
import viewVideo from './service/viewVideo';
import { formatToTime, timeFormat } from './helpers/timeFormat';
import { consoleRewrite } from './helpers/consoleRewrite';

dotenv.config();
prompt.start();

async function main () {
  console.log('🚀 온라인 강의 자동 이어듣기 시작!\n');
  const browser = await playwright.firefox.launch({
    headless: !!process.env.PLAY_BACKGROUND
  });
  const context = await browser.newContext({
    locale: 'ko-KR',
    extraHTTPHeaders: {
      ['accept-lanauge']: 'ko,en-US;q=0.9,en;q=0.8,ko-KR;q=0.7,ro;q=0.6,vi;q=0.5'
    }
  });
  try {
    // authencaition
    let login = {
      id: process.env.SSU_ID,
      password: process.env.SSU_PASSWORD
    };

    if (!(login.id && login.password)) {
      console.log('📝 로그인 정보를 입력하세요.');
      login = await prompt.get([
        { properties: { id: { message: 'http://myclass.ssu.ac.kr ID' } } },
        { properties: { password: { message: 'http://myclass.ssu.ac.kr Password', hidden: true } as unknown } }
      ]);
    }

    console.log('⏳ 로그인 중입니다 ...');

    await authentication(context, login);

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    consoleRewrite('⏳ 강의 정보를 불러오는 중입니다 ...');

    // get courses
    const courses = await getCourses(context);

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

    consoleRewrite(`👀 총 ${lectures.length}개의 미수강 현재 주차 강의가 있습니다.\n`);
    if (lectures.length) {
      const mainProgress = new MultiBar({
        format: `{emoji} {index}. | {bar} | {course} > {lecture} | {status}`,
        hideCursor: true,
      }, Presets.rect);

      for (const lecture of lectures.map((lecture, index) => ({
        ...lecture,
        progress: mainProgress.create(formatToTime(lecture.length), 0, {
          emoji: '⏳',
          index: index + 1,
          course: courses.find(c => c.id === lecture.courseId)?.title,
          lecture: lecture.title,
          status: 'Waiting...'
        })
      }))) {
        const totalTime = lecture.progress.getTotal();
        const colonLength = lecture.length.split(':').length;
        const renderStatus = (time: number) => `(${timeFormat(time, colonLength)} / ${lecture.length})`;
        lecture.progress.update(0, {
          emoji: '🤤',
          status: 'Loading...'
        });
        let playReady = false;
        await viewVideo(context, {
          lectureId: lecture.id,
          timeLength: lecture.length,
          onConsole(event: { type: 'intro' } | { type: 'timeupdate'; currentTime: number; }) {
            if (event.type === 'intro') {
              playReady = true;
              lecture.progress.update(0, {
                emoji: '🏃‍',
                status: renderStatus(0)
              });
            } else if (event.type === 'timeupdate' && playReady) {
              lecture.progress.update(event.currentTime, {
                status: renderStatus(Math.floor(event.currentTime)),
              });
            }
          }
        });
        lecture.progress.update(totalTime, {
          emoji: '✅',
          status: renderStatus(totalTime),
        });
        lecture.progress.stop();
      }
      mainProgress.stop();
    }
    console.log(`\n✋ 다음에 또 봐요!`);
  } catch (e) {
    alert(e.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

main();
