# Party Town 🎉

> A fun place for your third-party scripts to hang out

⚠️ Warning! This is experimental! ⚠️

- Relocates resource intensive scripts to into a [web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- Web worker DOM implementation within `4kb`
- Debug what third-party scripts are calling into
- Sandboxed browser APIs

---

## Party Script

For each script that should not run in the main thread, but instead party in a web worker, the script
should set its `type` attribute to `partytown`. This does two things:

1. Prevents the script from executing on the main thread.
2. Provides an attribute selector for the Party Town library.

```html
<script type="partytown">
  // third-party analytics scripts
</script>
```

With scripts disabled from executing, the Party Town library can lazily load
and begin executing the scripts from inside a web worker.
The Party Town library script must also be added to the page, preferrably at the bottom.

```html
<script src="/partytown.js" async></script>
```

The distribution comes with two builds:

### `partytown.js`

- Single-file with the worker script inlined so there is only one request
- Minified and property renamed
- Console logs removed

### `partytown.debug.js`

- Fires a second network request for the web worker at `partytown.debug.worker.js`
- Not meant for production, but useful to inspect what scripts are up to
- Readable property names
- Opt-in for additional console logs using attributes on the script element:
  - `debug-property-getters`: Log every browser API property getter
  - `debug-property-setters`: Log every browser API property setter
  - `debug-method-calls`: Log every browser API method call
  - `debug-define-methods`: Log all of the browser API methods that were defined
  - `debug-define-properties`: Log all of the browser API properties that were defined

Example script with a debug attribute to print out more logs.

```html
<script src="/partytown.debug.js" debug-method-calls async></script>
```

### Worker Instances

By default all Party Town scripts will load in the same worker. However, each
script could placed in their own named web-worker, or separated into  
groups by giving the script a `worker` attribute.

```html
<script type="partytown" worker="GTM">
  // Google Tag Manager
</script>

<script type="partytown" worker="GA">
  // Google Analytics
</script>
```

By placing each script in their own worker it may be easier to separate and debug
what each script is executing. However, in production it may be preferred to always
share one worker.

---

## Development

```
npm install
npm run dev
```

Note that during development, the build of `partytown.js` is not minified.

### Integration Tests

Tests to be ran on a browser are located in the `tests`. First start the server, then visit http://localhost:4000/

```
npm run serve
```

### Unit Tests

```
npm test
```

```
npm run test.watch
npm run test.watch -- /path/to/test.unit.ts
```
