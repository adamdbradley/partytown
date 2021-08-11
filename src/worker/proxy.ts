import type { WorkerGlobal } from '../types';
import { debug, logWorker } from '../utils';
import type { Node } from './dom';

export const proxy = (node: Node) =>
  new Proxy(node as any, {
    get(target, prop) {
      if (prop in target) {
        const value = target[prop];
        if (debug && self.debugPropertyGetters && debugPropLog(target, prop)) {
          logWorker(`get ${node.$nodeName$}.${String(prop)}, ${debugValue(value)}`);
        }
        return value;
      }
      if (debug && self.debugPropertyGetters && debugPropLog(target, prop)) {
        logWorker(`get ${node.$nodeName$}.${String(prop)}, null (getter not defined)`);
      }
      return null;
    },
    set(target, prop, value) {
      if (prop in target) {
        if (debug && self.debugPropertySetters && debugPropLog(target, prop)) {
          logWorker(`set ${node.$nodeName$}.${String(prop)} = ${debugValue(value)}`);
        }
        target[prop] = value;
      } else {
        if (debug && self.debugPropertySetters && debugPropLog(target, prop)) {
          logWorker(
            `set ${node.$nodeName$}.${String(prop)} = ${debugValue(value)} (setter not defined)`
          );
        }
      }
      return true;
    },
  });

const debugPropLog = (target: any, prop: any) => {
  prop = String(prop);
  return (
    debug &&
    self.debugPropertyGetters &&
    !prop.startsWith('$') &&
    prop !== 'toJSON' &&
    typeof target[prop] !== 'function'
  );
};
const debugValue = (val: any) => {
  try {
    return JSON.stringify(val);
  } catch (e) {}
  return '';
};

declare const self: WorkerGlobal;
