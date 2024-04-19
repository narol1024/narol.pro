---
title: 调试一个Nodejs的Socket问题
lang: zh-CN
date: 2021-08-24
excerpt: 最近在使用 React Native 调试时，遇到了一个 Bug，部分 Android 机在熄屏后抛出了 Socket 异常，看起来是这个异常因为未被捕获，而导致 NodeJS 进程崩溃
categories:
  - 技术
---

最近在使用 React Native 调试时，遇到了一个 Bug，部分 Android 机在熄屏后抛出了 Socket 异常，看起来是这个异常因为未被捕获，而导致 NodeJS 进程崩溃

```javascript
events.js:292
      throw er; // Unhandled 'error' event
      ^

Error: read ECONNRESET
    at TCP.onStreamRead (internal/stream_base_commons.js:209:20)
Emitted 'error' event on Socket instance at:
    at emitErrorNT (internal/streams/destroy.js:106:8)
    at emitErrorCloseNT (internal/streams/destroy.js:74:3)
    at processTicksAndRejections (internal/process/task_queues.js:80:21) {
  errno: -54,
  code: 'ECONNRESET',
  syscall: 'read'
}
```

简单快速的解决方案，是使用`process.on`佢捕获这个异常：

```javascript
process.on('uncaughtException', (err, origin) => {
  // error handling
});
```

但是这相当于全局捕获进程的异常，可能有些 socket 的异常退出进程才是预期，这个问题本质上是某个 socket 缺少对 error 的捕获，我们需要把它找出来，再对 error 进行处理即可。不过困难在于，异常堆栈有用的信息不多，需要我们通过 debug 找到这个 socket。

NodeJS Debug 的方式非常多，可以查看：[https://nodejs.org/en/docs/guides/debugging-getting-started/](https://nodejs.org/en/docs/guides/debugging-getting-started/) ，这里我们使用 Vscode 来调试，首先需要在工程目录下，创建`.vscode/launch.json`（[JavaScript Auto Attach]()也是一种非常不错的 debug 方式），配置如下：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "node-debug",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "node",
      "runtimeArgs": ["index.js"]
    }
  ]
}
```

并在侧栏找到调试面板，勾选`BREAKPOINTS`面板下的`Uncaught Exeptions`，最后启动调试，等待异常抛出后，就能获取到堆栈信息了：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404191726740.png)
找到关键信息`Socket._destroy`，但发现这里的堆栈包括了 NodeJS 的异步任务，无法通过断点返回到这个节点进行调试，此时只能在`<node_internal>/net.js`新增一个断点，触发断点后，在`DEBUG CONSOLE`输入`this`，可以获取当前的 socket 实例，这里可以通过逐个访问属性，查看`[[FunctionLocation]]`的位置，从而确认是哪个 Socket 的实例。
