export function timeFormat (time: number, colonLength: number = 3) {
  const minute = Math.floor(time / 60);
  return [
    Math.floor(minute / 60),
    minute % 60,
    time % 60
  ].slice(Math.abs(colonLength - 3)).map(t => String(t).padStart(2, '0')).join(':');
}

export function formatToTime (timeFormat: string) {
  return timeFormat.split(':').map(Number).reverse().reduce((result, value, index) => {
    return result + (value * Math.pow(60, index));
  }, 0)
}