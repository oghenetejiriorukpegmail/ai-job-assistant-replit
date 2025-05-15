/**
 * Replit Database Adapter
 * 
 * This module provides a MongoDB-like interface to the Replit Database,
 * allowing the application to use Replit Database as a drop-in replacement
 * for MongoDB when running on Replit.
 */

// Utility to generate a random ID similar to MongoDB's ObjectId
function generateId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(16).substring(2, 14).padStart(12, '0');
  return timestamp + randomPart;
}

class ReplitDatabaseAdapter {
  constructor() {
    this.connected = false;
    this.db = null;
    this.collections = {};
  }

  async connect() {
    try {
      // Only import the Replit Database client if we're running on Replit
      if (typeof process !== 'undefined' && process.env.REPL_ID) {
        // Dynamically import the Replit Database client
        const { Database } = await import('@replit/database');
        this.db = new Database();
        this.connected = true;
        console.log('Connected to Replit Database');
        return true;
      } else {
        console.warn('Not running on Replit, Replit Database unavailable');
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to Replit Database:', error);
      return false;
    }
  }

  /**
   * Get a collection-like interface for working with data
   * @param {string} collectionName - Name of the collection
   * @returns {Object} - Collection-like interface
   */
  collection(collectionName) {
    if (!this.connected) {
      throw new Error('Not connected to Replit Database');
    }

    // Create a new collection if it doesn't exist
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new ReplitCollection(this.db, collectionName);
    }

    return this.collections[collectionName];
  }

  isConnected() {
    return this.connected;
  }
}

class ReplitCollection {
  constructor(db, collectionName) {
    this.db = db;
    this.collectionName = collectionName;
    this.prefix = `${collectionName}:`;
  }

  /**
   * Helper to convert between document ID and Replit Database key
   */
  _docToKey(docId) {
    return `${this.prefix}${docId}`;
  }

  /**
   * Helper to extract document ID from Replit Database key
   */
  _keyToDocId(key) {
    return key.substring(this.prefix.length);
  }

  /**
   * Find documents matching a query
   * Note: This is a simplified implementation that loads all docs into memory
   * @param {Object} query - Query object (similar to MongoDB queries)
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(query = {}) {
    try {
      const keys = await this.db.list(this.prefix);
      const documents = [];

      // Fetch all documents in the collection
      for (const key of keys) {
        const doc = await this.db.get(key);
        documents.push(JSON.parse(doc));
      }

      // Apply filter based on query (simplified implementation)
      return documents.filter(doc => {
        for (const [field, value] of Object.entries(query)) {
          // Handle special cases like $in, $gt, etc.
          if (typeof value === 'object' && value !== null) {
            // Handle $in operator
            if (value.$in && Array.isArray(value.$in)) {
              if (!value.$in.includes(doc[field])) return false;
            }
            // Handle $gt operator
            else if (value.$gt !== undefined) {
              if (!(doc[field] > value.$gt)) return false;
            }
            // Handle $gte operator
            else if (value.$gte !== undefined) {
              if (!(doc[field] >= value.$gte)) return false;
            }
            // Handle $lt operator
            else if (value.$lt !== undefined) {
              if (!(doc[field] < value.$lt)) return false;
            }
            // Handle $lte operator
            else if (value.$lte !== undefined) {
              if (!(doc[field] <= value.$lte)) return false;
            }
            // Handle nested objects
            else if (!this._deepEqual(doc[field], value)) {
              return false;
            }
          } 
          // Simple equality check
          else if (doc[field] !== value) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      console.error(`Error finding documents in ${this.collectionName}:`, error);
      return [];
    }
  }

  /**
   * Find a single document matching a query
   * @param {Object} query - Query object
   * @returns {Promise<Object|null>} - Matching document or null
   */
  async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find a document by its ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} - Document or null if not found
   */
  async findById(id) {
    try {
      const key = this._docToKey(id);
      const doc = await this.db.get(key);
      return doc ? JSON.parse(doc) : null;
    } catch (error) {
      console.error(`Error finding document by ID in ${this.collectionName}:`, error);
      return null;
    }
  }

  /**
   * Insert a new document
   * @param {Object} doc - Document to insert
   * @returns {Promise<Object>} - Inserted document with ID
   */
  async insertOne(doc) {
    try {
      // Generate an ID if one doesn't exist
      if (!doc._id) {
        doc._id = generateId();
      }
      // Add created and updated timestamps
      doc.createdAt = doc.createdAt || new Date().toISOString();
      doc.updatedAt = new Date().toISOString();

      const key = this._docToKey(doc._id);
      await this.db.set(key, JSON.stringify(doc));
      return doc;
    } catch (error) {
      console.error(`Error inserting document into ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} update - Update object
   * @returns {Promise<Object|null>} - Updated document or null
   */
  async findByIdAndUpdate(id, update) {
    try {
      const doc = await this.findById(id);
      if (!doc) return null;

      // Handle $set operator
      if (update.$set) {
        Object.assign(doc, update.$set);
      } else {
        // Direct update without $set
        Object.assign(doc, update);
      }

      // Update the updatedAt timestamp
      doc.updatedAt = new Date().toISOString();

      const key = this._docToKey(id);
      await this.db.set(key, JSON.stringify(doc));
      return doc;
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      return null;
    }
  }

  /**
   * Update a document matching a query
   * @param {Object} query - Query to match document
   * @param {Object} update - Update object
   * @returns {Promise<Object|null>} - Updated document or null
   */
  async findOneAndUpdate(query, update) {
    try {
      const doc = await this.findOne(query);
      if (!doc) return null;
      return this.findByIdAndUpdate(doc._id, update);
    } catch (error) {
      console.error(`Error updating document in ${this.collectionName}:`, error);
      return null;
    }
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async findByIdAndDelete(id) {
    try {
      const key = this._docToKey(id);
      const exists = await this.db.get(key);
      if (!exists) return false;

      await this.db.delete(key);
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      return false;
    }
  }

  /**
   * Delete a document matching a query
   * @param {Object} query - Query to match document
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async findOneAndDelete(query) {
    try {
      const doc = await this.findOne(query);
      if (!doc) return false;
      return this.findByIdAndDelete(doc._id);
    } catch (error) {
      console.error(`Error deleting document from ${this.collectionName}:`, error);
      return false;
    }
  }

  /**
   * Deep equality check for objects
   * @private
   */
  _deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this._deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
}

module.exports = new ReplitDatabaseAdapter();
