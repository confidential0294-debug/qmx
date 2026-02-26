/**
 * QMX Error Utilities
 *
 * Comprehensive error handling utilities and custom error classes
 * for consistent error management across the application.
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error category types
 */
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'conflict'
  | 'internal'
  | 'network'
  | 'timeout'
  | 'rate_limit'
  | 'configuration'
  | 'file_system'
  | 'database'
  | 'api'
  | 'unknown';

/**
 * Error context metadata
 */
export interface ErrorContext {
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Related error codes */
  codes?: string[];
  /** Stack trace if available */
  stack?: string;
  /** Timestamp when error occurred */
  timestamp?: string;
  /** Session or request ID */
  correlationId?: string;
  /** User ID if applicable */
  userId?: string;
  /** Component that threw the error */
  component?: string;
  /** Operation that failed */
  operation?: string;
  /** Error category */
  category?: ErrorCategory;
  /** Severity level */
  severity?: ErrorSeverity;
  /** Whether error is recoverable */
  recoverable?: boolean;
  /** Suggested retry action */
  retryable?: boolean;
  /** Retry after seconds */
  retryAfter?: number;
}

/**
 * Error options for construction
 */
export interface ErrorOptions {
  /** Error message */
  message?: string;
  /** Cause of the error */
  cause?: unknown;
  /** Error context */
  context?: ErrorContext;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error code */
  code?: string;
}

/**
 * Serialized error for transport
 */
export interface SerializedError {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  stack?: string;
  cause?: SerializedError;
  context?: ErrorContext;
  timestamp: string;
}

/**
 * Error handler function type
 */
export type ErrorHandler<T extends Error = Error> = (error: T) => void | Promise<void>;

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /** Whether to retry */
  retry: boolean;
  /** Delay before retry in ms */
  delay: number;
  /** Maximum retries */
  maxRetries: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Custom handler */
  handler?: ErrorHandler;
}

// Base error class with enhanced functionality
export class QmxError extends Error {
  /** Error category */
  public readonly category: ErrorCategory;

  /** Error severity */
  public readonly severity: ErrorSeverity;

  /** Error code for programmatic handling */
  public readonly code?: string;

  /** HTTP status code if applicable */
  public readonly statusCode?: number;

  /** Additional context */
  public readonly context: ErrorContext;

  /** Timestamp when error occurred */
  public readonly timestamp: string;

  /** Original cause if chained */
  public readonly cause?: unknown;

  /** Whether error has been handled */
  public handled: boolean = false;

  constructor(
    message: string,
    options?: ErrorOptions
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.category = options?.context?.category ?? 'unknown';
    this.severity = options?.context?.severity ?? 'medium';
    this.code = options?.code;
    this.statusCode = options?.statusCode;
    this.context = {
      ...options?.context,
      category: options?.context?.category ?? 'unknown',
      timestamp: options?.context?.timestamp ?? new Date().toISOString(),
      stack: options?.context?.stack ?? this.stack,
    } as ErrorContext;
    this.timestamp = this.context.timestamp!;
    this.cause = options?.cause;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get error category
   */
  getCategory(): ErrorCategory {
    return this.context.category ?? 'unknown';
  }

  /**
   * Get error severity
   */
  getSeverity(): ErrorSeverity {
    return this.severity;
  }

  /**
   * Get error code
   */
  getCode(): string | undefined {
    return this.code;
  }

  /**
   * Get HTTP status code
   */
  getStatusCode(): number | undefined {
    return this.statusCode;
  }

  /**
   * Get error context
   */
  getContext(): ErrorContext {
    return this.context;
  }

  /**
   * Get additional details
   */
  getDetails(): Record<string, unknown> | undefined {
    return this.context.details;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return this.context.recoverable ?? false;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.context.retryable ?? false;
  }

  /**
   * Get retry after duration
   */
  getRetryAfter(): number | undefined {
    return this.context.retryAfter;
  }

  /**
   * Mark error as handled
   */
  markHandled(): void {
    this.handled = true;
  }

  /**
   * Check if error is handled
   */
  isHandled(): boolean {
    return this.handled;
  }

  /**
   * Serialize error for transport
   */
  serialize(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      stack: this.stack,
      cause: this.cause instanceof QmxError ? this.cause.serialize() : undefined,
      context: this.context,
      timestamp: this.timestamp,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.context.details?.userMessage as string ?? this.message;
  }

  /**
   * Get developer-friendly error message
   */
  getDeveloperMessage(): string {
    const parts = [`${this.name}: ${this.message}`];
    
    if (this.code) {
      parts.push(`[Code: ${this.code}]`);
    }
    if (this.statusCode) {
      parts.push(`[Status: ${this.statusCode}]`);
    }
    if (this.context.component) {
      parts.push(`[Component: ${this.context.component}]`);
    }
    if (this.context.operation) {
      parts.push(`[Operation: ${this.context.operation}]`);
    }

    return parts.join(' ');
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.getDeveloperMessage();
  }

  /**
   * Get formatted error output
   */
  toJSON(): SerializedError {
    return this.serialize();
  }

  /**
   * Create a new error with additional context
   */
  withContext(additionalContext: Partial<ErrorContext>): QmxError {
    const newContext = { ...this.context, ...additionalContext };
    const NewErrorClass = this.constructor as typeof QmxError;
    const newError = new NewErrorClass(this.message, {
      cause: this,
      context: newContext,
      code: this.code,
      statusCode: this.statusCode,
    });
    return newError;
  }

  /**
   * Wrap error with additional information
   */
  wrap(message: string, context?: Partial<ErrorContext>): QmxError {
    const newError = new QmxError(message, {
      cause: this,
      context: { ...this.context, ...context },
      code: this.code,
      statusCode: this.statusCode,
    });
    return newError;
  }
}

// Validation Errors
export class ValidationError extends QmxError {
  constructor(
    message: string = 'Validation failed',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'validation',
        severity: 'low',
        recoverable: true,
      },
    });
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string, options?: ErrorOptions) {
    super(`Required field missing: ${field}`, {
      ...options,
      code: 'REQUIRED_FIELD',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, field },
      },
    });
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(
    field: string,
    expected: string,
    received?: string,
    options?: ErrorOptions
  ) {
    super(`Invalid format for ${field}: expected ${expected}${received ? `, received ${received}` : ''}`, {
      ...options,
      code: 'INVALID_FORMAT',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, field, expected, received },
      },
    });
  }
}

export class RangeError extends ValidationError {
  constructor(
    field: string,
    min?: number | string,
    max?: number | string,
    value?: number | string,
    options?: ErrorOptions
  ) {
    let message = `Value out of range for ${field}`;
    if (min !== undefined && max !== undefined) {
      message += `: must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      message += `: must be at least ${min}`;
    } else if (max !== undefined) {
      message += `: must be at most ${max}`;
    }
    if (value !== undefined) {
      message += `, received ${value}`;
    }

    super(message, {
      ...options,
      code: 'RANGE_ERROR',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, field, min, max, value },
      },
    });
  }
}

export class TypeMismatchError extends ValidationError {
  constructor(
    field: string,
    expected: string,
    received: string,
    options?: ErrorOptions
  ) {
    super(`Type mismatch for ${field}: expected ${expected}, received ${received}`, {
      ...options,
      code: 'TYPE_MISMATCH',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, field, expected, received },
      },
    });
  }
}

// Authentication Errors
export class AuthenticationError extends QmxError {
  constructor(
    message: string = 'Authentication failed',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'authentication',
        severity: 'high',
        recoverable: true,
      },
      statusCode: options?.statusCode ?? 401,
    });
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(options?: ErrorOptions) {
    super('Invalid credentials provided', {
      ...options,
      code: 'INVALID_CREDENTIALS',
    });
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(expiredAt?: string, options?: ErrorOptions) {
    super('Authentication token has expired', {
      ...options,
      code: 'TOKEN_EXPIRED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, expiredAt },
        retryable: false,
      },
    });
  }
}

export class TokenInvalidError extends AuthenticationError {
  constructor(reason?: string, options?: ErrorOptions) {
    super(`Authentication token is invalid${reason ? `: ${reason}` : ''}`, {
      ...options,
      code: 'TOKEN_INVALID',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, reason },
        retryable: false,
      },
    });
  }
}

export class SessionExpiredError extends AuthenticationError {
  constructor(options?: ErrorOptions) {
    super('Session has expired', {
      ...options,
      code: 'SESSION_EXPIRED',
    });
  }
}

// Authorization Errors
export class AuthorizationError extends QmxError {
  constructor(
    message: string = 'Authorization failed',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'authorization',
        severity: 'high',
        recoverable: false,
      },
      statusCode: options?.statusCode ?? 403,
    });
  }
}

export class PermissionDeniedError extends AuthorizationError {
  constructor(permission?: string, resource?: string, options?: ErrorOptions) {
    let message = 'Permission denied';
    if (permission && resource) {
      message = `Permission '${permission}' denied for resource '${resource}'`;
    } else if (permission) {
      message = `Permission '${permission}' denied`;
    } else if (resource) {
      message = `Access denied to resource '${resource}'`;
    }

    super(message, {
      ...options,
      code: 'PERMISSION_DENIED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, permission, resource },
      },
    });
  }
}

export class RoleRequiredError extends AuthorizationError {
  constructor(requiredRole: string, options?: ErrorOptions) {
    super(`Required role: ${requiredRole}`, {
      ...options,
      code: 'ROLE_REQUIRED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, requiredRole },
      },
    });
  }
}

// Not Found Errors
export class NotFoundError extends QmxError {
  constructor(
    message: string = 'Resource not found',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'not_found',
        severity: 'medium',
        recoverable: false,
      },
      statusCode: options?.statusCode ?? 404,
    });
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(resourceType: string, identifier?: string | number, options?: ErrorOptions) {
    let message = `${resourceType} not found`;
    if (identifier !== undefined) {
      message += `: ${identifier}`;
    }

    super(message, {
      ...options,
      code: 'RESOURCE_NOT_FOUND',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, resourceType, identifier },
      },
    });
  }
}

export class EndpointNotFoundError extends NotFoundError {
  constructor(path: string, method?: string, options?: ErrorOptions) {
    let message = `Endpoint not found: ${path}`;
    if (method) {
      message = `${method} ${path} not found`;
    }

    super(message, {
      ...options,
      code: 'ENDPOINT_NOT_FOUND',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, path, method },
      },
    });
  }
}

// Conflict Errors
export class ConflictError extends QmxError {
  constructor(
    message: string = 'Resource conflict',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'conflict',
        severity: 'medium',
        recoverable: true,
      },
      statusCode: options?.statusCode ?? 409,
    });
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resourceType: string, identifier?: string | number, options?: ErrorOptions) {
    let message = `Duplicate ${resourceType}`;
    if (identifier !== undefined) {
      message += `: ${identifier} already exists`;
    }

    super(message, {
      ...options,
      code: 'DUPLICATE_RESOURCE',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, resourceType, identifier },
      },
    });
  }
}

export class VersionConflictError extends ConflictError {
  constructor(expectedVersion?: string | number, actualVersion?: string | number, options?: ErrorOptions) {
    let message = 'Version conflict';
    if (expectedVersion !== undefined && actualVersion !== undefined) {
      message = `Version conflict: expected ${expectedVersion}, found ${actualVersion}`;
    }

    super(message, {
      ...options,
      code: 'VERSION_CONFLICT',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, expectedVersion, actualVersion },
      },
    });
  }
}

// Network Errors
export class NetworkError extends QmxError {
  constructor(
    message: string = 'Network error occurred',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'network',
        severity: 'high',
        recoverable: true,
        retryable: true,
      },
    });
  }
}

export class ConnectionError extends NetworkError {
  constructor(host?: string, port?: number, options?: ErrorOptions) {
    let message = 'Connection failed';
    if (host) {
      message += ` to ${host}`;
      if (port) message += `:${port}`;
    }

    super(message, {
      ...options,
      code: 'CONNECTION_ERROR',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, host, port },
      },
    });
  }
}

export class DnsError extends NetworkError {
  constructor(hostname?: string, options?: ErrorOptions) {
    super(`DNS lookup failed${hostname ? ` for ${hostname}` : ''}`, {
      ...options,
      code: 'DNS_ERROR',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, hostname },
      },
    });
  }
}

export class SslError extends NetworkError {
  constructor(reason?: string, options?: ErrorOptions) {
    super(`SSL/TLS error${reason ? `: ${reason}` : ''}`, {
      ...options,
      code: 'SSL_ERROR',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, reason },
        severity: 'critical',
      },
    });
  }
}

// Timeout Errors
export class TimeoutError extends QmxError {
  constructor(
    message: string = 'Operation timed out',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'timeout',
        severity: 'high',
        recoverable: true,
        retryable: true,
      },
    });
  }
}

export class RequestTimeoutError extends TimeoutError {
  constructor(timeoutMs?: number, options?: ErrorOptions) {
    super(`Request timeout${timeoutMs ? ` after ${timeoutMs}ms` : ''}`, {
      ...options,
      code: 'REQUEST_TIMEOUT',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, timeoutMs },
        retryAfter: timeoutMs ? Math.min(timeoutMs * 2, 30000) : undefined,
      },
    });
  }
}

export class ConnectionTimeoutError extends TimeoutError {
  constructor(timeoutMs?: number, options?: ErrorOptions) {
    super(`Connection timeout${timeoutMs ? ` after ${timeoutMs}ms` : ''}`, {
      ...options,
      code: 'CONNECTION_TIMEOUT',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, timeoutMs },
      },
    });
  }
}

// Rate Limit Errors
export class RateLimitError extends QmxError {
  constructor(
    message: string = 'Rate limit exceeded',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'rate_limit',
        severity: 'medium',
        recoverable: true,
        retryable: true,
      },
      statusCode: options?.statusCode ?? 429,
    });
  }
}

export class QuotaExceededError extends RateLimitError {
  constructor(quota?: string, limit?: number, current?: number, options?: ErrorOptions) {
    let message = 'Quota exceeded';
    if (quota) {
      message += ` for ${quota}`;
      if (limit !== undefined && current !== undefined) {
        message += ` (${current}/${limit})`;
      }
    }

    super(message, {
      ...options,
      code: 'QUOTA_EXCEEDED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, quota, limit, current },
        retryAfter: 3600, // Default 1 hour
      },
    });
  }
}

// Configuration Errors
export class ConfigurationError extends QmxError {
  constructor(
    message: string = 'Configuration error',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'configuration',
        severity: 'high',
        recoverable: false,
      },
    });
  }
}

export class MissingConfigError extends ConfigurationError {
  constructor(key: string, options?: ErrorOptions) {
    super(`Missing configuration: ${key}`, {
      ...options,
      code: 'MISSING_CONFIG',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, key },
      },
    });
  }
}

export class InvalidConfigError extends ConfigurationError {
  constructor(key: string, reason?: string, options?: ErrorOptions) {
    super(`Invalid configuration for ${key}${reason ? `: ${reason}` : ''}`, {
      ...options,
      code: 'INVALID_CONFIG',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, key, reason },
      },
    });
  }
}

// File System Errors
export class FileSystemError extends QmxError {
  constructor(
    message: string = 'File system error',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'file_system',
        severity: 'medium',
      },
    });
  }
}

export class FileNotFoundError extends FileSystemError {
  constructor(path: string, options?: ErrorOptions) {
    super(`File not found: ${path}`, {
      ...options,
      code: 'FILE_NOT_FOUND',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, path },
      },
    });
  }
}

export class DirectoryNotFoundError extends FileSystemError {
  constructor(path: string, options?: ErrorOptions) {
    super(`Directory not found: ${path}`, {
      ...options,
      code: 'DIRECTORY_NOT_FOUND',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, path },
      },
    });
  }
}

export class PermissionError extends FileSystemError {
  constructor(path: string, operation?: string, options?: ErrorOptions) {
    let message = `Permission denied: ${path}`;
    if (operation) {
      message += ` for ${operation}`;
    }

    super(message, {
      ...options,
      code: 'PERMISSION_ERROR',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, path, operation },
      },
    });
  }
}

// API Errors
export class ApiError extends QmxError {
  constructor(
    message: string = 'API error',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'api',
        severity: 'medium',
      },
      statusCode: options?.statusCode ?? 500,
    });
  }
}

export class ApiValidationError extends ApiError {
  constructor(errors?: Array<{ field: string; message: string }>, options?: ErrorOptions) {
    super('API validation failed', {
      ...options,
      code: 'API_VALIDATION_ERROR',
      statusCode: 400,
      context: {
        ...options?.context,
        details: { ...options?.context?.details, errors },
      },
    });
  }
}

export class ApiNotFoundError extends ApiError {
  constructor(resource?: string, options?: ErrorOptions) {
    super(`API resource not found${resource ? `: ${resource}` : ''}`, {
      ...options,
      code: 'API_NOT_FOUND',
      statusCode: 404,
      context: {
        ...options?.context,
        details: { ...options?.context?.details, resource },
      },
    });
  }
}

export class ApiRateLimitError extends ApiError {
  constructor(resetAfter?: number, options?: ErrorOptions) {
    super('API rate limit exceeded', {
      ...options,
      code: 'API_RATE_LIMIT',
      statusCode: 429,
      context: {
        ...options?.context,
        details: { ...options?.context?.details, resetAfter },
        retryable: true,
        retryAfter: resetAfter,
      },
    });
  }
}

// Internal Errors
export class InternalError extends QmxError {
  constructor(
    message: string = 'Internal error occurred',
    options?: ErrorOptions
  ) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'internal',
        severity: 'critical',
        recoverable: false,
      },
      statusCode: options?.statusCode ?? 500,
    });
  }
}

export class NotImplementedError extends InternalError {
  constructor(feature?: string, options?: ErrorOptions) {
    super(`Not implemented${feature ? `: ${feature}` : ''}`, {
      ...options,
      code: 'NOT_IMPLEMENTED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, feature },
      },
    });
  }
}

export class UnsupportedError extends InternalError {
  constructor(feature?: string, reason?: string, options?: ErrorOptions) {
    let message = 'Unsupported operation';
    if (feature) {
      message += `: ${feature}`;
    }
    if (reason) {
      message += ` - ${reason}`;
    }

    super(message, {
      ...options,
      code: 'UNSUPPORTED',
      context: {
        ...options?.context,
        details: { ...options?.context?.details, feature, reason },
      },
    });
  }
}

// Error handling utilities

/**
 * Check if value is an error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if value is a QmxError
 */
export function isQmxError(value: unknown): value is QmxError {
  return value instanceof QmxError;
}

/**
 * Check if error is of specific type
 */
export function isErrorType<T extends new (...args: any[]) => Error>(
  error: unknown,
  errorType: T
): error is InstanceType<T> {
  return error instanceof errorType;
}

/**
 * Get error message safely
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return defaultMessage;
}

/**
 * Get error code safely
 */
export function getErrorCode(error: unknown, defaultCode: string = 'UNKNOWN'): string {
  if (error instanceof QmxError && error.code) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as Record<string, unknown>).code);
  }
  return defaultCode;
}

/**
 * Get error stack safely
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  if (error && typeof error === 'object' && 'stack' in error) {
    return String((error as Record<string, unknown>).stack);
  }
  return undefined;
}

/**
 * Serialize error to plain object
 */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof QmxError) {
    return error.serialize();
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      category: 'unknown',
      severity: 'medium',
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }
  return {
    name: 'UnknownError',
    message: String(error),
    category: 'unknown',
    severity: 'medium',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Deserialize error from plain object
 */
export function deserializeError(data: SerializedError): QmxError {
  const error = new QmxError(data.message, {
    code: data.code,
    statusCode: data.statusCode,
    context: data.context,
  });
  error.name = data.name;
  return error;
}

/**
 * Wrap error with additional context
 */
export function wrapError(
  error: unknown,
  message: string,
  context?: Partial<ErrorContext>
): QmxError {
  const qmxError = error instanceof QmxError ? error : new QmxError(getErrorMessage(error));
  return qmxError.wrap(message, context);
}

/**
 * Create error from HTTP response
 */
export function createHttpError(
  statusCode: number,
  message?: string,
  _body?: unknown
): QmxError {
  const defaultMessage = getMessageForStatusCode(statusCode);

  switch (true) {
    case statusCode === 400:
      return new ValidationError(message ?? defaultMessage, { statusCode });
    case statusCode === 401:
      return new AuthenticationError(message ?? defaultMessage, { statusCode });
    case statusCode === 403:
      return new AuthorizationError(message ?? defaultMessage, { statusCode });
    case statusCode === 404:
      return new NotFoundError(message ?? defaultMessage, { statusCode });
    case statusCode === 409:
      return new ConflictError(message ?? defaultMessage, { statusCode });
    case statusCode === 429:
      return new RateLimitError(message ?? defaultMessage, { statusCode });
    case statusCode >= 500:
      return new InternalError(message ?? defaultMessage, { statusCode });
    default:
      return new QmxError(message ?? defaultMessage, { statusCode });
  }
}

/**
 * Get default message for HTTP status code
 */
export function getMessageForStatusCode(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not found',
    409: 'Conflict',
    429: 'Too many requests',
    500: 'Internal server error',
    502: 'Bad gateway',
    503: 'Service unavailable',
    504: 'Gateway timeout',
  };
  return messages[statusCode] ?? `HTTP error ${statusCode}`;
}

/**
 * Error handler registry
 */
export class ErrorHandlerRegistry {
  private handlers: Map<ErrorCategory | string, Set<ErrorHandler>> = new Map();
  private defaultHandlers: Set<ErrorHandler> = new Set();

  /**
   * Register handler for specific category
   */
  register(category: ErrorCategory | string, handler: ErrorHandler): void {
    if (!this.handlers.has(category)) {
      this.handlers.set(category, new Set());
    }
    this.handlers.get(category)!.add(handler);
  }

  /**
   * Register default handler
   */
  registerDefault(handler: ErrorHandler): void {
    this.defaultHandlers.add(handler);
  }

  /**
   * Unregister handler
   */
  unregister(category: ErrorCategory | string, handler: ErrorHandler): boolean {
    const handlers = this.handlers.get(category);
    if (handlers) {
      return handlers.delete(handler);
    }
    return false;
  }

  /**
   * Handle error
   */
  async handle(error: QmxError): Promise<void> {
    const handlers = [
      ...(this.handlers.get(error.category) ?? []),
      ...this.defaultHandlers,
    ];

    for (const handler of handlers) {
      try {
        await handler(error);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }
  }
}

/**
 * Create retry strategy for error
 */
export function createRetryStrategy(error: QmxError): ErrorRecoveryStrategy {
  const defaultStrategy: ErrorRecoveryStrategy = {
    retry: false,
    delay: 0,
    maxRetries: 0,
    backoffMultiplier: 2,
  };

  if (!error.isRetryable()) {
    return defaultStrategy;
  }

  const retryAfter = error.getRetryAfter() ?? 1000;

  return {
    retry: true,
    delay: retryAfter,
    maxRetries: 3,
    backoffMultiplier: 2,
  };
}

/**
 * Check if error should be retried
 */
export function shouldRetry(error: unknown, attempt: number, maxRetries: number = 3): boolean {
  if (attempt >= maxRetries) {
    return false;
  }

  if (error instanceof QmxError) {
    return error.isRetryable();
  }

  // Retry on network errors
  if (error instanceof Error) {
    const networkErrors = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'];
    return networkErrors.some(code => (error as NodeJS.ErrnoException).code === code);
  }

  return false;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(
  error: unknown,
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const multiplier = error instanceof QmxError && error.context.retryAfter
    ? error.context.retryAfter / baseDelay
    : Math.pow(2, attempt);

  const delay = baseDelay * multiplier;
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter

  return Math.min(delay + jitter, maxDelay);
}

/**
 * Format error for display
 */
export function formatError(error: unknown, verbose: boolean = false): string {
  if (error instanceof QmxError) {
    if (verbose) {
      return error.getDeveloperMessage();
    }
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return verbose ? `${error.name}: ${error.message}\n${error.stack}` : error.message;
  }

  return String(error);
}

/**
 * Log error with context
 */
export function logError(
  error: unknown,
  context?: { component?: string; operation?: string },
  logger?: { error: (...args: any[]) => void }
): void {
  const log = logger?.error ?? console.error;
  const qmxError = error instanceof QmxError ? error : new QmxError(getErrorMessage(error));

  if (context) {
    qmxError.context.component = context.component;
    qmxError.context.operation = context.operation;
  }

  log(qmxError.getDeveloperMessage());

  if (qmxError.context.details) {
    log('Details:', qmxError.context.details);
  }

  if (qmxError.stack) {
    log('Stack:', qmxError.stack);
  }
}

/**
 * Create error boundary for async operations
 */
export async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  options?: {
    onError?: (error: QmxError) => void;
    fallback?: T;
    rethrow?: boolean;
  }
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const qmxError = error instanceof QmxError
      ? error
      : new QmxError(getErrorMessage(error), { cause: error });

    options?.onError?.(qmxError);

    if (options?.rethrow !== false) {
      throw qmxError;
    }

    return options?.fallback;
  }
}

/**
 * Create error boundary for sync operations
 */
export function withErrorBoundarySync<T>(
  fn: () => T,
  options?: {
    onError?: (error: QmxError) => void;
    fallback?: T;
    rethrow?: boolean;
  }
): T | undefined {
  try {
    return fn();
  } catch (error) {
    const qmxError = error instanceof QmxError
      ? error
      : new QmxError(getErrorMessage(error), { cause: error });

    options?.onError?.(qmxError);

    if (options?.rethrow !== false) {
      throw qmxError;
    }

    return options?.fallback;
  }
}

/**
 * Aggregate multiple errors
 */
export class AggregateError extends QmxError {
  public readonly errors: unknown[];

  constructor(errors: unknown[], message: string = 'Multiple errors occurred', options?: ErrorOptions) {
    super(message, {
      ...options,
      context: {
        ...options?.context,
        category: 'internal',
        severity: 'critical',
        details: { ...options?.context?.details, errorCount: errors.length },
      },
    });

    this.errors = errors;
    this.name = 'AggregateError';
  }

  serialize(): SerializedError {
    return {
      ...super.serialize(),
      context: {
        ...this.context,
        details: {
          ...this.context.details,
          errors: this.errors.map(e => serializeError(e)),
        },
      },
    };
  }
}

/**
 * Create aggregate error from multiple errors
 */
export function aggregateErrors(errors: unknown[], message?: string): AggregateError {
  return new AggregateError(errors, message);
}
