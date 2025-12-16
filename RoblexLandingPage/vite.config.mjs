import { defineConfig } from 'vite';
import path from 'node:path';

const bufferUtilsPath = path.resolve(
  __dirname,
  'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js',
);

const allowedHosts = [
  'localhost',
  '127.0.0.1',
  'roblexio-production-8643.up.railway.app',
];

export default defineConfig({
  preview: {
    allowedHosts,
  },
  resolve: {
    alias: {
      'three/examples/jsm/utils/BufferGeometryUtils.js':
        path.resolve(__dirname, 'src/shims/BufferGeometryUtils.js'),
      'three/examples/jsm/utils/BufferGeometryUtils.js?real': bufferUtilsPath,
    },
  },
});
