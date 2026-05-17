const { serialize, deserialize } = require('v8');

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value) => deserialize(serialize(value));
}