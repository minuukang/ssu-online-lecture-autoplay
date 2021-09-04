import dotenv from 'dotenv';
import prompt from 'prompt';
import alert from 'alert';
import playwright from 'playwright';

import { login, authorization } from './service/auth';
import { getUnCompletedCourseComponents } from './service/course';
import { play } from './service/playVideo';
import { compomentProgress } from './helpers/progress';
import { progressTimeFormat } from './helpers/format';
import { consoleRewrite } from './helpers/console';

dotenv.config();

export default async function bootstrap () {
  console.log('🚀 온라인 강의 자동 이어듣기 시작!\n');

  const browser = await playwright.firefox.launch({
    headless: !!(process.env.PLAY_BACKGROUND && process.env.PLAY_BACKGROUND !== '0')
  });

  const context = await browser.newContext({
    locale: 'ko-KR',
    extraHTTPHeaders: {
      ['accept-lanauge']: 'ko,en-US;q=0.9,en;q=0.8,ko-KR;q=0.7,ro;q=0.6,vi;q=0.5'
    }
  });

  try {
    // authencaition
    let input = {
      id: process.env.SSU_ID as string,
      password: process.env.SSU_PASSWORD as string,
    };

    if (!(input.id && input.password)) {
      console.log('📝 로그인 정보를 입력하세요.');
      prompt.start();
      input = await prompt.get([
        { properties: { id: { message: 'http://myclass.ssu.ac.kr ID' } } },
        { properties: { password: { message: 'http://myclass.ssu.ac.kr Password', hidden: true } as never } }
      ]);
    }

    consoleRewrite('⏳ 로그인 중입니다 ...');

    await login(context, input);

    consoleRewrite('⏳ 강의 정보를 불러오는 중입니다 ...');

    const me = await authorization(context, { id: input.id });
    const uncompletedComponents = await getUnCompletedCourseComponents(me);

    consoleRewrite(`👀 총 ${uncompletedComponents.length}개의 미수강 현재 주차 강의가 있습니다.`);

    if (uncompletedComponents.length) {
      console.log('\n');

      const mainProgress = compomentProgress();
      for (const { component, progress } of uncompletedComponents.map((component, index, { length }) => ({
        component,
        progress: mainProgress.create({
          total: component.commons_content.duration,
          index: String(index + 1).padStart(1 + Math.floor(Math.log10(length)), '0'),
          title: component.title,
          category: component.courseName,
          status: progressTimeFormat(0, component.commons_content.duration)
        })
      }))) {
        const totalTime = progress.getTotal();
        progress.update(0, {
          emoji: '🤤',
          status: 'Loading...'
        });
  
        let playReady = false;
        `https://canvas.ssu.ac.kr/learningx/coursebuilder/course/${component.courseId}/learn/60858/unit/268399/view?user_id=11854&user_login=20180406&user_name=%EA%B0%95%EB%AF%BC%EC%9A%B0(20%23%23%23%2306)&user_email=minukang5874%40gmail.com&role=1&is_observer=false&locale=ko&mode=default`
        await play(context, {
          url: component.view_info.view_url,
          onConsole(event: { type: 'intro' | 'end' } | { type: 'timeupdate'; currentTime: number; }) {
            if (event.type === 'intro') {
              playReady = true;
              progress.update(0, {
                emoji: '🏃‍',
                status: progressTimeFormat(0, totalTime)
              });
            } else if (event.type === 'timeupdate' && playReady) {
              const second = Math.floor(event.currentTime);
              progress.update(event.currentTime, {
                emoji: second % 2 ? '🏃‍' : '🚶',
                status: progressTimeFormat(Math.floor(event.currentTime), totalTime),
              });
            } else if (event.type === 'end') {
              progress.update(totalTime, {
                emoji: '⌛',
                status: 'Finishing...'
              });
            }
          }
        });
  
        progress.update(totalTime, {
          emoji: '✅',
          status: progressTimeFormat(totalTime, totalTime),
        });
        progress.stop();
      }
    }
    console.log(`\n✋ 다음에 또 봐요!`);
  } catch (e) {
    alert(e.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

if (require.main === module) {
  void bootstrap();
}
