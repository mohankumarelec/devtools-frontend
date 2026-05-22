import {defineConfig} from 'vite';
import * as path from 'node:path';

const genDir = path.resolve(__dirname, '../out/Default/gen/front_end');

export default defineConfig({
  root: __dirname,
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [genDir, __dirname],
    },
  },
});
