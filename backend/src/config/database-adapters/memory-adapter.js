/**
 * In-Memory Database Adapter
 * 
 * This module provides a fallback in-memory database when both
 * MongoDB and Replit Database are unavailable.
 */

// Utility to generate a random ID similar to MongoDB's ObjectId
function generateId() {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
  const randomPart = Math.random().toString(16).substring(2, 14).padStart(12, '0');
  return timestamp + randomPart;
}

class InMemoryAdapter {
  constructor() {
    this.connected = true; // Always connected
    this.stores = {}; // Store for each collection
  }

  async connect() {
    console.log('Using in-memory database adapter');
    this.connected = true;
    return true;
  }

  /**
   * Get a collection-like interface
   * @param {string} collectionName - Name of the collection
   * @returns {Object} - Collection-like interface
   */
  collection(collectionName) {
    // Create store if it doesn't exist
    if (!this.stores[collectionName]) {
      this.stores[collectionName] = [];
    }

    return new InMemoryCollection(this.stores[collectionName]);
  }

  isConnected() {
    return this.connected;
  }
}

class InMemoryCollection {
  constructor(store) {
    this.store = store;
  }

  /**
   * Find documents matching a query
   * @param {Object} query - Query object
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(query = {}) {
    // Filter documents based on query
    return this.store.filter(doc => {
      for (const [field, value] of Object.entries(query)) {
        // Handle special operators
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
    return this.store.find(doc => doc._id === id) || null;
  }

  /**
   * Insert a new document
   * @param {Object} doc - Document to insert
   * @returns {Promise<Object>} - Inserted document with ID
   */
  async insertOne(doc) {
    // Generate an ID if one doesn't exist
    if (!doc._id) {
      doc._id = generateId();
    }
    // Add created and updated timestamps
    doc.createdAt = doc.createdAt || new Date().toISOString();
    doc.updatedAt = new Date().toISOString();

    // Add to store
    this.store.push(doc);
    return doc;
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} update - Update object
   * @returns {Promise<Object|null>} - Updated document or null
   */
  async findByIdAndUpdate(id, update) {
    const index = this.store.findIndex(doc => doc._id === id);
    if (index === -1) return null;

    const doc = this.store[index];
    
    // Handle $set operator
    if (update.$set) {
      Object.assign(doc, update.$set);
    } else {
      // Direct update without $set
      Object.assign(doc, update);
    }

    // Update the updatedAt timestamp
    doc.updatedAt = new Date().toISOString();
    
    // Update in store
    this.store[index] = doc;
    return doc;
  }

  /**
   * Update a document matching a query
   * @param {Object} query - Query to match document
   * @param {Object} update - Update object
   * @returns {Promise<Object|null>} - Updated document or null
   */
  async findOneAndUpdate(query, update) {
    const doc = await this.findOne(query);
    if (!doc) return null;
    return this.findByIdAndUpdate(doc._id, update);
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async findByIdAndDelete(id) {
    const index = this.store.findIndex(doc => doc._id === id);
    if (index === -1) return false;

    // Remove from store
    this.store.splice(index, 1);
    return true;
  }

  /**
   * Delete a document matching a query
   * @param {Object} query - Query to match document
   * @returns {Promise<boolean>} - True if deleted, false otherwise
   */
  async findOneAndDelete(query) {
    const doc = await this.findOne(query);
    if (!doc) return false;
    return this.findByIdAndDelete(doc._id);
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

module.exports = new InMemoryAdapter();
