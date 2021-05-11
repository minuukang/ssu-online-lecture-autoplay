import { SingleBar, Presets } from 'cli-progress';
import * as prompt from 'prompt';

const items = [
  { course: '소프트웨어공학', lecture: '소프트웨어공학_11주차_UI설계(1)', length: '27:48' },
  { course: '소프트웨어공학', lecture: '소프트웨어공학_11주차_UI설계(2)', length: '28:34' },
  { course: '소프트웨어공학', lecture: '소프트웨어공학_11주차_UI설계(3)', length: '23:54' },
  { course: '애니메이션', lecture: 'Week11_Part01', length: '29:51' },
  { course: '애니메이션', lecture: 'Week11_Part02', length: '35:50' },
  { course: '애니메이션', lecture: 'Week11_Part03', length: '13:01' },
  { course: '웹프로그래밍', lecture: '11주차 동영상 강의', length: '01:00:20' },
  { course: '인사조직관리', lecture: '인사조직관리11', length: '01:14:08' },
  { course: '프로그래밍기초', lecture: '함수와 모듈I', length: '01:00:25' }
];

function timeFormat (time: number, colonLength: number = 3) {
  const minute = Math.floor(time / 60);
  return [
    Math.floor(minute / 60),
    minute % 60,
    time % 60
  ].slice(Math.abs(colonLength - 3)).map(t => String(t).padStart(2, '0')).join(':');
}

function formatToTime (timeFormat: string) {
  return timeFormat.split(':').map(Number).reverse().reduce((result, value, index) => {
    return result + (value * Math.pow(60, index));
  }, 0)
}

async function main () {
  console.log('🚀 온라인 강의 자동 이어듣기 시작!\n');
  console.log('📝 로그인 정보를 입력하세요.');
  await prompt.get([
    { properties: { id: { message: 'http://myclass.ssu.ac.kr (숭실대 아이디)' } } },
    { properties: { password: { message: 'http://myclass.ssu.ac.kr (숭실대 비밀번호)', hidden: true } as unknown } }
  ]);
  console.log(`\n👀 총 ${items.length}개의 미수강 현재 주차 강의가 있습니다.\n`);
  for (const item of items) {
    // create a new progress bar instance and use shades_classic theme
    const bar1 = new SingleBar({
      format: `{emoji} {index}. | {bar} | {course} > {lecture} | {status}`,
      hideCursor: true,
    }, Presets.rect);

    // start the progress bar with a total value of 200 and start value of 0
    const index = items.indexOf(item) + 1;
    const currentTime = 1845;
    bar1.start(formatToTime(item.length), index === items.length ? currentTime : formatToTime(item.length), {
      emoji: items.length === index ? '⏳' : '✅',
      course: item.course,
      lecture: item.lecture,
      status: items.length === index ? `(${timeFormat(currentTime, item.length.split(':').length)} / ${item.length})` :  `(${item.length} / ${item.length})`,
      index,
    });

    // bar1.update(0);
    bar1.stop();
  }
}

main();