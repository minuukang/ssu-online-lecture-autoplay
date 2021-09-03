import { BrowserContext } from 'playwright';

type Props = {
  url: string;
  onConsole?(event: { type: string; } & Record<string, unknown>): void;
};

export async function play (context: BrowserContext, props: Props) {
  const { url, onConsole } = props;
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector('#tool_content');
  const firstFrame = (await (await page.$('#tool_content'))!.contentFrame())!;
  await firstFrame.waitForSelector('.xn-content-frame');
  const secondFrame = (await (await firstFrame.$('.xn-content-frame'))!.contentFrame())!;
  await secondFrame.waitForLoadState('load');
  await secondFrame.waitForSelector('.vc-front-screen-play-btn');
  await secondFrame.click('.vc-front-screen-play-btn');
  try {
    await (await secondFrame.$('.vc-pctrl-volume-btn:not(.muted)'))?.click();
  } catch {}
  page.on('dialog', async dialog => await dialog.accept());
  page.on('console', async message => {
    if (message.args().length && message.text() === 'JSHandle@object') {
      try {
        const event = await message.args()[0].jsonValue();
        if (typeof event === 'object' && 'type' in event) {
          onConsole?.(event);
        }
      } catch {}
    }
  });
  onConsole && await page.exposeFunction('onConsole', onConsole);
  await secondFrame.evaluate(() => {
    return new Promise<void>(resolve => {
      try {
        function progressStart () {
          // Check currentTime from seek thumb style mutation
          let prevCurrentTime = 0;
          const currentTimeEl = document.querySelector('.vc-pctrl-curr-time')!;
          const progressMutation = new MutationObserver(() => {
            const currentTimeText = currentTimeEl.textContent!;
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
          progressMutation.observe(document.querySelector('.vc-pctrl-seek-thumb')!, {
            attributes: true
          });
        }

        // Check intro is pass from playProgress should move
        const introMutation = new MutationObserver(() => {
          onConsole?.({ type: 'intro' });
          introMutation.disconnect();
          progressStart();
        });
        introMutation.observe(document.querySelector('.vc-pctrl-play-progress')!, {
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
        
        // Check confirm dialog if opened
        const confirmDialog = document.querySelector('#confirm-dialog') as HTMLDivElement;
        const confirmMutation = new MutationObserver(() => {
          if (confirmDialog.style.display && confirmDialog.style.display !== 'none') {
            (confirmDialog.querySelector('.confirm-ok-btn') as HTMLDivElement).click();
          }
        });
        confirmMutation.observe(confirmDialog, {
          attributes: true
        });
      } catch (err) {}
    });
  });
  await page.waitForLoadState('networkidle');
  await page.close();
}