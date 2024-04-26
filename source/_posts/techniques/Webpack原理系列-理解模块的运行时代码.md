---
title: Webpack原理系列-理解模块的运行时代码
lang: zh-CN
date: 2022-03-08
excerpt: 我们先使用 CommonJS 模块规范的项目工程来构建，因为它的构建产物代码更简单，减少一些概念，方便理解。
categories:
  - 技术
---

我们先使用 CommonJS 模块规范的项目工程来构建，因为它的构建产物代码更简单，减少一些概念，方便理解。

```
├── commonjs
│   ├── counter.js
│   └── main.js
├── webpack.config.js
```

打包入口文件是 main.js ，它导入 counter.js 模块，在构建之后得到 JS 产物（使用 development mode），主要分为 4 个部分：

1. 初始化一个**webpack_modules**的 Map 对象，用于存放各个模块的定义和实现。
2. 定义一个非常重要的**webpack_require**函数及 **webpack_module_cache** 。
3. 在**webpack_require**这个构造函数上定义一些方法，但这部分是非必要的，可能会没有。
4. 加载 entry 的模块代码。

## 模块 Runtime 代码详细分析

![img](https://picx.zhimg.com/80/v2-9c2b3e396f6cd0c9693923e502b42746_1440w.jpg?source=d16d100b)
首先**webpack_modules**是一个 Map 对象， Key 是 moduleId，**Value 是一个包裹模块体的函数**（不是模块代码），可以看出函数里面的代码本身符合 CommonJS 的模块规范，只不过 Webpack 在上层函数创建了一个 module 对象并且导入进去，而 NodeJs 下的 module 则是由 global 来提供。
![img](https://pic1.zhimg.com/80/v2-4d1848c172782cb01e3a9e834dd5d0ce_1440w.jpg?source=d16d100b)  
第 3 行，初始化**webpack_module_cache**(Webpack@4.x及之前叫 installedModules)对象，用于存放加载过的模块，相当于模块缓存池，在下次访问时可以直接返回缓存里面的模块对象，也避免了对象重复加载的情况，相关实现是在 8-11 行，代码比较简单，这里不赘述。  
继续往下看有个**webpack_require**函数，它接收 moduleId， 从字面上理解是模块标识的意思，最后的返回值是 module.exports，这里只需要知道它是能够访问模块上下文环境的对象即可，下面会详细介绍。  
13-17 行的代码 初始化一个 module 对象，并存入到**webpack_module_cache**中，这里看到声明了一个 exports 空对象，也就是上面提到的 module.exports。

**20 行的代码非常重要**，从**webpack_modules**用 moduleId 找到对应的模块包裹函数后，并传入刚创建的 module 对象、module.exports 和**webpack_require**，最后执行它，而在包裹函数里面，模块的内部变量，函数会写入到 module.exports 中。

![img](https://pica.zhimg.com/80/v2-d1c411560d6a0a437a843d69c0e5d53a_1440w.jpg?source=d16d100b)

第 2 行**webpack_exports**在本次打包中没用到，可以忽略。  
第 4 行开始就是执行 Entry 模块的代码，用 IIFE 函数执行 Entry 模块的代码。  
第 8 行可以看到用到了**webpack_require**函数，且传入了./commonjs/counter.js 这个 moduleId，最终返回了 mod 对象，其实它就是 module.exports。  
整体实现比较清晰简单，Webpack 短短几十行代码就让浏览器环境支持 CommonJS 模块规范的代码，可谓短小精悍。

## ES modules 与 CommonJS 规范的打包代码差异

上面是用 CommonJS 模块的规范代码工程，在经过 Webpack 构建打包后，产物的实现还是比较清晰，这是因为 CommonJS 对于模块导出进行类似「浅拷贝」的操作，Webpack 巧妙地向模块中注入了 module 对象就能实现对 CommonJS 模块的支持。

但我们知道**ES modules（以下简称 ESM）是需要保持对导出模块的引用关系**，因此实现上跟 CommonJS 并不一样，相对复杂一些。

```
├── esm
│   ├── counter.js
│   └── main.js
├── webpack.config.js
```

对使用 ESM 模块规范编写的代码工程进行构建打包后，来分析一下产物代码：

![img](https://pic1.zhimg.com/80/v2-df2f5720bd60e4770ce07a3b7e94d6fa_1440w.jpg?source=d16d100b)

**webpack_modules**仍然是一个 Map 对象， 存放各个模块的定义和实现，但 Value 包裹函数传入的参数不再是 module，还包括两个参数**webpack_exports**和**webpack_require**。

重点关注**webpack_exports**对象，可以看出与之前不一样，模块体里面不再使用 module 对象，而是用到了由外部导入的 module.exports 。  
module.exports 是由**webpack_require**函数创建的对象，也就是说该模块不管被哪个模块导入，这个对象都保存在由**webpack_require**这个函数的执行上下文中，也就达到「模块需要保持对导出模块的引用关系」的特性。

我们再对比 CommonJS 模块的代码：

![img](https://picx.zhimg.com/80/v2-3c4b3bcc730e59f88515046cb8ba92ab_1440w.jpg?source=d16d100b)

因为是用 module 对象传入到模块体中，因此其他模块 import 该模块时，访问到的模块导出对象（即 module.exports）是**webpack_require**执行上下文环境的变量，而该对象又是在模块体内进行赋值操作的，所以就产生类似「浅拷贝」的操作，即原始值拷贝，引用类型则保持引用，

而 ESM 模块规范的代码是直接导入的是 module.exports，这个对象最终被**webpack_require**上下文环境持有，并且导出使用，所以不管在哪里用，都是同个对象。  
继续看下去，下面执行两个函数，分别是：

- **webpack_require**.r （注意，这个 r 不是 require 的意思） ，看[源码](https://github.com/webpack/webpack/blob/main/lib/RuntimeGlobals.js#L113-L116)可以了解到，应该是理解为「responsive」的意思，目的是让标记当前模块是 ESM 规范，能够让这个模块能支持 ESM 和 CommonJS 混用的情况，下文再详细介绍。
- **webpack_require**.d 函数的参数 1 是**webpack_exports**对象，参数 2 是 Map 对象，Key 是导出的模块索引（变量名或函数名等），Value 是一个函数。

具体看下**webpack_require**.d 的实现：

![img](https://pica.zhimg.com/80/v2-836ed093e80303f1efca8eeafcac714b_1440w.jpg?source=d16d100b)

IIFE 里面在**webpack_require**函数上定义了 d 函数， 它是 definePropertyGetters 的缩写，从注释也能看出来，主要是给 harmony exports（即 ESM，harmony 是 ECMAScript 给 ES6 取的代号）定义了模块的变量或方法等，其中的**webpack_require**.o 是用来过滤 definition 和 exports 的自身属性，这样导出的模块成员就比较干净。

## 如何处理 ESM 和 CommonJS 混用的情况

本身不建议模块规范混用，但如果遇到了，也需要知其所以然。我们新建一个 mixed 目录，它是一个混用模块规范的代码工程。

```
├── esm
│   ├── counter.js
│   └── main.js
├── commonjs
│   ├── counter.js
│   └── main.js
├── mixed
│   └── main.js
├── webpack.config.js
```

mixed/main.js 会同时导入 commonjs 和 esm 的模块：
![img](https://pic1.zhimg.com/80/v2-d2d7d0083461e29172018d3dd8ef3e5e_1440w.jpg?source=d16d100b

来分析构建之后的产物，这里先看 Entry 模块的代码：
![img](https://pica.zhimg.com/80/v2-9ea048f3b985ac490c867d0aa5c8f1e1_1440w.jpg?source=d16d100b)

比较有意思的是，源代码我们只 import 了 2 次模块，产物里面却产生了 2 次**webpack_require**和 1 次**webpack_require**.n 的调用，那这个 n 函数的作用是什么？我们知道 CommonJS 规范中并没有定义 default 的实现，即默认导出，但 Webpack 为了能让 CommonJS 等不支持 default 的模块规范对 default 的访问，而作了兼容处理。  
继续看**webpack_require**下的两个方法，r 函数上文有提到，它的作用是向 module.exports 对象写入一个\_\_esModule 属性，来标记当前模块是符合 ESM 规范。而这个属性的作用就体现在**webpack_require**.n 函数中，该函数是用于获取模块的 default 变量，但它需要通过判断当前模块对象是否具有\_\_esModule 这个属性，如果有则从 module.exports 获取 default（ESM 规范），否则直接返回 module.exports 本身。

![img](https://picx.zhimg.com/80/v2-7f77dc193d364018e0c8402eb55a866e_1440w.jpg?source=d16d100b)

最后，细心的你可能会发现到，在 mixed/main.js 导入的 counter2 没有被使用，但产物里面还是包括了这部分的模块代码。  
这里需要理解为什么「Webpack 无法对 CommonJS 规范的代码进行 Tree-shaking 优化」这个问题的本质原因，简单讲是 Webpack 无法分析 CommonJS 模块中有无包括 side-effect（副作用）代码 ，所以只能被「安全」的引入，后面讲 Tree-shaking 时再详细介绍了。

参考文章：https://stackoverflow.com/questions/50943704/whats-the-purpose-of-object-definepropertyexports-esmodule-value-0  
代码链接：[jsnotes/examples/webpack-modules-runtime-demo at main · inarol/jsnotes](https://github.com/inarol/jsnotes/tree/main/examples/webpack-modules-runtime-demo)
