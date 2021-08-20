const PT_SANDBOX_URL = `partytown-sandbox`;
const PT_PROXY_URL = `partytown-proxy`;

const resolves = new Map();
const receiveMessageFromSandboxToServiceWorker = (ev) => {
    const accessRsp = ev.data;
    console.log('receiveMessageFromSandboxToServiceWorker', accessRsp);
    const r = resolves.get(accessRsp.$msgId$);
    if (r) {
        resolves.delete(accessRsp.$msgId$);
        clearTimeout(r.$timeoutId$);
        r.$resolve$(accessRsp);
    }
};
const sendMessageToSandboxFromServiceWorker = (self, accessReq) => {
    return new Promise(async (resolve) => {
        const clients = await self.clients.matchAll();
        const client = clients[0];
        if (client) {
            const msgResolve = {
                $resolve$: resolve,
                $timeoutId$: setTimeout(() => {
                    resolves.delete(accessReq.$msgId$);
                    resolve({
                        $msgId$: accessReq.$msgId$,
                        $instanceId$: accessReq.$instanceId$,
                        $error$: `partytown timeout`,
                    });
                    console.warn(`partytown timeout`, accessReq);
                }, 5000),
            };
            resolves.set(accessReq.$msgId$, msgResolve);
            console.log('sendMessageToSandboxFromServiceWorker', accessReq);
            client.postMessage(accessReq);
        }
        else {
            resolve({
                $msgId$: accessReq.$msgId$,
                $instanceId$: accessReq.$instanceId$,
                $error$: `partytown client not found: ${accessReq}`,
            });
        }
    });
};
const httpRequestFromWebWorker = (self, req) => {
    return new Promise(async (resolve) => {
        const accessReq = await req.clone().json();
        const responseData = await sendMessageToSandboxFromServiceWorker(self, accessReq);
        resolve(new Response(JSON.stringify(responseData), {
            headers: { 'content-type': 'application/json' },
        }));
    });
};

const onFetchServiceWorkerRequest = (self, ev) => {
    const req = ev.request;
    const pathname = new URL(req.url).pathname;
    if (pathname.endsWith('/' + PT_SANDBOX_URL)) {
        ev.respondWith(new Response(SANDBOX, {
            headers: { 'content-type': 'text/html' },
        }));
    }
    else if (pathname.endsWith('/' + PT_PROXY_URL)) {
        ev.respondWith(httpRequestFromWebWorker(self, req));
    }
};
const SANDBOX = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><script type=\"module\">let instanceIds = 2;\n\nconst instancesById = new Map;\n\nconst idsByInstance = new WeakMap;\n\nconst setInstanceId = (instance, instanceId) => {\n    instancesById.set(instanceId, instance);\n    idsByInstance.set(instance, instanceId);\n};\n\nconst getInstanceId = instance => {\n    let instanceId = idsByInstance.get(instance);\n    if (\"number\" != typeof instanceId) {\n        instanceId = instanceIds++;\n        setInstanceId(instance, instanceId);\n    }\n    return instanceId;\n};\n\nconst getInstance = instanceId => instancesById.get(instanceId);\n\nconst serializeValue = (value, added) => {\n    const type = typeof value;\n    if (\"string\" === type || \"number\" === type || \"boolean\" === type || null === value) {\n        return [ 3, value ];\n    }\n    if (\"function\" === type) {\n        return [ 2 ];\n    }\n    if (Array.isArray(value)) {\n        if (!added.has(value)) {\n            added.add(value);\n            return [ 4, value.map((v => serializeValue(v, added))) ];\n        }\n        return [ 4, [] ];\n    }\n    if (\"object\" === type) {\n        if (value === window.parent) {\n            return [ 0 ];\n        }\n        if (value === window.parent.document) {\n            return [ 1 ];\n        }\n        if (value.nodeType) {\n            return [ 6, {\n                $instanceId$: getInstanceId(value),\n                $cstr$: value.nodeType,\n                $nodeName$: value.nodeName\n            } ];\n        }\n        if (!added.has(value)) {\n            added.add(value);\n            if (value.constructor) {\n                if (\"HTMLCollection\" === value.constructor.name) {\n                    const htmlCollection = [ 6, {\n                        $cstr$: 2,\n                        $items$: Array.from(value).map((v => serializeValue(v, added)[1]))\n                    } ];\n                    console.log(\"htmlCollection\", htmlCollection);\n                    return htmlCollection;\n                }\n            }\n            const obj = {};\n            const objTransfer = [ 5, obj ];\n            for (const k in value) {\n                obj[k] = serializeValue(value[k], added);\n            }\n            return objTransfer;\n        }\n        return [ 5, {} ];\n    }\n    return [];\n};\n\nconst deserializeValue = serializedValue => {\n    const type = typeof serializedValue;\n    if (\"string\" === type || \"boolean\" === type || \"number\" === type || null == serializeValue) {\n        return serializedValue;\n    }\n    if (Array.isArray(serializedValue)) {\n        return serializedValue.map(deserializeValue);\n    }\n    if (\"object\" === type) {\n        const instance = getInstance(serializedValue.$instanceId$);\n        if (instance) {\n            return instance;\n        }\n        const deserializedValue = {};\n        for (const k in serializedValue) {\n            deserializedValue[k] = deserializeValue(serializedValue[k]);\n        }\n        return deserializedValue;\n    }\n};\n\nconst getInstanceMember = (instance, memberName, accessRsp) => {\n    accessRsp.$rtnValue$ = serializeValue(instance[memberName], new Set);\n};\n\nconst setInstanceProp = (instance, propName, propValue) => {\n    console.log(\"setInstanceProp\", instance, propName, propValue);\n    instance[propName] = deserializeValue(propValue);\n};\n\nconst instanceCallMethod = (instance, methodName, serializedArgs, accessRsp) => {\n    console.log(\"instanceCallMethod\", instance, methodName, serializedArgs);\n    const args = deserializeValue(serializedArgs);\n    const rtnValue = instance[methodName].apply(instance, args);\n    accessRsp.$rtnValue$ = serializeValue(rtnValue, new Set);\n};\n\nconst readImplementations = (mainWindow, mainDocument) => {\n    const docImpl = mainDocument.implementation.createHTMLDocument();\n    const methodNames = new Set;\n    [ mainWindow, docImpl, docImpl.createTextNode(\"\"), docImpl.createElement(\"i\") ].forEach((mainImpl => {\n        for (const memberName in mainImpl) {\n            memberName.startsWith(\"webkit\") || \"function\" == typeof mainImpl[memberName] && methodNames.add(memberName);\n        }\n    }));\n    return Array.from(methodNames);\n};\n\nconst readMainScripts = doc => Array.from(doc.querySelectorAll('script[data-partytown][type=\"text/plain\"]')).map(((elm, $id$) => {\n    const scriptData = {\n        $id$: $id$,\n        $workerName$: elm.dataset.worker || \"\"\n    };\n    elm.hasAttribute(\"src\") ? scriptData.$url$ = elm.src : scriptData.$content$ = elm.innerHTML;\n    elm.dataset.partytown = $id$;\n    return scriptData;\n}));\n\n(async (sandboxWindow, createWebWorker) => {\n    const mainWindow = sandboxWindow.parent;\n    const mainDocument = mainWindow.document;\n    const swContainer = sandboxWindow.navigator.serviceWorker;\n    const swRegistration = await swContainer.getRegistration();\n    const webWorker = createWebWorker();\n    const initWebWorkerData = {\n        $initializeScripts$: readMainScripts(mainDocument),\n        $methodNames$: readImplementations(mainWindow, mainDocument)\n    };\n    setInstanceId(mainWindow, 0);\n    setInstanceId(mainDocument, 1);\n    swContainer.addEventListener(\"message\", (ev => {\n        requestAnimationFrame((async () => {\n            const accessRsp = await (async accessReq => {\n                const accessType = accessReq.$accessType$;\n                const instanceId = accessReq.$instanceId$;\n                const memberName = accessReq.$memberName$;\n                const data = accessReq.$data$;\n                const accessRsp = {\n                    $msgId$: accessReq.$msgId$,\n                    $instanceId$: instanceId\n                };\n                try {\n                    const instance = getInstance(instanceId);\n                    instance ? 0 === accessType ? getInstanceMember(instance, memberName, accessRsp) : 1 === accessType ? setInstanceProp(instance, memberName, data) : 2 === accessType && instanceCallMethod(instance, memberName, data, accessRsp) : accessRsp.$error$ = `Instance ${instanceId} not found`;\n                } catch (e) {\n                    accessRsp.$error$ = String(e.stack || e);\n                }\n                return accessRsp;\n            })(ev.data);\n            swRegistration && swRegistration.active && swRegistration.active.postMessage(accessRsp);\n        }));\n    }));\n    webWorker.postMessage(initWebWorkerData);\n})(window, (() => new Worker(\"partytown-ww.js\")));\n</script></head></html>";

const initServiceWorker = (self) => {
    self.oninstall = () => self.skipWaiting();
    self.onactivate = () => self.clients.claim();
    self.onmessage = receiveMessageFromSandboxToServiceWorker;
    self.onfetch = (ev) => onFetchServiceWorkerRequest(self, ev);
};
initServiceWorker(self);
