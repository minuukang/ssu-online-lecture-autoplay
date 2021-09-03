import { MultiBar, Presets } from 'cli-progress';

type ProgressProps = {
  total: number;
  index: string;
  title: string;
  category: string;
  status?: string;
};

export function compomentProgress () {
  const mainProgress = new MultiBar({
    format: `{emoji} {index}. | {bar} | {category} > {title} | {status}`,
    hideCursor: true,
  }, Presets.rect);
  return {
    create: ({ total, index, title, category, status = 'Waiting...' }: ProgressProps) => mainProgress.create(total, 0, {
      emoji: '⏳',
      index,
      category,
      title,
      status
    }),
    stop: () => mainProgress.stop()
  }
}