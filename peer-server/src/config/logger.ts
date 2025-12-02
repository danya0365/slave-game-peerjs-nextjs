import type { TransformableInfo } from "logform";
import {
  createLogger as winstonCreateLogger,
  format,
  transports,
  type Logger,
} from "winston";

export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

type FormattedInfo = TransformableInfo & {
  timestamp?: string;
  stack?: string;
};

export const createLogger = (level: LogLevel): Logger =>
  winstonCreateLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.printf((info: FormattedInfo) => {
        const { timestamp, level: lvl, message, stack } = info;
        const prefix = `${timestamp ?? new Date().toISOString()} [${lvl}]`;

        if (stack) {
          return `${prefix} ${stack}`;
        }

        return `${prefix} ${String(message)}`;
      })
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    ],
  });
