import { BrowserContext } from 'playwright';

type Props = {
  lectureId: string;
  timeLength: string;
  onConsole?(event: { type: string; }): void;
};

export default async function viewVideo (context: BrowserContext, props: Props) {
  const { lectureId, timeLength, onConsole } = props;
  const newPage = await context.newPage();
  await newPage.goto(`http://myclass.ssu.ac.kr/mod/xncommons/viewer.php?i=${lectureId}`);
  await newPage.waitForSelector('#vod_viewer iframe');
  const firstFrame = await (await newPage.$('#vod_viewer iframe')).contentFrame();
  await firstFrame.waitForSelector('#ViewerFrame');
  const secondFrame = await (await firstFrame.$('#ViewerFrame')).contentFrame();
  await secondFrame.waitForLoadState('load');
  await secondFrame.waitForSelector('.vc-front-screen-play-btn');
  await secondFrame.click('.vc-front-screen-play-btn');
  const muteButton = (await secondFrame.$('#play-controller .vc-pctrl-volume-btn:not(.muted)'));
  if (muteButton) {
    await muteButton.click();
  }
  newPage.on('dialog', async (dialog) => {
    await dialog.dismiss();
  });
  newPage.on('console', async message => {
    if (message.args().length && message.text() === 'JSHandle@object') {
      try {
        const event = await message.args()[0].jsonValue();
        if (typeof event === 'object' && 'type' in event) {
          onConsole?.(event);
        }
      } catch {}
    }
  });
  let timer: NodeJS.Timeout;
  await Promise.race([
    // 첫번째 인트로 영상 넘기고 두번째 본영상 끝날때까지 대기하거나
    secondFrame.evaluate(() => {
      return new Promise<void>((resolve) => {
        let videoEnded = 0;
        const medias = Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'));
        medias.forEach(media => {
          media.addEventListener('ended', () => {
            if (videoEnded++ === 0) {
              console.log({ type: 'intro' });
            } else {
              resolve();
            }
          });
          media.addEventListener('timeupdate', e => {
            console.log({ type: 'timeupdate', currentTime: media.currentTime });
          });
        })
      })
    }),
    // 혹시 모르니 시간만큼 대기 타기
    new Promise(resolve => {
      timer = setTimeout(resolve, timeLength.split(':').map(Number).reverse().reduce((result, value, index) => {
        return result + ((value * 1000) * Math.pow(60, index));
      }, 5000));
    })
  ]);
  clearTimeout(timer);
  await newPage.close();
}