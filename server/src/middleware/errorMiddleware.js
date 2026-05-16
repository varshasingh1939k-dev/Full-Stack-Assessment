const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Sanitize database connection strings or Prisma errors to prevent credential leakage
  if (message && (message.includes('postgresql://') || message.includes('PrismaClient') || message.includes('database server'))) {
    message = 'An unexpected database connection error occurred. Please try again later.';
    statusCode = 503;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
