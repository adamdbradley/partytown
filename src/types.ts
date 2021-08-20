export type CreateWorker = () => Worker;

export interface InitWebWorkerData {
  $initializeScripts$: InitializeScriptData[];
  $methodNames$: string[];
}

export interface InitializeScriptData {
  $id$: number;
  $workerName$: string;
  $content$?: string;
  $url$?: string;
}

export const enum AccessType {
  Get,
  Set,
  Apply,
}

export const enum InstanceId {
  window = 0,
  document = 1,
}

export interface MainAccessRequest {
  $msgId$: number;
  $accessType$: AccessType;
  $instanceId$: number;
  $memberName$?: string;
  $data$?: any;
}

export interface MainAccessResponse {
  $msgId$: number;
  $instanceId$: number;
  $rtnValue$?: any;
  $isPromise$?: any;
  $error$?: string;
}

export interface SerializedMembers {
  [propName: string]: SerializedValueTransfer;
}

export const enum SerializeType {
  Window,
  Document,
  Method,
  Primitive,
  Array,
  Object,
  Instance,
}

export type SerializedValueTransfer =
  | [SerializeType.Window]
  | [SerializeType.Document]
  | [SerializeType.Method]
  | [SerializeType.Primitive, string | number | boolean]
  | [SerializeType.Array, SerializedValueTransfer[]]
  | [SerializeType.Instance, SerializedInstance]
  | [SerializeType.Object, any]
  | [];

export interface SerializedInstance {
  $cstr$: SerializedConstructorType;
  $instanceId$?: number;
}

export const enum SerializedConstructorType {
  Element = 1, // same as NodeType
  HTMLCollection = 2,
  TextNode = 3, // same as NodeType
  CommentNode = 8, // same as NodeType
  DocumentFragmentNode = 11, // same as NodeType
}

export interface SerializedNode extends SerializedInstance {
  $nodeName$: string;
}

export interface SerializedHTMLCollection extends SerializedInstance {
  $items$: SerializedNode[];
}
