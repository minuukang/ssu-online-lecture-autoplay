import { BrowserContext } from 'playwright';

type Props = {
  id: string;
  password: string;
};

export default async function authentication (context: BrowserContext, props: Props) {
  const { id, password } = props;
  const page = await context.newPage();
  await page.goto('https://myclass.ssu.ac.kr/login.php');
  await page.fill('#input-username', id);
  await page.fill('#input-password', password);
  await page.click('[name="loginbutton"]');
  await page.waitForLoadState('load');
  const errorMessage = await page.$('.error_message');
  if (errorMessage) {
    throw new Error(await errorMessage.textContent());
  }
  await page.close();
}