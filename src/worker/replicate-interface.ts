import { Interface, InterfaceData, InterfaceId, WorkerGlobal, WorkerInterface } from '../types';
import { debug, logWorker } from '../utils';
import { Document, Element, Node, SVGElement } from './dom';

export const replicateInterfaces = (self: WorkerGlobal) => {
  self.$interfaces$.forEach((interfaceData, interfaceId) =>
    replicateInterface(self, interfaceId, interfaceData)
  );
};

const replicateInterface = (
  self: WorkerGlobal,
  interfaceId: number,
  interfaceData: InterfaceData
) => {
  const memberNames = self.$memberNames$;
  const interfaceName = interfaceData[Interface.Name];
  const methods = interfaceData[Interface.Method];
  const propsGetSet = interfaceData[Interface.GetterSetter];
  const propsInterface = interfaceData[Interface.Prop];
  const instanceValues = interfaceData[Interface.InstanceValues];
  const debugDefineMethods = debug && self.debugDefineMethods;
  const debugDefineProperties = debug && self.debugDefineProperties;
  const debugMethodCalls = debug && self.debugMethodCalls;

  const interfaceOrObject = getInterfaceOrObject(self, interfaceId, interfaceName);
  const interfacePrototype = interfaceOrObject.prototype;

  const objectOrPrototype = interfacePrototype || interfaceOrObject;

  methods.forEach((memberNameId) => {
    // methods
    const methodName = memberNames[memberNameId];

    if (interfacePrototype) {
      if (!(methodName in interfacePrototype)) {
        if (debugDefineMethods) {
          logWorker(`define method: ${interfaceName}.${methodName}()`);
        }

        interfacePrototype[methodName] = function (...args: any[]) {
          if (debugMethodCalls) {
            const logArgs = args
              .map((a) => {
                if (typeof a === 'function') {
                  return '[Function]';
                }
                try {
                  return JSON.stringify(a);
                } catch (e) {}
                return '';
              })
              .join(', ');
            logWorker(`call ${interfaceName}.${methodName}(${logArgs}) (method not defined)`);
          }
        };
      }
    }
  });

  propsGetSet.forEach((memberNameId) => {
    // properties
    const propertyName = memberNames[memberNameId];
    if (interfacePrototype) {
      // add getter/setter to the class's prototype
      if (debugDefineProperties) {
        logWorker(`define prototype property: ${interfaceName}.${propertyName}`);
      }

      if (!(propertyName in interfacePrototype)) {
        Object.defineProperty(interfacePrototype, propertyName, {
          get() {
            return instanceValues[memberNameId];
          },
          set(value) {
            instanceValues[memberNameId] = value;
          },
        });
      }
    } else if (objectOrPrototype[propertyName] == null && instanceValues[memberNameId] != null) {
      // this object is not a prototype on a "class"
      // probably it's the "self" global object that already exists
      objectOrPrototype[propertyName] = instanceValues[memberNameId];
    }
  });

  Object.entries(propsInterface).forEach(([memberIdStr, propertyInterfaceId]) => {
    // objects
    const memberNameId = parseInt(memberIdStr, 10);
    const memberName = memberNames[memberNameId];
    if (!(memberName in objectOrPrototype)) {
      const memberSymbol = Symbol(memberName);
      const propertyInterfaceName = memberNames[propertyInterfaceId as any];

      Object.defineProperty(objectOrPrototype, memberName, {
        get() {
          if (!this[memberSymbol]) {
            this[memberSymbol] = new (self as any)[propertyInterfaceName]();
          }
          return this[memberSymbol];
        },
      });
    }
  });
};

const REPLICATE_INTERFACES: WorkerInterface[] = [
  [InterfaceId.Document, Document],
  [InterfaceId.Node, Node],
  [InterfaceId.Element, Element],
  [InterfaceId.SVGElement, SVGElement],
];

const getInterfaceOrObject = (self: any, interfaceId: number, interfaceName: string) => {
  if (!self[interfaceName]) {
    if (REPLICATE_INTERFACES[interfaceId]) {
      self[interfaceName] = REPLICATE_INTERFACES[interfaceId][1];
    } else {
      self[interfaceName] = class {};
    }
  }
  return self[interfaceName];
};
