import path from 'path';
import winston from 'winston';
import dayjs from 'dayjs';

const date = dayjs().format('YYYYMMDDTHHmmss');
const logPath = path.join(process.cwd(), '/.log/', date);

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: path.join(logPath, `/error.log`), level: 'error' }),
    new winston.transports.File({ filename: path.join(logPath, `/combined.log`) }),
  ],
});