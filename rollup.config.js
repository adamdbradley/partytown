import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { rollup } from 'rollup';
import { join } from 'path';

export default function (cmdArgs) {
  const isDev = !!cmdArgs.configDev;

  const mainIntro = `((window,document)=>{`;
  const mainOutro = `})(window,document);`;

  const minOpts = {
    compress: {
      global_defs: {
        'globalThis.partyTownDebug': false,
      },
      ecma: 2018,
      passes: 2,
    },
    format: {
      comments: false,
      ecma: 2018,
    },
  };

  const debugOpts = {
    compress: {
      global_defs: {
        'globalThis.partyTownDebug': true,
      },
      inline: false,
      join_vars: false,
      loops: false,
      sequences: false,
      passes: isDev ? 1 : 2,
      drop_debugger: false,
    },
    format: {
      comments: false,
      beautify: true,
      braces: true,
    },
    mangle: false,
  };

  const mainBundle = {
    input: 'src/main/index.ts',
    plugins: [
      typescript({
        cacheDir: join(__dirname, '.cache', 'main'),
        outputToFilesystem: false,
      }),
      webWorkerPlugin(),
    ],
    output: [
      {
        file: 'partytown.js',
        format: 'es',
        intro: mainIntro,
        outro: mainOutro,
        plugins: isDev ? [] : [managlePropsPlugin(), terser(minOpts)],
      },
      {
        file: 'partytown.debug.js',
        format: 'es',
        intro: mainIntro,
        outro: mainOutro,
        plugins: [terser(debugOpts)],
      },
    ],
  };

  function webWorkerPlugin() {
    let workerDebugCode = '';
    let workerMinCode = '';
    let rollupCache = null;
    return {
      name: 'webWorker',
      async buildStart() {
        const workerBuild = await rollup({
          input: 'src/worker/index.ts',
          plugins: [
            typescript({
              cacheDir: join(__dirname, '.cache', 'worker'),
              outputToFilesystem: false,
            }),
          ],
          cache: rollupCache,
        });
        rollupCache = workerBuild.cache;

        workerBuild.watchFiles.forEach((f) => {
          this.addWatchFile(f);
        });

        const workerIntro = `((self)=>{`;
        const workerOutro = `})(self);`;

        const minBundle = await workerBuild.generate({
          format: 'es',
          exports: 'none',
          intro: workerIntro,
          outro: workerOutro,
          plugins: isDev ? [] : [managlePropsPlugin(), terser(minOpts)],
        });

        const debugBundle = await workerBuild.write({
          file: 'partytown.debug.worker.js',
          format: 'es',
          exports: 'none',
          intro: workerIntro,
          outro: workerOutro,
          plugins: terser(debugOpts),
        });

        workerMinCode = minBundle.output[0].code;
        workerDebugCode = debugBundle.output[0].code;
      },
      generateBundle(_opts, bundle) {
        for (const fileName in bundle) {
          let code = bundle[fileName].code;
          if (fileName.includes('debug')) {
            code = code.replace('globalThis.WORKER_BLOB', JSON.stringify(workerDebugCode));
          } else {
            code = code.replace('globalThis.WORKER_BLOB', JSON.stringify(workerMinCode));
          }
          bundle[fileName].code = code;

          if (!isDev) {
            console.log(`🗜 ${fileName} - ${code.length}b`);
          }
        }
      },
    };
  }

  return mainBundle;
}

function managlePropsPlugin() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const mangleProps = {
    $content$: '',
    $childNodes$: '',
    $ctx$: '',
    $currentUrl$: '',
    $id$: '',
    $initializeScripts$: '',
    $interfaces$: '',
    $memberNames$: '',
    $nodeName$: '',
    $nodeType$: '',
    $ownerDocument$: '',
    $parentNode$: '',
    $src$: '',
    $title$: '',
    $url$: '',
  };
  Object.keys(mangleProps).forEach((key, i) => {
    mangleProps[key] = chars[i];
  });

  return {
    name: 'mangleProps',
    generateBundle(_opts, bundle) {
      for (const fileName in bundle) {
        Object.keys(mangleProps).forEach((key) => {
          const rg = new RegExp(key.replace(/\$/g, '\\$'), 'g');
          const replaceWith = mangleProps[key];
          bundle[fileName].code = bundle[fileName].code.replace(rg, replaceWith);
        });
      }
    },
  };
}
