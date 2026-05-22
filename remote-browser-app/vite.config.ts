import {defineConfig, type Plugin} from 'vite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as http from 'node:http';

const frontEndDir = path.resolve(__dirname, '../front_end');

function devtoolsCssPlugin(): Plugin {
  const PREFIX = '\0dt-style-mod:';
  const cssPathMap = new Map<string, string>();

  function toKey(cssPath: string): string {
    return Buffer.from(cssPath).toString('base64url');
  }

  return {
    name: 'devtools-css-modules',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('.css.js')) {
        return null;
      }
      if (!importer) {
        return null;
      }
      let importerPath = importer;
      if (importerPath.startsWith(PREFIX)) {
        const key = importerPath.slice(PREFIX.length);
        importerPath = cssPathMap.get(key) || importerPath;
      }
      const cssFile = source.replace(/\.js$/, '');
      const resolved = path.resolve(path.dirname(importerPath), cssFile);
      if (fs.existsSync(resolved)) {
        const key = toKey(resolved);
        cssPathMap.set(key, resolved);
        return PREFIX + key;
      }
      return null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) {
        return null;
      }
      const key = id.slice(PREFIX.length);
      const cssPath = cssPathMap.get(key);
      if (!cssPath || !fs.existsSync(cssPath)) {
        return 'export default "";';
      }
      const css = fs.readFileSync(cssPath, 'utf-8');
      const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
      return `export default \`${escaped}\`;`;
    },
  };
}

function devtoolsImagesPlugin(): Plugin {
  const iconNames = [
    'arrow-back', 'arrow-forward', 'refresh', 'mouse', 'touch-app', 'devices',
    'chevron-left', 'chevron-right', 'warning', 'info-filled', 'cross-circle',
    'checkmark', 'plus', 'bin', 'dots-vertical', 'gear-filled',
  ];
  const svgDir = path.resolve(frontEndDir, 'Images/src');

  return {
    name: 'devtools-images',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source.endsWith('Images/Images.js') || source.endsWith('/Images.js')) {
        if (importer && importer.includes('front_end')) {
          return '\0virtual:devtools-images';
        }
      }
      return null;
    },
    load(id) {
      if (id !== '\0virtual:devtools-images') {
        return null;
      }

      const lines: string[] = [
        `const sheet = new CSSStyleSheet();`,
        `sheet.replaceSync(':root {}');`,
        `const style = sheet.cssRules[0].style;`,
      ];

      for (const name of iconNames) {
        const svgPath = path.join(svgDir, `${name}.svg`);
        if (fs.existsSync(svgPath)) {
          const raw = fs.readFileSync(svgPath, 'utf-8').trim();
          const encoded = encodeURIComponent(raw)
            .replace(/'/g, '%27')
            .replace(/"/g, '%22');
          lines.push(
            `style.setProperty('--image-file-${name}', 'url("data:image/svg+xml,${encoded}")');`
          );
        }
      }

      lines.push(`document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];`);
      lines.push(`export default {};`);
      return lines.join('\n');
    },
  };
}

function devtoolsLocalesPlugin(): Plugin {
  return {
    name: 'devtools-locales',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === './locales.js' && importer && importer.includes('i18n')) {
        return '\0virtual:devtools-locales';
      }
      return null;
    },
    load(id) {
      if (id !== '\0virtual:devtools-locales') {
        return null;
      }
      return `
export const LOCALES = ['en-US'];
export const BUNDLED_LOCALES = ['en-US'];
export const DEFAULT_LOCALE = 'en-US';
export const REMOTE_FETCH_PATTERN = './i18n/locales/@LOCALE@.json';
export const LOCAL_FETCH_PATTERN = './i18n/locales/@LOCALE@.json';
`;
    },
  };
}

function debugProxyPlugin(): Plugin {
  return {
    name: 'debug-proxy',
    configureServer(server) {
      server.middlewares.use('/debug-proxy', (req, res) => {
        const url = new URL(req.url || '', 'http://localhost');
        const targetHost = url.searchParams.get('host') || 'localhost:9222';
        const endpoint = url.searchParams.get('endpoint') || '/json';
        const [hostname, port] = targetHost.includes(':')
          ? targetHost.split(':')
          : [targetHost, '9222'];

        const proxyReq = http.get({
          hostname,
          port: parseInt(port, 10),
          path: endpoint,
          timeout: 5000,
        }, (proxyRes) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          proxyRes.pipe(res);
        });
        proxyReq.on('error', () => {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({error: `Cannot connect to ${targetHost}`}));
        });
      });
    },
  };
}

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: [
      {find: /^\.\.\/\.\.\/design_system_tokens\.css$/, replacement: path.join(frontEndDir, 'design_system_tokens.css')},
      {find: /^\.\.\/\.\.\/application_tokens\.css$/, replacement: path.join(frontEndDir, 'application_tokens.css')},
      {find: /^\.\.\/\.\.\/core\/(.*)/, replacement: path.join(frontEndDir, 'core/$1')},
      {find: /^\.\.\/\.\.\/generated\/(.*)/, replacement: path.join(frontEndDir, 'generated/$1')},
      {find: /^\.\.\/\.\.\/ui\/(.*)/, replacement: path.join(frontEndDir, 'ui/$1')},
      {find: /^\.\.\/\.\.\/models\/(.*)/, replacement: path.join(frontEndDir, 'models/$1')},
      {find: /^\.\.\/\.\.\/panels\/(.*)/, replacement: path.join(frontEndDir, 'panels/$1')},
      {find: /^\.\.\/\.\.\/foundation\/(.*)/, replacement: path.join(frontEndDir, 'foundation/$1')},
      {find: /^\.\.\/\.\.\/Images\/(.*)/, replacement: path.join(frontEndDir, 'Images/$1')},
      {find: /^\.\.\/\.\.\/third_party\/(.*)/, replacement: path.join(frontEndDir, 'third_party/$1')},
      {find: /^\.\.\/\.\.\/entrypoints\/(.*)/, replacement: path.join(frontEndDir, 'entrypoints/$1')},
      {find: /^\.\.\/\.\.\/services\/(.*)/, replacement: path.join(frontEndDir, 'services/$1')},
    ],
  },
  plugins: [
    devtoolsCssPlugin(),
    devtoolsImagesPlugin(),
    devtoolsLocalesPlugin(),
    debugProxyPlugin(),
  ],
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [frontEndDir, __dirname],
    },
  },
});
