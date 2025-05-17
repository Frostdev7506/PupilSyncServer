/**
 * Utility functions for consistent parameter parsing
 */
const paramParser = {
  /**
   * Parse a parameter as an integer
   * @param {any} value - The value to parse
   * @param {number} defaultValue - The default value to return if parsing fails
   * @returns {number|undefined} - The parsed integer or undefined
   */
  parseInteger(value, defaultValue = undefined) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  },
  
  /**
   * Parse a parameter as a float
   * @param {any} value - The value to parse
   * @param {number} defaultValue - The default value to return if parsing fails
   * @returns {number|undefined} - The parsed float or undefined
   */
  parseFloat(value, defaultValue = undefined) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  },
  
  /**
   * Parse a parameter as a boolean
   * @param {any} value - The value to parse
   * @param {boolean} defaultValue - The default value to return if parsing fails
   * @returns {boolean|undefined} - The parsed boolean or undefined
   */
  parseBoolean(value, defaultValue = undefined) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }
    
    return defaultValue;
  },
  
  /**
   * Parse a parameter as a date
   * @param {any} value - The value to parse
   * @param {Date} defaultValue - The default value to return if parsing fails
   * @returns {Date|undefined} - The parsed date or undefined
   */
  parseDate(value, defaultValue = undefined) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? defaultValue : parsed;
  },
  
  /**
   * Parse pagination parameters
   * @param {Object} query - The query object
   * @param {number} defaultLimit - The default limit
   * @param {number} maxLimit - The maximum limit
   * @returns {Object} - The parsed pagination parameters
   */
  parsePagination(query, defaultLimit = 10, maxLimit = 100) {
    const limit = Math.min(
      this.parseInteger(query.limit, defaultLimit),
      maxLimit
    );
    
    const offset = this.parseInteger(query.offset, 0);
    
    return { limit, offset };
  }
};

module.exports = paramParser;
