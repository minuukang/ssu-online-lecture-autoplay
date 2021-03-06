import dotenv from 'dotenv';
import prompt from 'prompt';
import alert from 'alert';
import playwright from 'playwright';

import { authorization } from './service/auth';
import { getUnCompletedCourseComponents } from './service/course';
import { play } from './service/playVideo';
import { compomentProgress } from './helpers/progress';
import { progressTimeFormat } from './helpers/format';
import { consoleRewrite } from './helpers/console';

dotenv.config();

export default async function bootstrap () {
  console.log('π μ¨λΌμΈ κ°μ μλ μ΄μ΄λ£κΈ° μμ!\n');

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

    const ignoreCourseIds = process.env.IGNORE_COURSE_IDS?.split(',').map(Number) || [];

    if (!(input.id && input.password)) {
      console.log('π λ‘κ·ΈμΈ μ λ³΄λ₯Ό μλ ₯νμΈμ.');
      prompt.start();
      input = await prompt.get([
        { properties: { id: { message: 'http://myclass.ssu.ac.kr ID' } } },
        { properties: { password: { message: 'http://myclass.ssu.ac.kr Password', hidden: true } as never } }
      ]);
    }

    consoleRewrite('β³ λ‘κ·ΈμΈ μ€μλλ€ ...');

    const me = await authorization(context, input);

    consoleRewrite('β³ κ°μ μ λ³΄λ₯Ό λΆλ¬μ€λ μ€μλλ€ ...');

    const uncompletedComponents = await getUnCompletedCourseComponents(me, ignoreCourseIds);

    consoleRewrite(`π μ΄ ${uncompletedComponents.length}κ°μ λ―Έμκ° νμ¬ μ£Όμ°¨ κ°μκ° μμ΅λλ€.`);

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
          emoji: 'π€€',
          status: 'Loading...'
        });
  
        let playReady = false;
        `https://canvas.ssu.ac.kr/learningx/coursebuilder/course/${component.courseId}/learn/60858/unit/268399/view?user_id=11854&user_login=20180406&user_name=%EA%B0%95%EB%AF%BC%EC%9A%B0(20%23%23%23%2306)&user_email=minukang5874%40gmail.com&role=1&is_observer=false&locale=ko&mode=default`
        try {
          await play(context, {
            url: component.view_info.view_url,
            onConsole(event: { type: 'intro' | 'end' } | { type: 'timeupdate'; currentTime: number; }) {
              if (event.type === 'intro') {
                playReady = true;
                progress.update(0, {
                  emoji: 'πβ',
                  status: progressTimeFormat(0, totalTime)
                });
              } else if (event.type === 'timeupdate' && playReady) {
                const second = Math.floor(event.currentTime);
                progress.update(event.currentTime, {
                  emoji: second % 2 ? 'πβ' : 'πΆ',
                  status: progressTimeFormat(Math.floor(event.currentTime), totalTime),
                });
              } else if (event.type === 'end') {
                progress.update(totalTime, {
                  emoji: 'β',
                  status: 'Finishing...'
                });
              }
            }
          });

          progress.update(totalTime, {
            emoji: 'β',
            status: progressTimeFormat(totalTime, totalTime),
          });
        } catch (err) {
          progress.update(totalTime, {
            emoji: 'β',
            status: err instanceof Error ? err.message : String(err),
          });
        } finally {
          progress.stop();
        }
      }
      mainProgress.stop();
    }
    console.log(`\nβ λ€μμ λ λ΄μ!`);
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      alert(e.message);
    }
  } finally {
    await context.close();
    await browser.close();
    process.exit(0);
  }
}

if (require.main === module) {
  void bootstrap();
}
