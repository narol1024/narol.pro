---
title: Webpack原理系列-模块热更新
lang: zh-CN
date: 2022-03-17
excerpt: Hot Module Replacement（HMR）这项技术提升了前端的开发效率，也使它成为许多前端构建工具的基础能力之一，它最早是 Webpack 项目的 issue 里提出，Webpack 的作者sokra认为，HMR 这项技术的实现是建立在模块化标准之上，感兴趣的同学可以到这个issue了解 HMR 是如何被提出来，以及作者又是如何思考这项技术的设计和实现。

categories:
  - 技术
---

Hot Module Replacement（HMR）这项技术提升了前端的开发效率，也使它成为许多前端构建工具的基础能力之一，它最早是 Webpack 项目的 issue 里提出，Webpack 的作者[sokra](https://github.com/sokra)认为，HMR 这项技术的实现是建立在模块化标准之上，感兴趣的同学可以到这个[issue](https://github.com/webpack/webpack/issues/26)了解 HMR 是如何被提出来，以及作者又是如何思考这项技术的设计和实现。

理解 HMR 背后的实现原理，需要先从全局视角来认识它，这里引入一个 Webpack 示例工程，示例代码已托管到[Github](https://github.com/inarol/jsnotes/tree/main/examples/webpack-hmr-demo)。

```
├── esm
│   ├── a.js
│   └── main.js
├── webpack.config.js
```

![img](https://picx.zhimg.com/80/v2-b2520b2347dadb424dc8473708312de6_1440w.jpg?source=d16d100b '图 1')

![img](https://picx.zhimg.com/80/v2-71f0e737a3449272fb684c4247ef7c50_1440w.jpg?source=d16d100b '图 1')

## HMR 的工作流程

使用 webpack-cli 的 serve 指令启动项目，进入开发调试模式，此时 Webpack 会保持对文件变化的监听：

![img](https://picx.zhimg.com/80/v2-38acf1f1fa6e232e5497cc271caecdce_1440w.jpg?source=d16d100b '图 1')

在启动成功之后，使用浏览器访问：http://localhost:8080/，此时控制台会出现以下的日志，表示 HMR 已启用成功：

```
[HMR] Waiting for update signal from WDS...
[webpack-dev-server] Hot Module Replacement enabled.
[webpack-dev-server] Live Reloading enabled.
```

修改 a.js：Hello -> Hello World，在无刷新操作的情况下，会自动更新页面的内容，这就是 HMR 工作的整个过程。

![img](https://picx.zhimg.com/80/v2-1c49a532890bead1f6ebef50e1e3365e_1440w.jpg?source=d16d100b '图 1')

开发体验看起来很酷，不过有几点疑惑：

- 在日志里可以看到，HMR Runtime 在静默等待 WDS（Webpack-Dev-Server）发来的信号，那它们之间是如何协助的？
- 更新 a.js 模块之后，浏览器没有 Reload，Webpack 是如何知道在运行时需要更新并运行哪个模块的？

要回答上面几个问题，需要先理解 Webpack-Dev-Server 是如何向客户端交付前端的静态资源。

### Webpack-Dev-Server

在开发调试阶段，构建工具一般都会提供静态资源服务器，目的是能够持续且快速地交付每次编译完成的静态资源，而不是写入到磁盘文件系统中，[Webpack-Dev-Server](https://github.com/webpack/webpack-dev-server)就是 Webpack 提供的静态资源服务器，以下都用 WDS 表示。

在启动构建后，Webpack 会将创建好的 Compiler 传入给 WDS，不过 WDS 仅仅是一个用 express 创建静态服务器，因此它最终会透传给另外一个中间件依赖：[Webpack-Dev-Middleware](https://github.com/webpack/webpack-dev-middleware)，以下都用 WDM 表示，它是 express 的中间件，主要是处理 Compiler 产物：

![img](https://pic1.zhimg.com/80/v2-1ebe333b20493cbe49f131a1c4620846_1440w.jpg?source=d16d100b '图 1')

在更新 a.js 模块之后，Webpack 会重新触发 Compiler 的编译，从 [Webpack 原理系列-分析构建流程](https://zhuanlan.zhihu.com/p/469330693) 这篇文章提到过，Compiler 会交付编译完的 assets，不过在开发模式下，为了性能考虑，assets 不会直接写入到磁盘文件系统中，而是使用[memfs](https://github.com/streamich/memfs)将 assets 写入内存文件系统中，编译产物从内存读取始终比磁盘读取要快，整个过程用图来描述：

![img](https://pic1.zhimg.com/80/v2-ba417c48a7737172d5752133b414e256_1440w.jpg?source=d16d100b '图 1')

以上便是完整产物的交付过程，不过 HMR 这项特性是指某个模块代码变化之后，给客户端下发最新的模块代码，因此就涉及到两个过程，**Bundle 的下发和模块的更新**。

### Bundle 的下发

在开发调试模式（开启 hot），Webpack 会向客户端环境注入跟 HMR 相关的 Runtime 代码：

- **webpack/hot**和**webpack/lib/hmr** 执行新模块代码更新的相关实现。
- **webpack-dev-server/client/index.js** （以下简写成 wds/client）实现客户端与服务端的通信，建立 Websocket 连接后，服务端能够推送最新 Bundle 信息，以及客户端的 fetch 请求和加载最新模块信息和代码。

用浏览器访问示例工程，在 Network 面板上可以追踪到 Bundle 的下发过程：

![img](https://picx.zhimg.com/80/v2-5a47c8aed27dcb7435b62165876d149c_1440w.jpg?source=d16d100b '图 1')

首次编译后访问

![img](https://picx.zhimg.com/80/v2-1d6c71b6883caecd6f404eb14f891e2c_1440w.jpg?source=d16d100b '图 1')

a.js 内容变化之后

主要的过程如下：

1. 首先，浏览器与服务端建立 Websocket 连接。
2. 在模块代码变化后，Webpack 触发 Compiler 重新编译，构建完成后得到新的 Chunk（assets），WDS 在捕获到到这个事件后，通知浏览器有新的热模块更新。
3. 客户端收到步骤 2 的消息后，会执行以下的流程：调用 reloadApp -> emit webpackHotUpdate -> 调用 hot.check -> 拉取新模块信息（xx.hot-update.json）-> 使用 JSONP 加载新的 Bundle 代码（xx.hot-update.js）。

![img](https://picx.zhimg.com/80/v2-03982438a5f37bd6201b12343ad7f1eb_1440w.jpg?source=d16d100b '图 1')

### 模块更新

服务端下发的 Chunk 代码是一个自执行函数，函数有 3 个参数，分别是**chunkId**、以**模块相对路径为 ID 的最新模块代码**，以及 webpackRuntimeModules：

![img](https://pic1.zhimg.com/80/v2-7c730e105702db13034caee971eae63f_1440w.jpg?source=d16d100b)

以这个函数执行为线索，最终找出定义的位置：

以函数名为线索，最终找到函数的定义是在 webpack/lib/hmr/JavascriptHotModuleReplacement.runtime.js，它是 Webpack 会向浏览器环境中注入的 Runtime 代码：

![img](https://pic1.zhimg.com/80/v2-d1bd6492f82db6b6320aa1134116f3d4_1440w.jpg?source=d16d100b '图 1')

- **chunkId** 处理 Chunk 的状态，调用 waitingUpdateResolves 后表示该 Chunk 已完成加载。
- **moreModules** 新的模块代码实现，会以 moduleId 为 key 存放到 currentUpdate 对象中。
- **runtime** 刷新当前编译的 hash 值，在拉取最新的 Chunk 时，是使用旧 hash + chunk name 的规则向服务端发起请求。

在下发新的 Chunk 时，Webpack HMR 会初始化一个 currentUpdateApplyHandlers=[]，同时会向这个数组推入一个能够更新当前模块代码的 applyHandler，在 Chunk 加载完成后， 会遍历该数组执行每个 applyHandler，每个 applyHandler，主要以下两项操作：dispose 和 apply。

- dispose 清除旧模块和子依赖模块。
- apply 执行最新的模块代码。

在执行这两项操作前，会先确认当前模块是否需要执行 dispose 和 apply，比如 entry 的代码更新，就会被标识为 unaccepted，及表示不做处理，具体的判断逻辑在这里：[getAffectedModuleEffects](https://github.com/webpack/webpack/blob/d3cd4cb6e38338237fe722d4b7feae2244c425c5/lib/hmr/JavascriptHotModuleReplacement.runtime.js#L27)。

**执行 dispose 时**，会遍历所有的 outdatedModules，对每一个模块及其子依赖执行清理的工作，并且触发 module.hot.dispose 的调用。

**执行 apply 时**，会遍历所有的 outdatedDependencies，并且触发 module.hot.accept 的调用，此时 HMR 会重新 require 在 accept 的模块依赖和执行回调函数。

accept 的回调函数非常重要，它相当于是 Webpack HMR 暴露给开发者的 API，表示**新模块已完成替换的时机**，在一些框架实现组件热更新时会使用到。

## 主流框架 HMR 实现

很明显，我们不可能像示例工程那样，给每个模块都写对应的更新逻辑，在主流的前端框架中 ，比如 React/Vue 的构建生态中，都已支持 HMR，且对于使用框架的开发者是开箱即用的，那么它们都是如何实现的？

### Vue-loader

使用 Vue 的同学对[vue-loader](https://vue-loader.vuejs.org/guide/#vue-cli)肯定不陌生，在 Webpack 中，配置对应的 loader 后，构建工具会对.vue 文件进行解析。以下是在开启 HMR 后，vue-loader 在解析完.vue 后，会注入[HMR Runtime](https://github.com/vuejs/vue-loader/blob/v16.8.3/src/index.ts#L289-L291)（Vue 3.x）代码：

![img](https://pic1.zhimg.com/80/v2-89e71864d5932a97224ce57e9ab19435_1440w.jpg?source=d16d100b)

在注入的代码里面可以看到，注册了两个 accept，这是因为一个 SFC 会包括 template、script 等部分，而 template 会被单独编译成一个模块，因此需要另外注册一个 accept 来收集 template dependency，并且在 accept callback 里调用 rerender 来刷新视图。

使用 HMR 来更新组件的细节比较多，但核心就是调用 Vue Component 实例的 update 函数，感兴趣可以深入研究：[packages/runtime-core/src/hmr.ts](https://github.com/vuejs/core/blob/v3.2.31/packages/runtime-core/src/hmr.ts)。

### **React Fast Refresh**

在 React 16.9.0+之后，React 团队框架层提供了一个新的模块（[react-refresh](https://github.com/facebook/react/tree/main/packages/react-refresh)）来支持 HMR，动机是能够更好地支持函数组件和 React Hook，同时满足平台的无关性（比如支持 React-Native），而官方推荐一个基于 Webpack 的实现：[react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)，当前它被默认集成到[create-react-app](https://create-react-app.dev/)脚手架中。

react-refresh 提供了两个模块：

- 编译时 Loader：**react-refresh/babel**
- 运行时 API：**react-refresh/runtime**

Loader 的作用是使用 Babel 分析出所有的函数组件和 hook 定义，比如原组件：

![img](https://picx.zhimg.com/80/v2-cfed40f2d2930688711ea2495ef51296_1440w.jpg?source=d16d100b)

在 Babel 和 Loader 编译转换之后：

![img](https://picx.zhimg.com/80/v2-79277e14c38755de42c25be2cb795bd5_1440w.jpg?source=d16d100b)

其中\_c 是函数组件的引用，\_s 是创建组件内的 hook 签名。

而 react-refresh/runtime 提供了几个 API：

- register(type, id)，即上文的\_c，以组件引用和组件名创建一个更新对象 family，并推入到 pendingUpdates 更新队列中。
- setSignature(type, key) 即上文的\_s，注册组件内的 hooks 签名，如果组件内的 hooks 发现变化，比如 useState 改为 useReducer，签名也会发生变化。
- performReactRefresh 执行 pendingUpdates 更新队列，完成组件的刷新。

而 react-refresh-webpack-plugin 会向客户端注入 HMR Runtime 代码：

![img](https://pic1.zhimg.com/80/v2-86f0338b359cf2a2da8a6678e7a74661_1440w.jpg?source=d16d100b)

在 Webpack HMR 推送新的 Bundle 之后，由于 accept 没有声明依赖，所以注入的 HMR Runtime 代码会重新被执行，然后调用 enqueueUpdate，最后会调用 react-refresh 的 performReactRefresh 函数，从而执行组件的刷新。

由于组件更新是基于[react-reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler)，也就意味着组件更新实现是与平台无关，因此这个插件在 React-Native 环境下也能使用，前提是需要 Webpack 构建能够支持 React-Native 环境，感兴趣可以关注这个[github 项目](https://github.com/callstack/repack)。

## 总结

Webpack 的 HMR 实现过程较为复杂，涉及到 Compiler，Webpack-Dev-Server 及中间件的协助过程，以及模块更新的实现，在主流框架中，都是基于 module.hot.accept 和框架内部的 Update 接口，来实现组件的热更新。

细节比较多，很难讲得全面，不过我们理解主要的实现过程，就能帮助我们在开发过程快速定位问题。
