import * as app from '..';
import winston from 'winston';
import 'winston-daily-rotate-file';

export const logger = <app.ILoggerService> winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.printf(x => x.message),
      level: 'info'
    }),
    new winston.transports.DailyRotateFile({
      dirname: app.settings.logger,
      filename: '%DATE%.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.printf(x => `[${x.timestamp}] ${x.level.toUpperCase().padEnd(5)} ${x.message}`)),
      level: 'debug',
      maxFiles: 5,
      maxSize: '20MB'
    })
  ]
});