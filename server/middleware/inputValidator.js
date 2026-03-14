/**
 * Server-Side Input Validator Middleware
 * Validates and sanitizes incoming request data to prevent XSS and injection attacks
 */

// Security regex patterns
const SECURITY_PATTERNS = {
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  HTML_TAG: /<[^>]*>/g,
  JAVASCRIPT_PROTOCOL: /javascript:/gi,
  EVENT_HANDLER: /\bon\w+\s*=/gi,
  DATA_PROTOCOL: /data:text\/html/gi,
  EVAL_PATTERNS: /\b(eval|Function|setTimeout|setInterval)\s*\(/gi,
  IFRAME_TAG: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  OBJECT_EMBED_TAG: /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)|(-{2})|(\bOR\b.*=.*)|(\bAND\b.*=.*)/gi,
  CSS_EXPRESSION: /expression\s*\(/gi,
  VBSCRIPT_PROTOCOL: /vbscript:/gi,
  IMPORT_STATEMENT: /\bimport\s+/gi,
};

/**
 * Detect security threats in input
 */
const detectThreats = (input) => {
  if (!input || typeof input !== 'string') {
    return { isValid: true, threats: [] };
  }

  const threats = [];

  if (SECURITY_PATTERNS.SCRIPT_TAG.test(input)) {
    threats.push('Script tag detected');
  }
  if (SECURITY_PATTERNS.JAVASCRIPT_PROTOCOL.test(input)) {
    threats.push('JavaScript protocol detected');
  }
  if (SECURITY_PATTERNS.EVENT_HANDLER.test(input)) {
    threats.push('Event handler detected');
  }
  if (SECURITY_PATTERNS.DATA_PROTOCOL.test(input)) {
    threats.push('Data protocol detected');
  }
  if (SECURITY_PATTERNS.EVAL_PATTERNS.test(input)) {
    threats.push('Eval or Function constructor detected');
  }
  if (SECURITY_PATTERNS.IFRAME_TAG.test(input)) {
    threats.push('Iframe tag detected');
  }
  if (SECURITY_PATTERNS.OBJECT_EMBED_TAG.test(input)) {
    threats.push('Object/Embed tag detected');
  }
  if (SECURITY_PATTERNS.CSS_EXPRESSION.test(input)) {
    threats.push('CSS expression detected');
  }
  if (SECURITY_PATTERNS.VBSCRIPT_PROTOCOL.test(input)) {
    threats.push('VBScript protocol detected');
  }
  if (SECURITY_PATTERNS.SQL_INJECTION.test(input)) {
    threats.push('SQL Injection detected')
  }

  return {
    isValid: threats.length === 0,
    threats
  };
};

/**
 * Sanitize input string
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return input;
  }

  let sanitized = input;

  // Remove dangerous patterns
  sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAG, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.IFRAME_TAG, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.OBJECT_EMBED_TAG, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.EVENT_HANDLER, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.JAVASCRIPT_PROTOCOL, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.VBSCRIPT_PROTOCOL, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.DATA_PROTOCOL, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.EVAL_PATTERNS, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.CSS_EXPRESSION, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAG, '');
  sanitized = sanitized.replace(SECURITY_PATTERNS.IMPORT_STATEMENT, '');

  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized.trim();
};

/**
 * Recursively validate and sanitize object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};
  const errors = {};
  let hasErrors = false;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const { isValid, threats } = detectThreats(value);
      
      if (!isValid) {
        hasErrors = true;
        errors[key] = threats;
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      const result = sanitizeObject(value);
      sanitized[key] = result.sanitized;
      if (result.hasErrors) {
        hasErrors = true;
        errors[key] = result.errors;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return { sanitized, errors, hasErrors };
};

/**
 * Middleware to validate request body
 */
const validateRequestBody = (options = {}) => {
  const {
    blockMalicious = true,  // Block request if malicious input found
    sanitizeAuto = true,    // Auto-sanitize input
    logThreats = true       // Log security threats
  } = options;

  return (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return next();
    }

    const result = sanitizeObject(req.body);

    if (result.hasErrors) {
      if (logThreats) {
        console.warn('Security threats detected in request:', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          errors: result.errors,
          timestamp: new Date().toISOString()
        });
      }

      if (blockMalicious) {
        return res.status(400).json({
          success: false,
          message: 'Input tidak valid. Terdeteksi konten berbahaya.',
          errors: result.errors
        });
      }
    }

    if (sanitizeAuto) {
      req.body = result.sanitized;
      req.sanitizationApplied = result.hasErrors;
    }

    next();
  };
};

/**
 * Middleware to validate query parameters
 */
const validateQueryParams = (options = {}) => {
  const {
    blockMalicious = true,
    sanitizeAuto = true,
    logThreats = true
  } = options;

  return (req, res, next) => {
    if (!req.query || Object.keys(req.query).length === 0) {
      return next();
    }

    const result = sanitizeObject(req.query);

    if (result.hasErrors) {
      if (logThreats) {
        console.warn('Security threats detected in query params:', {
          ip: req.ip,
          path: req.path,
          errors: result.errors,
          timestamp: new Date().toISOString()
        });
      }

      if (blockMalicious) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter tidak valid',
          errors: result.errors
        });
      }
    }

    if (sanitizeAuto) {
      req.query = result.sanitized;
    }

    next();
  };
};

/**
 * Middleware to validate all request inputs
 */
const validateAllInputs = (options = {}) => {
  return (req, res, next) => {
    // Validate body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyResult = sanitizeObject(req.body);
      if (bodyResult.hasErrors && options.blockMalicious !== false) {
        return res.status(400).json({
          success: false,
          message: 'Input Anda mengandung konten berbahaya',
          errors: bodyResult.errors
        });
      }
      req.body = bodyResult.sanitized;
    }

    // Validate query
    if (req.query && Object.keys(req.query).length > 0) {
      const queryResult = sanitizeObject(req.query);
      if (queryResult.hasErrors && options.blockMalicious !== false) {
        return res.status(400).json({
          success: false,
          message: 'Query parameters mengandung konten berbahaya',
          errors: queryResult.errors
        });
      }
      req.query = queryResult.sanitized;
    }

    // Validate params
    if (req.params && Object.keys(req.params).length > 0) {
      const paramsResult = sanitizeObject(req.params);
      if (paramsResult.hasErrors && options.blockMalicious !== false) {
        return res.status(400).json({
          success: false,
          message: 'URL parameters mengandung konten berbahaya',
          errors: paramsResult.errors
        });
      }
      req.params = paramsResult.sanitized;
    }

    next();
  };
};

module.exports = {
  detectThreats,
  sanitizeInput,
  sanitizeObject,
  validateRequestBody,
  validateQueryParams,
  validateAllInputs,
  SECURITY_PATTERNS
};
