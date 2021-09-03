import { BrowserContext, Page } from 'playwright';
import cookie from 'cookie';

export type LoginProps = {
  id: string;
  password: string;
};

export async function login (context: BrowserContext, props: LoginProps): Promise<Page> {
  const { id, password } = props;
  const loginPage = await context.newPage();
  await loginPage.goto(`https://smartid.ssu.ac.kr/Symtra_sso/smln.asp?apiReturnUrl=https%3A%2F%2Fclass.ssu.ac.kr%2Fxn-sso%2Fgw-cb.php`, { waitUntil: 'domcontentloaded' });
  await loginPage.fill('#userid', id);
  await loginPage.fill('#pwd', password);
  await loginPage.click('.btn_login');
  await loginPage.waitForURL('https://class.ssu.ac.kr/');
  return loginPage;
}

export type Authorization = {
  user_id: string;
  user_login: string;
  role: string;
  token: string;
};

export async function authorization (context: BrowserContext, { id } : { id: string; }): Promise<Authorization> {
  const page = context.pages()[0] || await context.newPage();
  await page.goto(`https://canvas.ssu.ac.kr/learningx/dashboard?user_login=${id}&locale=ko`);
  const { user_id, user_login, role, cookies } = await page.evaluate(() => {
    const root = document.querySelector('#root') as HTMLElement;
    return {
      user_id: root.dataset.user_id,
      user_login: root.dataset.user_login,
      role: root.dataset.role,
      cookies: document.cookie
    };
  });
  const token = cookie.parse(cookies).xn_api_token;
  if (!token || !user_id || !user_login || !role) {
    throw new Error('Profile is not exists!');
  }
  return {
    user_id,
    user_login,
    role,
    token
  };
}