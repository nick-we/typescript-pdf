/**
 * Logging utility using Pino
 *
 * Provides structured logging for the typescript-pdf library
 */

import pino from 'pino';

// Configure the logger based on environment
const isDevelopment = process.env['NODE_ENV'] === 'development';
const isTest = process.env['NODE_ENV'] === 'test';

// Create base logger configuration
const loggerConfig: pino.LoggerOptions = {
    level: isTest ? 'silent' : isDevelopment ? 'debug' : 'info',
    ...(isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    }),
};

// Create the main logger instance
export const logger = pino({
    ...loggerConfig,
    name: 'typescript-pdf',
});

// Create child loggers for different modules
export const createModuleLogger = (module: string) => {
    return logger.child({ module });
};

// Pre-configured module loggers
export const layoutLogger = createModuleLogger('layout');
export const widgetLogger = createModuleLogger('widget');
export const chartLogger = createModuleLogger('chart');
export const tableLogger = createModuleLogger('table');
export const themeLogger = createModuleLogger('theme');
export const fontLogger = createModuleLogger('font');
export const pdfLogger = createModuleLogger('pdf');

// Export default logger for convenience
export default logger;
