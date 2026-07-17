'use strict';

/**
 * FGA Event Bus — internal publish/subscribe system.
 *
 * All platform modules emit and listen to events through this bus.
 * This decouples services: a module publishes one event instead of
 * directly calling five other services.
 *
 * Design:
 *   - Built on Node.js EventEmitter (zero extra dependencies)
 *   - Max listener limit raised to avoid warnings with many subscribers
 *   - Every published event is logged at debug level
 *   - Listener errors are caught and logged; they never crash the publisher
 *   - Supports wildcard subscription via the special '*' event name
 *
 * Usage:
 *   const { publish, subscribe } = require('./eventBus');
 *   const FGA_EVENTS = require('./eventTypes');
 *
 *   // subscribe
 *   subscribe(FGA_EVENTS.LEAD_CREATED, async (payload) => { ... });
 *
 *   // publish (fire-and-forget; awaits all async listeners)
 *   await publish(FGA_EVENTS.LEAD_CREATED, { leadId, source, ... });
 */

const { EventEmitter } = require('events');

class FGAEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow many feature modules to register listeners without NodeJS warnings
    this.setMaxListeners(50);
    this._wildcardListeners = [];
  }

  /**
   * Publish an event to all subscribers.
   * Catches and logs any listener error so callers never fail silently.
   *
   * @param {string} eventType  - Event name (use FGA_EVENTS constants)
   * @param {object} payload    - Event data
   * @returns {Promise<void>}
   */
  async publish(eventType, payload = {}) {
    const envelope = {
      eventType,
      payload,
      publishedAt: new Date().toISOString(),
    };

    console.log(`[FGA:EventBus] 📢 ${eventType}`);

    // Collect all listeners (specific + wildcard)
    const listeners = this.listeners(eventType).concat(this._wildcardListeners);

    for (const listener of listeners) {
      try {
        await listener(envelope);
      } catch (err) {
        console.error(
          `[FGA:EventBus] ❌ Listener error for "${eventType}": ${err.message}`
        );
      }
    }
  }

  /**
   * Subscribe to a specific event type.
   * Use '*' to receive every event (wildcard).
   *
   * @param {string}   eventType - Event name or '*' for all events
   * @param {Function} listener  - Async function receiving the event envelope
   */
  subscribe(eventType, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError(`[FGA:EventBus] Listener for "${eventType}" must be a function`);
    }

    if (eventType === '*') {
      this._wildcardListeners.push(listener);
      console.log(`[FGA:EventBus] ✅ Wildcard listener registered`);
    } else {
      this.on(eventType, listener);
      console.log(`[FGA:EventBus] ✅ Listener registered for "${eventType}"`);
    }
  }

  /**
   * Remove a previously registered listener.
   */
  unsubscribe(eventType, listener) {
    if (eventType === '*') {
      this._wildcardListeners = this._wildcardListeners.filter(fn => fn !== listener);
    } else {
      this.off(eventType, listener);
    }
  }
}

// Singleton instance shared across the entire server process
const bus = new FGAEventBus();

module.exports = bus;
