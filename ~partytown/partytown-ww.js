const debug = globalThis.partyTownDebug;
const toLower = (str) => str.toLowerCase();
const logWorker = (msg) => debug && console.debug.apply(console, log(self.name, '#3498db', msg));
const log = (prefix, color, msg) => [
    `%c${prefix}`,
    `background: ${color}; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;`,
    msg,
];

const initMainScriptsInWebWorker = (initializeScripts) => {
    initializeScripts.forEach((initializeScript) => {
        if (initializeScript.$url$) {
            initializeScriptUrl(initializeScript.$id$, initializeScript.$url$);
        }
        else if (initializeScript.$content$) {
            initializeScriptContent(initializeScript.$id$, initializeScript.$content$);
        }
    });
};
const initializeScriptContent = (id, content) => {
    try {
        logWorker(`initialize script content (${id})`);
        const runScript = new Function(content);
        runScript();
    }
    catch (e) {
        console.error(`party foul, script content (${id}):`, e);
        console.error(content);
    }
};
const initializeScriptUrl = (id, url) => {
    try {
        logWorker(`initialize script url (${id}): ${url}`);
    }
    catch (e) {
        console.error(`party foul, script url (${id}):`, e);
        console.error(`Script Url: ${url}`);
    }
};

const PT_PROXY_URL = `partytown-proxy`;

const InstanceIdKey = Symbol('InstanceId');
const NodeTypeKey = Symbol('NodeType');
const NodeNameKey = Symbol('NodeName');
const ProxyKey = Symbol('Proxy');
const CstrValues = Symbol('CstrValues');

let msgIds = 0;
class Node {
    constructor(nodeCstr) {
        this[InstanceIdKey] = nodeCstr.$instanceId$;
        this[NodeTypeKey] = nodeCstr.$cstr$;
        this[NodeNameKey] = nodeCstr.$nodeName$;
        return proxy(this);
    }
    get nodeName() {
        return this[NodeNameKey];
    }
    get nodeType() {
        return this[NodeTypeKey];
    }
    get ownerDocument() {
        return self.document;
    }
    toJSON() {
        return {
            $cstr$: this[NodeTypeKey],
            $nodeName$: this[NodeNameKey],
            $instanceId$: this[InstanceIdKey],
        };
    }
}
class Element extends Node {
    get localName() {
        return toLower(this[NodeNameKey]);
    }
    get tagName() {
        return this[NodeNameKey];
    }
}
class Document extends Element {
    get defaultView() {
        return self;
    }
    get localName() {
        return undefined;
    }
    get ownerDocument() {
        return null;
    }
    get tagName() {
        return undefined;
    }
}
class HTMLCollection {
    constructor(serializedHtmlCollection) {
        console.log('HTMLCollection', serializedHtmlCollection);
        this[CstrValues] = serializedHtmlCollection;
        serializedHtmlCollection.$items$.forEach((item, index) => {
            this[index] = constructInstance(item);
        });
    }
    item(index) {
        return this[index];
    }
    get length() {
        return this[CstrValues].$items$.length;
    }
}
const constructInstance = (serializedInstance) => {
    const cstr = serializedInstance.$cstr$;
    if (cstr === 1 /* Element */) {
        return new Element(serializedInstance);
    }
    if (cstr === 3 /* TextNode */ ||
        cstr === 8 /* CommentNode */ ||
        cstr === 11 /* DocumentFragmentNode */) {
        return new Node(serializedInstance);
    }
    if (cstr === 2 /* HTMLCollection */) {
        return new HTMLCollection(serializedInstance);
    }
    return proxy({});
};
const sendRequestToServiceWorker = (accessReq) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', PT_PROXY_URL, false);
    xhr.send(JSON.stringify(accessReq));
    const accessRsp = JSON.parse(xhr.responseText);
    if (accessRsp.$error$) {
        throw new Error(accessRsp.$error$);
    }
    return accessRsp;
};
const createMethodProxy = (target, methodName) => {
    return (...args) => {
        console.log('createMethodProxy apply', methodName, args);
        const accessRsp = sendRequestToServiceWorker({
            $msgId$: msgIds++,
            $accessType$: 2 /* Apply */,
            $instanceId$: target[InstanceIdKey],
            $memberName$: methodName,
            $data$: args,
        });
        const rtn = constructValue(target, methodName, accessRsp.$rtnValue$);
        if (accessRsp.$isPromise$) {
            return Promise.resolve(rtn);
        }
        return rtn;
    };
};
const proxy = (obj) => {
    if (!obj ||
        (typeof obj !== 'object' && typeof obj !== 'function') ||
        obj[ProxyKey] ||
        (obj + '').includes('[native')) {
        return obj;
    }
    return new Proxy(obj, {
        get(target, propKey) {
            if (propKey === ProxyKey) {
                return true;
            }
            if (Reflect.has(target, propKey)) {
                return Reflect.get(target, propKey);
            }
            const memberName = String(propKey);
            if (methodNames.includes(memberName)) {
                return createMethodProxy(target, memberName);
            }
            const accessRsp = sendRequestToServiceWorker({
                $msgId$: msgIds++,
                $accessType$: 0 /* Get */,
                $instanceId$: target[InstanceIdKey],
                $memberName$: memberName,
            });
            return constructValue(target, propKey, accessRsp.$rtnValue$);
        },
        set(target, propKey, value, receiver) {
            console.log('set', propKey, value);
            if (Reflect.has(target, propKey)) {
                Reflect.set(target, propKey, value, receiver);
            }
            else {
                sendRequestToServiceWorker({
                    $msgId$: msgIds++,
                    $accessType$: 1 /* Set */,
                    $instanceId$: target[InstanceIdKey],
                    $memberName$: String(propKey),
                    $data$: value,
                });
            }
            return true;
        },
    });
};
const constructValue = (target, memberName, serializedValueTransfer) => {
    memberName = String(memberName);
    const serializedType = serializedValueTransfer[0];
    const serializedValue = serializedValueTransfer[1];
    console.log(`constructValue, memberName: ${memberName}`, serializedValue);
    if (serializedType === 3 /* Primitive */) {
        return serializedValue;
    }
    if (serializedType === 2 /* Method */) {
        return createMethodProxy(target, memberName);
    }
    if (serializedType === 6 /* Instance */) {
        const serializedInstance = serializedValue;
        return constructInstance(serializedInstance);
    }
    if (serializedType === 5 /* Object */) {
        return proxy(serializedValue);
    }
    if (serializedType === 4 /* Array */) {
        const serializedArray = serializedValue;
        return serializedArray.map((v) => constructValue(target, memberName, v));
    }
    return undefined;
};
const methodNames = [];

const initWebWorkerGlobal = (self) => {
    self[InstanceIdKey] = 0 /* window */;
    self.document = new Document({
        $instanceId$: 1 /* document */,
        $cstr$: 9,
        $nodeName$: '#document',
    });
    self.self = self.parent = self.top = self.window = self;
    self.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 24);
    self.cancelAnimationFrame = (id) => clearTimeout(id);
};

const initWebWorker = (self, initWebWorkerData) => {
    methodNames.push(...initWebWorkerData.$methodNames$);
    initWebWorkerGlobal(self);
    initMainScriptsInWebWorker(initWebWorkerData.$initializeScripts$);
};

self.onmessage = (evFromSandbox) => {
    initWebWorker(self, evFromSandbox.data);
    self.onmessage = null;
};
