/**
 * Global error handler. Use as last middleware: app.use(errorHandler).
 * Sends consistent JSON: { error, message?, statusCode }.
 */
export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode ?? err.status ?? 500;
    const message = err.message ?? 'Internal server error';
    if (statusCode >= 500) {
        console.error('Error:', err);
    }
    res.status(statusCode).json({
        error: err.name ?? 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
    });
}

/** 404 for unknown routes. Use after all routes, before errorHandler. */
export function notFoundHandler(req, res, next) {
    res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
}
