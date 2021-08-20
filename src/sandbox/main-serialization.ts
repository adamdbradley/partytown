import {
  SerializedConstructorType,
  SerializedHTMLCollection,
  SerializedInstance,
  SerializedNode,
  SerializedValueTransfer,
  SerializeType,
} from '../types';
import { getInstance, getInstanceId } from './main-instances';

export const serializeValue = (value: any, added: Set<any>): SerializedValueTransfer => {
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean' || value === null) {
    return [SerializeType.Primitive, value];
  }

  if (type === 'function') {
    return [SerializeType.Method];
  }

  if (Array.isArray(value)) {
    if (!added.has(value)) {
      added.add(value);
      return [SerializeType.Array, value.map((v) => serializeValue(v, added))];
    }
    return [SerializeType.Array, []];
  }

  if (type === 'object') {
    if (value === window.parent) {
      return [SerializeType.Window];
    }
    if (value === window.parent!.document) {
      return [SerializeType.Document];
    }

    if (value.nodeType) {
      const nodeInstance: SerializedNode = {
        $instanceId$: getInstanceId(value),
        $cstr$: value.nodeType,
        $nodeName$: value.nodeName,
      };
      return [SerializeType.Instance, nodeInstance];
    }

    if (!added.has(value)) {
      added.add(value);

      if (value.constructor) {
        const cstrName = value.constructor.name;
        if (cstrName === 'HTMLCollection') {
          const htmlCollectionInstance: SerializedHTMLCollection = {
            $cstr$: SerializedConstructorType.HTMLCollection,
            $items$: Array.from(value).map((v) => serializeValue(v, added)[1]),
          };
          const htmlCollection: SerializedValueTransfer = [
            SerializeType.Instance,
            htmlCollectionInstance,
          ];
          console.log('htmlCollection', htmlCollection);
          return htmlCollection;
        }
      }

      const obj: { [key: string]: any } = {};
      const objTransfer: SerializedValueTransfer = [SerializeType.Object, obj];
      for (const k in value) {
        obj[k] = serializeValue(value[k], added);
      }
      return objTransfer;
    }

    return [SerializeType.Object, {}];
  }

  return [];
};

export const deserializeValue = (serializedValue: any): any => {
  const type = typeof serializedValue;
  if (type === 'string' || type === 'boolean' || type === 'number' || serializeValue == null) {
    return serializedValue;
  }
  if (Array.isArray(serializedValue)) {
    return serializedValue.map(deserializeValue);
  }
  if (type === 'object') {
    const instance = getInstance((serializedValue as SerializedInstance).$instanceId$!);
    if (instance) {
      return instance;
    }
    const deserializedValue: { [key: string]: any } = {};
    for (const k in serializedValue) {
      deserializedValue[k] = deserializeValue(serializedValue[k]);
    }
    return deserializedValue;
  }
  return undefined;
};
