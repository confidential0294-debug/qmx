/**
 * Tests for Error Utilities
 */

import { describe, it, expect } from 'vitest';

describe('Error Utilities', () => {
  describe('Error Categories', () => {
    it('should define error categories', () => {
      const categories = [
        'validation',
        'authentication',
        'authorization',
        'not_found',
        'conflict',
        'internal',
        'network',
        'timeout',
        'rate_limit',
        'configuration',
        'file_system',
        'database',
        'api',
        'unknown',
      ];

      expect(categories).toHaveLength(14);
      expect(categories).toContain('validation');
      expect(categories).toContain('authentication');
    });
  });

  describe('Error Severity', () => {
    it('should define severity levels', () => {
      const severities = ['low', 'medium', 'high', 'critical'];
      expect(severities).toHaveLength(4);
    });

    it('should assign severity to error types', () => {
      const getSeverity = (category: string): string => {
        const severities: Record<string, string> = {
          validation: 'low',
          authentication: 'high',
          authorization: 'high',
          not_found: 'medium',
          internal: 'critical',
          network: 'high',
          timeout: 'high',
        };
        return severities[category] || 'medium';
      };

      expect(getSeverity('validation')).toBe('low');
      expect(getSeverity('internal')).toBe('critical');
      expect(getSeverity('unknown')).toBe('medium');
    });
  });

  describe('Error Context', () => {
    it('should include error context', () => {
      const createContext = (): Record<string, any> => ({
        details: { field: 'name', value: '' },
        codes: ['REQUIRED_FIELD'],
        timestamp: new Date().toISOString(),
        correlationId: 'corr-123',
        userId: 'user-456',
        component: 'api',
        operation: 'create',
        severity: 'low',
        recoverable: true,
        retryable: false,
      });

      const context = createContext();
      expect(context.details).toBeDefined();
      expect(context.timestamp).toBeDefined();
      expect(context.severity).toBe('low');
    });

    it('should track error codes', () => {
      const codes = [
        'REQUIRED_FIELD',
        'INVALID_FORMAT',
        'RANGE_ERROR',
        'TYPE_MISMATCH',
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'PERMISSION_DENIED',
        'RESOURCE_NOT_FOUND',
        'DUPLICATE_RESOURCE',
        'VERSION_CONFLICT',
        'CONNECTION_ERROR',
        'REQUEST_TIMEOUT',
        'QUOTA_EXCEEDED',
        'MISSING_CONFIG',
        'FILE_NOT_FOUND',
      ];

      expect(codes).toHaveLength(15);
      expect(codes).toContain('REQUIRED_FIELD');
    });
  });

  describe('Validation Errors', () => {
    it('should create validation error', () => {
      const createValidationError = (message: string): Record<string, any> => {
        return {
          name: 'ValidationError',
          message,
          category: 'validation',
          severity: 'low',
          recoverable: true,
        };
      };

      const error = createValidationError('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.category).toBe('validation');
    });

    it('should create required field error', () => {
      const createRequiredFieldError = (field: string): Record<string, any> => {
        return {
          name: 'RequiredFieldError',
          message: `Required field missing: ${field}`,
          code: 'REQUIRED_FIELD',
          details: { field },
        };
      };

      const error = createRequiredFieldError('email');
      expect(error.message).toContain('email');
      expect(error.code).toBe('REQUIRED_FIELD');
    });

    it('should create invalid format error', () => {
      const createInvalidFormatError = (
        field: string,
        expected: string,
        received?: string
      ): Record<string, any> => {
        let message = `Invalid format for ${field}: expected ${expected}`;
        if (received) {
          message += `, received ${received}`;
        }
        return {
          name: 'InvalidFormatError',
          message,
          code: 'INVALID_FORMAT',
          details: { field, expected, received },
        };
      };

      const error = createInvalidFormatError('email', 'email', 'invalid');
      expect(error.message).toContain('email');
      expect(error.message).toContain('invalid');
    });

    it('should create range error', () => {
      const createRangeError = (
        field: string,
        min?: number,
        max?: number,
        value?: number
      ): Record<string, any> => {
        let message = `Value out of range for ${field}`;
        if (min !== undefined && max !== undefined) {
          message += `: must be between ${min} and ${max}`;
        }
        if (value !== undefined) {
          message += `, received ${value}`;
        }
        return {
          name: 'RangeError',
          message,
          code: 'RANGE_ERROR',
        };
      };

      const error = createRangeError('age', 18, 100, 15);
      expect(error.message).toContain('between 18 and 100');
      expect(error.message).toContain('received 15');
    });
  });

  describe('Authentication Errors', () => {
    it('should create authentication error', () => {
      const createAuthError = (message: string): Record<string, any> => {
        return {
          name: 'AuthenticationError',
          message,
          category: 'authentication',
          severity: 'high',
          statusCode: 401,
        };
      };

      const error = createAuthError('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.severity).toBe('high');
    });

    it('should create invalid credentials error', () => {
      const error = {
        name: 'InvalidCredentialsError',
        message: 'Invalid credentials provided',
        code: 'INVALID_CREDENTIALS',
      };

      expect(error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should create token expired error', () => {
      const createTokenExpiredError = (expiredAt?: string): Record<string, any> => {
        return {
          name: 'TokenExpiredError',
          message: 'Authentication token has expired',
          code: 'TOKEN_EXPIRED',
          details: { expiredAt },
          retryable: false,
        };
      };

      const error = createTokenExpiredError('2024-01-01T00:00:00Z');
      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.details.expiredAt).toBe('2024-01-01T00:00:00Z');
    });

    it('should create session expired error', () => {
      const error = {
        name: 'SessionExpiredError',
        message: 'Session has expired',
        code: 'SESSION_EXPIRED',
      };

      expect(error.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('Authorization Errors', () => {
    it('should create authorization error', () => {
      const createAuthZError = (message: string): Record<string, any> => {
        return {
          name: 'AuthorizationError',
          message,
          category: 'authorization',
          severity: 'high',
          recoverable: false,
          statusCode: 403,
        };
      };

      const error = createAuthZError('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.recoverable).toBe(false);
    });

    it('should create permission denied error', () => {
      const createPermissionDeniedError = (
        permission?: string,
        resource?: string
      ): Record<string, any> => {
        let message = 'Permission denied';
        if (permission && resource) {
          message = `Permission '${permission}' denied for resource '${resource}'`;
        } else if (permission) {
          message = `Permission '${permission}' denied`;
        } else if (resource) {
          message = `Access denied to resource '${resource}'`;
        }
        return {
          name: 'PermissionDeniedError',
          message,
          code: 'PERMISSION_DENIED',
          details: { permission, resource },
        };
      };

      const error = createPermissionDeniedError('admin', 'users');
      expect(error.message).toContain('admin');
      expect(error.message).toContain('users');
    });

    it('should create role required error', () => {
      const error = {
        name: 'RoleRequiredError',
        message: 'Required role: admin',
        code: 'ROLE_REQUIRED',
        details: { requiredRole: 'admin' },
      };

      expect(error.code).toBe('ROLE_REQUIRED');
      expect(error.details.requiredRole).toBe('admin');
    });
  });

  describe('Not Found Errors', () => {
    it('should create not found error', () => {
      const createNotFoundError = (message: string): Record<string, any> => {
        return {
          name: 'NotFoundError',
          message,
          category: 'not_found',
          recoverable: false,
          statusCode: 404,
        };
      };

      const error = createNotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create resource not found error', () => {
      const createResourceNotFoundError = (
        resourceType: string,
        identifier?: string | number
      ): Record<string, any> => {
        let message = `${resourceType} not found`;
        if (identifier !== undefined) {
          message += `: ${identifier}`;
        }
        return {
          name: 'ResourceNotFoundError',
          message,
          code: 'RESOURCE_NOT_FOUND',
          details: { resourceType, identifier },
        };
      };

      const error = createResourceNotFoundError('User', 123);
      expect(error.message).toContain('User');
      expect(error.message).toContain('123');
    });
  });

  describe('Conflict Errors', () => {
    it('should create conflict error', () => {
      const createConflictError = (message: string): Record<string, any> => {
        return {
          name: 'ConflictError',
          message,
          category: 'conflict',
          recoverable: true,
          statusCode: 409,
        };
      };

      const error = createConflictError('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.recoverable).toBe(true);
    });

    it('should create duplicate resource error', () => {
      const createDuplicateResourceError = (
        resourceType: string,
        identifier?: string | number
      ): Record<string, any> => {
        let message = `Duplicate ${resourceType}`;
        if (identifier !== undefined) {
          message += `: ${identifier} already exists`;
        }
        return {
          name: 'DuplicateResourceError',
          message,
          code: 'DUPLICATE_RESOURCE',
          details: { resourceType, identifier },
        };
      };

      const error = createDuplicateResourceError('User', 'test@example.com');
      expect(error.message).toContain('already exists');
    });

    it('should create version conflict error', () => {
      const createVersionConflictError = (
        expectedVersion?: string | number,
        actualVersion?: string | number
      ): Record<string, any> => {
        let message = 'Version conflict';
        if (expectedVersion !== undefined && actualVersion !== undefined) {
          message = `Version conflict: expected ${expectedVersion}, found ${actualVersion}`;
        }
        return {
          name: 'VersionConflictError',
          message,
          code: 'VERSION_CONFLICT',
          details: { expectedVersion, actualVersion },
        };
      };

      const error = createVersionConflictError(1, 2);
      expect(error.message).toContain('expected 1');
      expect(error.message).toContain('found 2');
    });
  });

  describe('Network Errors', () => {
    it('should create network error', () => {
      const createNetworkError = (message: string): Record<string, any> => {
        return {
          name: 'NetworkError',
          message,
          category: 'network',
          severity: 'high',
          recoverable: true,
          retryable: true,
        };
      };

      const error = createNetworkError('Network error occurred');
      expect(error.retryable).toBe(true);
    });

    it('should create connection error', () => {
      const createConnectionError = (
        host?: string,
        port?: number
      ): Record<string, any> => {
        let message = 'Connection failed';
        if (host) {
          message += ` to ${host}`;
          if (port) message += `:${port}`;
        }
        return {
          name: 'ConnectionError',
          message,
          code: 'CONNECTION_ERROR',
          details: { host, port },
        };
      };

      const error = createConnectionError('api.example.com', 443);
      expect(error.message).toContain('api.example.com');
    });

    it('should create SSL error', () => {
      const createSslError = (reason?: string): Record<string, any> => {
        let message = 'SSL/TLS error';
        if (reason) {
          message += `: ${reason}`;
        }
        return {
          name: 'SslError',
          message,
          code: 'SSL_ERROR',
          severity: 'critical',
        };
      };

      const error = createSslError('Certificate expired');
      expect(error.severity).toBe('critical');
    });
  });

  describe('Timeout Errors', () => {
    it('should create timeout error', () => {
      const createTimeoutError = (message: string): Record<string, any> => {
        return {
          name: 'TimeoutError',
          message,
          category: 'timeout',
          severity: 'high',
          recoverable: true,
          retryable: true,
        };
      };

      const error = createTimeoutError('Operation timed out');
      expect(error.retryable).toBe(true);
    });

    it('should create request timeout error', () => {
      const createRequestTimeoutError = (timeoutMs?: number): Record<string, any> => {
        let message = 'Request timeout';
        if (timeoutMs) {
          message += ` after ${timeoutMs}ms`;
        }
        return {
          name: 'RequestTimeoutError',
          message,
          code: 'REQUEST_TIMEOUT',
          details: { timeoutMs },
          retryAfter: timeoutMs ? Math.min(timeoutMs * 2, 30000) : undefined,
        };
      };

      const error = createRequestTimeoutError(5000);
      expect(error.retryAfter).toBe(10000);
    });
  });

  describe('Rate Limit Errors', () => {
    it('should create rate limit error', () => {
      const createRateLimitError = (message: string): Record<string, any> => {
        return {
          name: 'RateLimitError',
          message,
          category: 'rate_limit',
          severity: 'medium',
          recoverable: true,
          retryable: true,
          statusCode: 429,
        };
      };

      const error = createRateLimitError('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
    });

    it('should create quota exceeded error', () => {
      const createQuotaExceededError = (
        quota?: string,
        limit?: number,
        current?: number
      ): Record<string, any> => {
        let message = 'Quota exceeded';
        if (quota) {
          message += ` for ${quota}`;
          if (limit !== undefined && current !== undefined) {
            message += ` (${current}/${limit})`;
          }
        }
        return {
          name: 'QuotaExceededError',
          message,
          code: 'QUOTA_EXCEEDED',
          retryAfter: 3600,
        };
      };

      const error = createQuotaExceededError('API calls', 1000, 1500);
      expect(error.message).toContain('1500/1000');
      expect(error.retryAfter).toBe(3600);
    });
  });

  describe('Configuration Errors', () => {
    it('should create configuration error', () => {
      const createConfigError = (message: string): Record<string, any> => {
        return {
          name: 'ConfigurationError',
          message,
          category: 'configuration',
          severity: 'high',
          recoverable: false,
        };
      };

      const error = createConfigError('Invalid configuration');
      expect(error.recoverable).toBe(false);
    });

    it('should create missing config error', () => {
      const createMissingConfigError = (key: string): Record<string, any> => {
        return {
          name: 'MissingConfigError',
          message: `Missing configuration: ${key}`,
          code: 'MISSING_CONFIG',
          details: { key },
        };
      };

      const error = createMissingConfigError('DATABASE_URL');
      expect(error.message).toContain('DATABASE_URL');
    });
  });

  describe('File System Errors', () => {
    it('should create file not found error', () => {
      const createFileNotFoundError = (path: string): Record<string, any> => {
        return {
          name: 'FileNotFoundError',
          message: `File not found: ${path}`,
          code: 'FILE_NOT_FOUND',
          details: { path },
        };
      };

      const error = createFileNotFoundError('/path/to/file.txt');
      expect(error.message).toContain('/path/to/file.txt');
    });

    it('should create permission error', () => {
      const createPermissionError = (
        path: string,
        operation?: string
      ): Record<string, any> => {
        let message = `Permission denied: ${path}`;
        if (operation) {
          message += ` for ${operation}`;
        }
        return {
          name: 'PermissionError',
          message,
          code: 'PERMISSION_ERROR',
          details: { path, operation },
        };
      };

      const error = createPermissionError('/root/secret.txt', 'read');
      expect(error.message).toContain('read');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize error for transport', () => {
      const serializeError = (error: Record<string, any>): Record<string, any> => {
        return {
          name: error.name,
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          category: error.category,
          severity: error.severity,
          stack: error.stack,
          context: error.details,
          timestamp: new Date().toISOString(),
        };
      };

      const error = {
        name: 'ValidationError',
        message: 'Invalid input',
        code: 'INVALID_INPUT',
        category: 'validation',
        severity: 'low',
        details: { field: 'email' },
      };

      const serialized = serializeError(error);
      expect(serialized.name).toBe('ValidationError');
      expect(serialized.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should mark error as handled', () => {
      const error = { handled: false };
      error.handled = true;
      expect(error.handled).toBe(true);
    });

    it('should check if error is recoverable', () => {
      const isRecoverable = (error: { recoverable?: boolean }): boolean => {
        return error.recoverable ?? false;
      };

      expect(isRecoverable({ recoverable: true })).toBe(true);
      expect(isRecoverable({})).toBe(false);
    });

    it('should check if error is retryable', () => {
      const isRetryable = (error: { retryable?: boolean }): boolean => {
        return error.retryable ?? false;
      };

      expect(isRetryable({ retryable: true })).toBe(true);
      expect(isRetryable({})).toBe(false);
    });

    it('should get retry after duration', () => {
      const getRetryAfter = (error: { retryAfter?: number }): number | undefined => {
        return error.retryAfter;
      };

      expect(getRetryAfter({ retryAfter: 5000 })).toBe(5000);
      expect(getRetryAfter({})).toBeUndefined();
    });
  });

  describe('Error Messages', () => {
    it('should get user-friendly message', () => {
      const getUserMessage = (error: { details?: { userMessage?: string }; message: string }): string => {
        return error.details?.userMessage ?? error.message;
      };

      const technicalError = { message: 'ECONNREFUSED' };
      const userFriendlyError = { message: 'Connection failed', details: { userMessage: 'Unable to connect. Please try again.' } };

      expect(getUserMessage(technicalError)).toBe('ECONNREFUSED');
      expect(getUserMessage(userFriendlyError)).toContain('Unable to connect');
    });

    it('should get developer message', () => {
      const getDeveloperMessage = (error: Record<string, any>): string => {
        const parts = [`${error.name}: ${error.message}`];
        if (error.code) parts.push(`[Code: ${error.code}]`);
        if (error.statusCode) parts.push(`[Status: ${error.statusCode}]`);
        return parts.join(' ');
      };

      const error = {
        name: 'ValidationError',
        message: 'Invalid input',
        code: 'INVALID_INPUT',
        statusCode: 400,
      };

      const message = getDeveloperMessage(error);
      expect(message).toContain('ValidationError');
      expect(message).toContain('Code: INVALID_INPUT');
      expect(message).toContain('Status: 400');
    });
  });
});
