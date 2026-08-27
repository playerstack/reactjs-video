#!/usr/bin/env node
import { parseArgs } from 'node:util';
import esbuild from 'esbuild';
import process from 'node:process';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const nodePath = await realpath(process.argv[1]);
const modulePath = await realpath(fileURLToPath(import.meta.url));
const isCLI = nodePath === modulePath;

if (isCLI) {
  cliBuild();
}

export async function cliBuild() {
  const { values: args, positionals } = parseArgs({
    options: {},
    strict: false,
    allowPositionals: true,
  });

  await build(positionals, args);
}

export async function build(positionals, args) {
  // https://esbuild.github.io/api/#live-reload
  const livereloadJs = "new EventSource('/esbuild').addEventListener('change', () => location.reload());";

  // Assigns external modules to global variables.
  // https://github.com/evanw/esbuild/issues/337
  const plugins = {
    'global-externals': (arg) => {
      // Add quotes around unquoted keys/values for lenient JSON parsing
      const normalized = arg
        .replace(/([{,])\s*([^"{}\s:,]+)\s*:/g, '$1"$2":')
        .replace(/:\s*([^"{}\s:,]+)\s*([,}])/g, ':"$1"$2');
      const options = JSON.parse(normalized);

      return {
        name: 'global-externals-plugin',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (options[args.path]) {
              return {
                path: args.path,
                namespace: 'global-externals-plugin',
              };
            }
            return null;
          });

          build.onLoad({ filter: /.*/, namespace: 'global-externals-plugin' }, (args) => {
            if (options[args.path]) {
              const contents = `module.exports = ${options[args.path]}`;
              return { contents };
            }
            return null;
          });
        },
      };
    },
  };

  const entryPoints = getAllFiles(positionals, args?.exclude?.split(',') ?? []);

  // Built-in alias plugin: resolves @foo/bar to src/foo/bar
  const srcRoot = path.resolve(process.cwd(), 'src');
  const aliasResolvePlugin = {
    name: 'alias-resolve',
    setup(build) {
      build.onResolve({ filter: /^@/ }, (resolveArgs) => {
        // Skip npm scoped packages
        if (resolveArgs.path.startsWith('@playerstack/')) return null;
        const stripped = resolveArgs.path.slice(1);
        const candidate = path.resolve(srcRoot, stripped);
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return { path: candidate };
        }
        for (const ext of extensions) {
          if (fs.existsSync(candidate + ext)) {
            return { path: candidate + ext };
          }
        }
        for (const ext of extensions) {
          const indexPath = path.join(candidate, 'index' + ext);
          if (fs.existsSync(indexPath)) {
            return { path: indexPath };
          }
        }
        return null;
      });
    },
  };

  const options = {
    logLevel: args['log-level'] ?? 'info',
    entryPoints: entryPoints,
    outfile: args.outfile,
    outdir: args.outfile ? undefined : (args.outdir ?? 'dist'),
    target: args.target ?? 'es2019',
    bundle: args.bundle,
    minify: args.minify,
    format: args.format,
    platform: args.platform ?? 'browser',
    metafile: args.metafile,
    sourcemap: args.sourcemap,
    globalName: args['global-name'],
    external: argsArray(args, 'external'),
    outExtension: argsObject(args, 'out-extension'),
    banner: argsObject(args, 'banner'),
    plugins: [aliasResolvePlugin, ...Object.entries(argsObject(args, 'plugin')).map(([name, options]) => plugins[name](options))],
    define: {
      'globalThis.__TEST__': 'false',
      ...argsObject(args, 'define'),
    },
    loader: {
      '.js': 'js',
      '.jsx': 'jsx',
      '.json': 'json',
      ...argsObject(args, 'loader'),
    },
    footer: {
      ...argsObject(args, 'footer'),
      js: (args['footer:js'] ?? '') + (args.livereload ? `\n${livereloadJs}` : ''),
    },
  };

  if (process.env.NODE_ENV) {
    options.define['process.env.NODE_ENV'] ||= `"${process.env.NODE_ENV}"`;
  }

  if (args.watch) {
    const ctx = await esbuild.context(options);

    await ctx.watch();

    if (args.servedir) {
      const { host, port } = await ctx.serve({
        servedir: args.servedir,
        port: 8000,
      });
      console.log(`[serve] http://${host}:${port}`);
    }

    return;
  }

  await esbuild.build(options);
}

function argsArray(args, name) {
  return Object.keys(args)
    .filter((k) => k.startsWith(`${name}:`))
    .map((k) => k.slice(`${name}:`.length));
}

function argsObject(args, name) {
  return Object.keys(args)
    .filter((k) => k.startsWith(`${name}:`))
    .reduce((acc, k) => {
      const key = k.slice(`${name}:`.length);
      acc[key] = args[k];
      return acc;
    }, {});
}

function getAllFiles(dirs, exclude = []) {
  const outFiles = [];

  const dirsArray = Array.isArray(dirs) ? dirs : [dirs];

  for (let i = 0; i < dirsArray.length; i++) {
    const dir = dirsArray[i];
    const files = glob.sync(dir);

    for (let j = 0; j < files.length; j++) {
      const filePath = files[j];

      if (fs.statSync(filePath).isDirectory() === true) {
        outFiles.push(...getAllFiles(filePath, exclude));
      } else {
        if (exclude.some((ext) => filePath.endsWith(`.${ext}`)) === false) {
          outFiles.push(filePath);
        }
      }
    }
  }

  return outFiles;
}
