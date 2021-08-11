import type { Document } from './worker/dom';

export const enum MessageType {
  BootstrapWorker,
}

export type TransferMessage = [MessageType, any];

export interface InitializeScriptData {
  $id$: number;
  $content$?: string;
  $url$?: string;
}

export interface BootstrapWorkerData {
  $currentUrl$: string;
  $interfaces$: InterfaceData[];
  $initializeScripts$?: InitializeScriptData[];
  $memberNames$: string[];
  $title$: string;
  debugDefineMethods?: boolean;
  debugDefineProperties?: boolean;
  debugMethodCalls?: boolean;
  debugPropertyGetters?: boolean;
  debugPropertySetters?: boolean;
}

export interface WorkerGlobal extends WorkerGlobalScope, BootstrapWorkerData {
  document: Document;
  location: URL;
  parent: WorkerGlobal;
  self: any;
  top: WorkerGlobal;
  window: WorkerGlobal;
}

export type MainInterface = [number, string, any];
export type WorkerInterface = [number, any];

export const enum InterfaceId {
  Document = 0,
  Node = 1,
  Element = 2,
  SVGElement = 3,
  window = 4,
}

export const enum Interface {
  Name = 0,
  Method = 1,
  GetterSetter = 2,
  Prop = 3,
  InstanceValues = 4,
}

export interface InterfaceData {
  [Interface.Name]: string;
  [Interface.Method]: number[];
  [Interface.GetterSetter]: number[];
  [Interface.Prop]: any;
  [Interface.InstanceValues]: { [propApiId: string]: string | number | boolean };
}

export type CreateWorker = (workerName?: string) => Worker;
