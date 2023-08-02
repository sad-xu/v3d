import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import px2rem from 'postcss-pxtorem';

const isDev = process.env.NODE_ENV == 'development';

export default defineConfig({
  server: {
    port: 8088,
    host: true,
    open: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8089',
        ws: true,
      },
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    postcss: {
      plugins: [
        // css 前缀补全
        autoprefixer(),
        // px2rem
        px2rem({
          rootValue: 100, // 换算基数
          unitPrecision: 5,
          propList: ['*'],
          exclude: /(node_module)/,
          mediaQuery: false,
          minPixelValue: 3,
        }),
      ],
    },
  },
  build: {
    // css 不拆分文件
    cssCodeSplit: false,
    minify: 'esbuild',
  },
  esbuild: {
    // 去除console
    drop: isDev ? [] : ['console', 'debugger'],
  },
});
