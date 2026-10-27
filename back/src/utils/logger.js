const winston = require('winston');
const config = require('../../config/config');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] ${level}: ${message}`;
});

const fileFormat = printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: config.logging.level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true })
    ),
    transports: []
});

if (config.logging.console.enabled) {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'HH:mm:ss' }),
            consoleFormat
        )
    }));
}

if (config.logging.file.enabled) {
    const fs = require('fs');
    const logDir = path.dirname(config.logging.file.path);

    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    logger.add(new winston.transports.File({
        filename: config.logging.file.path,
        format: fileFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
    }));
}

module.exports = logger;