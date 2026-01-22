
const winston = require('winston');

const jsonLogFileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.prettyPrint()
);

const loggerOptions = ["console", "file"];

function createLogger(options) {
  const log_level = options.level;
  // Create file loggers
  const logger = winston.createLogger({
    level: 'info',
    format: jsonLogFileFormat,
    expressFormat: true,
  });

  // When running locally, write everything to the console
  // with proper stacktraces enabled
  if (loggerOptions.indexOf('console') > -1) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, stack }) => {
            if (stack) {
              // print log trace
              return `${level}: ${timestamp} ${message} - ${stack}`;
            }
            return `${level}: ${timestamp} ${message}`;
          })
        ),
      })
    );
  }
  if (loggerOptions.indexOf('file') > -1) {
    logger.add(
      new winston.transports.File({
        filename: './log/app.logg',
        level: log_level,
        maxsize: 10485760,
        maxFiles: 3,
      })
    );
  }

  return logger;
}





module.exports = {
    createLogger
};

