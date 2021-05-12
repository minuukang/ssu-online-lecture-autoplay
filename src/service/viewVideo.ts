import { BrowserContext } from 'playwright';

type Props = {
  lectureId: string;
  onConsole?(event: { type: string; } & Record<string, unknown>): void;
};

export default async function viewVideo (context: BrowserContext, props: Props) {
  const { lectureId, onConsole } = props;
  const newPage = await context.newPage();
  await newPage.goto(`http://myclass.ssu.ac.kr/mod/xncommons/viewer.php?i=${lectureId}`);
  await newPage.waitForSelector('#vod_viewer iframe');
  const firstFrame = await (await newPage.$('#vod_viewer iframe')).contentFrame();
  await firstFrame.waitForSelector('#ViewerFrame');
  const secondFrame = await (await firstFrame.$('#ViewerFrame')).contentFrame();
  await secondFrame.waitForLoadState('load');
  await secondFrame.waitForSelector('.vc-front-screen-play-btn');
  await secondFrame.click('.vc-front-screen-play-btn');
  try {
    const muteButton = (await secondFrame.$('#play-controller .vc-pctrl-volume-btn:not(.muted)'));
    if (muteButton) {
      await muteButton.click();
    }
  } catch {}
  newPage.on('dialog', async (dialog) => {
    await dialog.accept();
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
  await newPage.exposeFunction('onConsole', onConsole);
  await secondFrame.evaluate(() => {
    return new Promise<void>(resolve => {
      try {
        // Check intro is pass from playProgress should move
        const introMutation = new MutationObserver(() => {
          onConsole?.({ type: 'intro' });
          introMutation.disconnect();
        });
        introMutation.observe(document.querySelector('.vc-pctrl-play-progress'), {
          attributes: true
        });
        // Check currentTime from seek thumb style mutation
        let prevCurrentTime = 0;
        const currentTimeEl = document.querySelector('.vc-pctrl-curr-time');
        const progressMutation = new MutationObserver(() => {
          const currentTimeText = currentTimeEl.textContent;
          const currentTime = currentTimeText.split(':').map(Number).reverse().reduce((result, value, index) => {
            return result + (value * Math.pow(60, index));
          }, 0);
          if (prevCurrentTime !== currentTime) {
            onConsole?.({
              type: 'timeupdate',
              currentTime: currentTime
            });
          }
          prevCurrentTime = currentTime;
        });
        progressMutation.observe(document.querySelector('.vc-pctrl-seek-thumb'), {
          attributes: true
        });
        // Check resolve from retry screen is opened
        const retryContainer = document.querySelector('#player-center-control') as HTMLDivElement;
        const retryMutation = new MutationObserver(() => {
          if (retryContainer.style.display && retryContainer.style.display !== 'none') {
            resolve();
          }
        });
        retryMutation.observe(retryContainer, {
          attributes: true
        });
      } catch (err) {}
    })
  })
  await newPage.close();
}