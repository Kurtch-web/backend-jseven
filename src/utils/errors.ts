//utils/errors.ts
export class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;

  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
  }
}

export class BadRequestError extends Error {
  statusCode: number;

  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequestError";
    this.statusCode = 400;
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown (only works in V8)
    Error.captureStackTrace(this, this.constructor);
  }
}


export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable Entity") {
    super(message, 422);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}
