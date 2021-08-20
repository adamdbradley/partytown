import { InstanceId } from '../types';

let instanceIds = InstanceId.document + 1;

const instancesById = new Map<number, any>();
const idsByInstance = new WeakMap<any, number>();

export const setInstanceId = (instance: any, instanceId: number) => {
  instancesById.set(instanceId, instance);
  idsByInstance.set(instance, instanceId);
};

export const getInstanceId = (instance: any): number => {
  let instanceId = idsByInstance.get(instance);
  if (typeof instanceId !== 'number') {
    instanceId = instanceIds++;
    setInstanceId(instance, instanceId);
  }
  return instanceId;
};

export const getInstance = (instanceId: number) => instancesById.get(instanceId);
