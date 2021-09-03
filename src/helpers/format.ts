export function timeFormat (time: number, colonLength: number = 3) {
  const minute = Math.floor(time / 60);
  return [
    Math.floor(minute / 60),
    Math.floor(minute % 60),
    Math.floor(time % 60)
  ].slice(Math.abs(colonLength - 3)).map(t => String(t).padStart(2, '0')).join(':');
}

export function progressTimeFormat (current: number, duration: number) {
  const colonLength = 1 + Math.floor(Math.log(duration) / Math.log(60))
  return `(${timeFormat(current, colonLength)} / ${timeFormat(duration, colonLength)})`
}

export function formatToTime (timeFormat: string) {
  return timeFormat.split(':').map(Number).reverse().reduce((result, value, index) => {
    return result + (value * Math.pow(60, index));
  }, 0)
}