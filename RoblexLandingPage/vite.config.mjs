import { defineConfig } from 'vite';
import path from 'node:path';

const bufferUtilsPath = path.resolve(
  __dirname,
  'node_modules/three/examples/jsm/utils/BufferGeometryUtils.js',
);

export default defineConfig({
  appType: 'mpa',
  preview: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        adminLogin: path.resolve(__dirname, 'admin/login/index.html'),
        login: path.resolve(__dirname, 'login/index.html'),
        register: path.resolve(__dirname, 'register/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      'three/examples/jsm/utils/BufferGeometryUtils.js':
        path.resolve(__dirname, 'src/shims/BufferGeometryUtils.js'),
      'three/examples/jsm/utils/BufferGeometryUtils.js?real': bufferUtilsPath,
    },
  },
});
