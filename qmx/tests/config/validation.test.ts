/**
 * Tests for Config Validation
 */

import { describe, it, expect } from 'vitest';

describe('Config Validation', () => {
  describe('Schema Validation', () => {
    it('should validate configuration schema', () => {
      const validateSchema = (config: Record<string, any>): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!config.version) {
          errors.push('version is required');
        }
        if (!config.projectRoot) {
          errors.push('projectRoot is required');
        }
        if (config.settings && typeof config.settings !== 'object') {
          errors.push('settings must be an object');
        }

        return { valid: errors.length === 0, errors };
      };

      const validConfig = { version: '1.0.0', projectRoot: '/path', settings: {} };
      const invalidConfig = { version: '1.0.0' };

      expect(validateSchema(validConfig).valid).toBe(true);
      expect(validateSchema(invalidConfig).errors).toContain('projectRoot is required');
    });

    it('should validate nested objects', () => {
      const validateNested = (config: Record<string, any>): string[] => {
        const errors: string[] = [];

        if (config.skills) {
          for (const [name, skill] of Object.entries(config.skills)) {
            if (typeof skill !== 'object' || skill === null) {
              errors.push(`Skill "${name}" must be an object`);
            }
          }
        }

        return errors;
      };

      const valid = { skills: { plan: { enabled: true } } };
      const invalid = { skills: { plan: 'invalid' } };

      expect(validateNested(valid)).toHaveLength(0);
      expect(validateNested(invalid)).toContain('must be an object');
    });
  });

  describe('Type Validation', () => {
    it('should validate string types', () => {
      const validateString = (value: any, fieldName: string): string | null => {
        if (typeof value !== 'string') {
          return `${fieldName} must be a string`;
        }
        return null;
      };

      expect(validateString('hello', 'name')).toBeNull();
      expect(validateString(123, 'name')).toContain('must be a string');
    });

    it('should validate number types', () => {
      const validateNumber = (value: any, fieldName: string): string | null => {
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldName} must be a number`;
        }
        return null;
      };

      expect(validateNumber(42, 'count')).toBeNull();
      expect(validateNumber('42', 'count')).toContain('must be a number');
    });

    it('should validate boolean types', () => {
      const validateBoolean = (value: any, fieldName: string): string | null => {
        if (typeof value !== 'boolean') {
          return `${fieldName} must be a boolean`;
        }
        return null;
      };

      expect(validateBoolean(true, 'enabled')).toBeNull();
      expect(validateBoolean('true', 'enabled')).toContain('must be a boolean');
    });

    it('should validate array types', () => {
      const validateArray = (value: any, fieldName: string): string | null => {
        if (!Array.isArray(value)) {
          return `${fieldName} must be an array`;
        }
        return null;
      };

      expect(validateArray([1, 2, 3], 'items')).toBeNull();
      expect(validateArray('not-array', 'items')).toContain('must be an array');
    });

    it('should validate object types', () => {
      const validateObject = (value: any, fieldName: string): string | null => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${fieldName} must be an object`;
        }
        return null;
      };

      expect(validateObject({ key: 'value' }, 'config')).toBeNull();
      expect(validateObject([], 'config')).toContain('must be an object');
    });
  });

  describe('Range Validation', () => {
    it('should validate number ranges', () => {
      const validateRange = (
        value: number,
        fieldName: string,
        min: number,
        max: number
      ): string | null => {
        if (value < min || value > max) {
          return `${fieldName} must be between ${min} and ${max}`;
        }
        return null;
      };

      expect(validateRange(5, 'priority', 1, 10)).toBeNull();
      expect(validateRange(0, 'priority', 1, 10)).toContain('between');
      expect(validateRange(11, 'priority', 1, 10)).toContain('between');
    });

    it('should validate string length', () => {
      const validateLength = (
        value: string,
        fieldName: string,
        min: number,
        max: number
      ): string | null => {
        if (value.length < min || value.length > max) {
          return `${fieldName} must be between ${min} and ${max} characters`;
        }
        return null;
      };

      expect(validateLength('hello', 'name', 1, 50)).toBeNull();
      expect(validateLength('', 'name', 1, 50)).toContain('between');
    });
  });

  describe('Enum Validation', () => {
    it('should validate enum values', () => {
      const validValues = ['low', 'medium', 'high', 'xhigh'];

      const validateEnum = (value: any, fieldName: string, allowed: string[]): string | null => {
        if (!allowed.includes(value)) {
          return `${fieldName} must be one of: ${allowed.join(', ')}`;
        }
        return null;
      };

      expect(validateEnum('high', 'effort', validValues)).toBeNull();
      expect(validateEnum('invalid', 'effort', validValues)).toContain('must be one of');
    });

    it('should validate status enums', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];

      const validateStatus = (status: string): boolean => {
        return validStatuses.includes(status);
      };

      expect(validateStatus('completed')).toBe(true);
      expect(validateStatus('unknown')).toBe(false);
    });
  });

  describe('Pattern Validation', () => {
    it('should validate string patterns', () => {
      const validatePattern = (
        value: string,
        fieldName: string,
        pattern: RegExp
      ): string | null => {
        if (!pattern.test(value)) {
          return `${fieldName} has invalid format`;
        }
        return null;
      };

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(validatePattern('test@example.com', 'email', emailPattern)).toBeNull();
      expect(validatePattern('invalid', 'email', emailPattern)).toContain('invalid format');
    });

    it('should validate semver format', () => {
      const semverPattern = /^\d+\.\d+\.\d+$/;

      const validateSemver = (version: string): boolean => {
        return semverPattern.test(version);
      };

      expect(validateSemver('1.0.0')).toBe(true);
      expect(validateSemver('1.0')).toBe(false);
      expect(validateSemver('invalid')).toBe(false);
    });
  });

  describe('Required Field Validation', () => {
    it('should check required fields', () => {
      const requiredFields = ['version', 'projectRoot', 'generatedAt'];

      const validateRequired = (
        config: Record<string, any>,
        fields: string[]
      ): string[] => {
        return fields.filter(field => !(field in config));
      };

      const config = { version: '1.0.0', projectRoot: '/path' };
      const missing = validateRequired(config, requiredFields);

      expect(missing).toHaveLength(1);
      expect(missing).toContain('generatedAt');
    });

    it('should check conditionally required fields', () => {
      const validateConditional = (config: Record<string, any>): string[] => {
        const errors: string[] = [];

        if (config.mcpServers && typeof config.mcpServers === 'object') {
          for (const [name, server] of Object.entries(config.mcpServers)) {
            const serverConfig = server as any;
            if (!serverConfig.command) {
              errors.push(`MCP server "${name}" requires command`);
            }
          }
        }

        return errors;
      };

      const valid = { mcpServers: { 'qmx-state': { command: 'node' } } };
      const invalid = { mcpServers: { 'qmx-state': {} } };

      expect(validateConditional(valid)).toHaveLength(0);
      expect(validateConditional(invalid)).toContain('requires command');
    });
  });

  describe('Cross-Field Validation', () => {
    it('should validate dependent fields', () => {
      const validateDependent = (config: Record<string, any>): string[] => {
        const errors: string[] = [];

        if (config.modes && Array.isArray(config.modes)) {
          for (const mode of config.modes) {
            if (mode.skills && mode.skills.length > 0) {
              // Check that referenced skills exist
              if (!config.skills) {
                errors.push('Skills must be defined when modes reference them');
              }
            }
          }
        }

        return errors;
      };

      const valid = {
        modes: [{ name: 'dev', skills: ['plan'] }],
        skills: { plan: {} },
      };
      const invalid = {
        modes: [{ name: 'dev', skills: ['plan'] }],
      };

      expect(validateDependent(valid)).toHaveLength(0);
      expect(validateDependent(invalid)).toContain('Skills must be defined');
    });

    it('should validate consistency between fields', () => {
      const validateConsistency = (config: Record<string, any>): string[] => {
        const errors: string[] = [];

        if (config.settings?.maxContextTokens && config.settings?.maxContextTokens < 1024) {
          errors.push('maxContextTokens should be at least 1024');
        }

        return errors;
      };

      const valid = { settings: { maxContextTokens: 8192 } };
      const invalid = { settings: { maxContextTokens: 512 } };

      expect(validateConsistency(valid)).toHaveLength(0);
      expect(validateConsistency(invalid)).toContain('at least 1024');
    });
  });

  describe('Warning Generation', () => {
    it('should generate warnings for non-critical issues', () => {
      const generateWarnings = (config: Record<string, any>): string[] => {
        const warnings: string[] = [];

        if (!config.metadata) {
          warnings.push('No metadata provided');
        }

        if (config.skills && Object.keys(config.skills).length === 0) {
          warnings.push('No skills configured');
        }

        return warnings;
      };

      const config = { version: '1.0.0', projectRoot: '/path' };
      const warnings = generateWarnings(config);

      expect(warnings).toContain('No metadata provided');
    });

    it('should warn about deprecated fields', () => {
      const checkDeprecated = (config: Record<string, any>): string[] => {
        const warnings: string[] = [];
        const deprecatedFields = ['oldSetting', 'legacyMode'];

        for (const field of deprecatedFields) {
          if (field in config) {
            warnings.push(`Field "${field}" is deprecated`);
          }
        }

        return warnings;
      };

      const config = { oldSetting: 'value', newSetting: 'value' };
      const warnings = checkDeprecated(config);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('deprecated');
    });
  });

  describe('Validation Result', () => {
    it('should return validation result with errors and warnings', () => {
      const validate = (config: Record<string, any>): {
        valid: boolean;
        errors: string[];
        warnings: string[];
      } => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!config.version) errors.push('version required');
        if (!config.metadata) warnings.push('no metadata');

        return {
          valid: errors.length === 0,
          errors,
          warnings,
        };
      };

      const result = validate({ version: '1.0.0' });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
    });
  });
});
