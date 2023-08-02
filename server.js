// const screenshot = require('screenshot-desktop');
// const express = require('express');
// const socket = require('socket.io');
// const http = require('http')

import screenshot from 'screenshot-desktop';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import images from 'images';

/*
https://github.com/topics/desktop-duplication-api
c# https://github.com/smasherprog/screen_capture_lite
nodejs调用dll: edge  https://www.cnblogs.com/DamonCoding/p/8379509.html

nodejs打包为exe: pkg https://zhuanlan.zhihu.com/p/66411743
pkg -t win server.js
{"tag":"v3.4","name":"node-v16.16.0-win-x64"}
https://github.com/vercel/pkg-fetch/releases
C:\Users\Administrator\.pkg-cache\v3.4\fetched-v16.16.0-win-x64
*/

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: true,
});
app.use(express.static('./'));

// 截图开关
let screenshotFlag = false;
// 是否正在截图
let isScreenshot = false;

io.on('connection', (socket) => {
  // 切换开始|停止截图开关
  socket.on('toggleScreenshot', (flag) => {
    screenshotFlag = flag;
    if (flag) {
      startScreenshot();
    } else {
      isScreenshot = false;
    }
  });

  // 截一张图
  socket.on('takOne', async () => {
    await doScreenshot();
  });
});

/** 开始截图 */
async function startScreenshot() {
  try {
    if (isScreenshot) return;
    isScreenshot = true;
    while (screenshotFlag) {
      const t = +new Date();
      await doScreenshot();
      console.log(+new Date() - t);
    }
  } catch (e) {
    console.log(e);
  }
}

/** 截图+压缩+发送 */
async function doScreenshot() {
  try {
    const buffer = await screenshot();
    const minBuffer = images(buffer).resize(300).encode('jpg', { operation: 50 });
    io.emit('screenshot', minBuffer);
  } catch (e) {
    console.log(e);
  }
}

server.listen(8089, () => {
  console.log('server...');
});
