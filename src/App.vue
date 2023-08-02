<template>
  <div
    class="menu"
    :style="{
      opacity: showMenu ? 1 : 0,
    }"
    @click="showMenu = !showMenu"
  >
    <button @click.stop="handleScreenshot">截图</button>
    <button @click.stop="handleStart">开始</button>
    <button @click.stop="handleStop">停止</button>
    <button @click.stop="handleToggleFilter">去除绿幕</button>
  </div>
  <!-- <spam class="log">{{ logTime }}</spam> -->
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { Texture } from '@pixi/core';
  import { Application } from '@pixi/app';
  import { Sprite } from '@pixi/sprite';
  import { Container } from '@pixi/display';
  import { io } from 'socket.io-client';
  import lvmu from '@/assets/lvmu.jpg';
  import ColorReplaceFilter from '@/utils/colorReplace';

  const showMenu = ref(false);
  const logTime = ref(0);

  const isDev = process.env.NODE_ENV == 'development';
  const socket = io(isDev ? 'http://192.168.1.2:8089' : '');

  const app = new Application({
    resolution: window.devicePixelRatio || 1,
    antialias: true,
    resizeTo: window,
  });
  // app.view.style.width = window.innerWidth + 'px';
  // app.view.style.height = window.innerHeight + 'px';

  document.body.insertBefore(app.view as any, document.getElementById('app'));
  let texture = Texture.from(lvmu);
  const container = new Container();
  // container.filters = [new ColorReplaceFilter(0x66ff33, 0x000000, 0.4)];
  app.stage.addChild(container);
  for (let i = 0; i < 4; i++) {
    const bunny = new Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 2 === 0 ? 120 : 0) * (i <= 1 ? 1 : -1);
    bunny.y = (i % 2 === 0 ? 0 : 160) * (i <= 1 ? 1 : -1);
    bunny.angle = 90 + i * 90;
    bunny.width = 200 * 1.3;
    bunny.height = 112 * 1.3;
    container.addChild(bunny);
  }

  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // app.ticker.add((delta) => {
  //   container.rotation += 0.05 * delta;
  // });

  let imgEl = null;
  let isOK = true;
  /** 更新纹理 平均耗时1.3ms */
  function updateTexture(buffer: ArrayBuffer) {
    if (!isOK) return;
    isOK = false;
    imgEl = null;
    imgEl = document.createElement('img');
    imgEl.src = URL.createObjectURL(new Blob([buffer], { type: 'image/jpeg' }));
    const newTexture = Texture.from(imgEl);
    container.children.forEach((item: any) => {
      item.texture = newTexture;
    });
    newTexture.update();
    isOK = true;
  }

  // 接收截图数据
  socket.on('screenshot', (buffer: ArrayBuffer) => {
    const t = performance.now();
    updateTexture(buffer);
    logTime.value = performance.now() - t;
  });

  /** 截一张图 */
  const handleScreenshot = () => {
    socket.emit('takOne');
  };

  /** 开始 */
  const handleStart = () => {
    socket.emit('toggleScreenshot', true);
  };

  /** 停止 */
  const handleStop = () => {
    socket.emit('toggleScreenshot', false);
  };

  /** 切换绿幕滤镜 */
  const handleToggleFilter = () => {
    if (container.filters) {
      container.filters = null;
    } else {
      container.filters = [new ColorReplaceFilter(0x66ff33, 0x000000, 0.4)];
    }
  };
</script>

<style lang="scss">
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
  }

  #app {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .menu {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.3s;

    button {
      width: 50vw;
      height: 10vh;
    }
  }

  .log {
    position: absolute;
    bottom: 0;
    color: #fff;
  }
</style>
