---
title: Express 设计原理
lang: zh-CN
date: 2022-11-12
excerpt: 许多代码框架被广泛地使用，除了代码的健壮性和强大功能的同时，还必须保证足够简单和强扩展能力。在本文中，以一个流行的类库为例，来研究它是如何通过设计模式来满足这个要求，这个类库就是 NodeJS Web 服务框架 express，这里主要是对中间件与路由部分的设计和实现，进行剖析。
categories:
  - 技术
---

> 从设计的角度去理解 express 的路由（routing）、中间件（middleware）是如何实现的。

### 前言

许多代码框架被广泛地使用，除了代码的健壮性和强大功能的同时，还必须保证足够简单和强扩展能力。
在本文中，以一个流行的类库为例，来研究它是如何通过设计模式来满足这个要求，这个类库就是 NodeJS Web 服务框架 express，这里主要是对中间件与路由部分的设计和实现，进行剖析。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171719317.png)
首先，如果目前你对 express 不熟悉，这里简单介绍一下，这是一个轻量且灵活的 NodeJS Web 应用框架，它能够给 web 或移动应用提供一系列强大的功能，如果你没有 express 的开发经验，可以通过以下的指令去生成一个 express 项目进行体验：

```
npx express-generator
```

执行这个指令后，会生成一个 express web 应用的示例工程，里面会包括一些路由，中间件，比如这个`index.js`文件：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171719302.png)
可以看到，每个路由或中间件都是通过`app.use`进行注册，同时接收`path`参数和处理函数，这个处理函数包括 3 个参数：`request`和`response`，以及`next`，next 函数会转发 request 给下一个路由或中间件来处理。

### GOF

Express 的路由机制是基于[Gang of Four](https://springframework.guru/gang-of-four-design-patterns/)（介绍软件设计模式的书，简称 GOF）23 种设计模式其中的一种，如果你对设计模式还不熟悉，特别是 GOF 里面讲到的设计模式，这里会简单介绍一下。

> **软件设计模式是用来解决同类问题的可复用解决方案，不过它不是指代码片段，而是一种可以帮助我们解决特定的问题或同类问题的方法模板。**

GOF 的作者， Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides 在书中提出了 23 种软件设计模式的概念，其中有一种叫**责任链设计模式**（the Chain of Responsibility），而 express 的路由实现正是基于这种设计模式。

### 责任链设计模式

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171719351.png)

在 GOF 中，责任链设计模式是行为设计模式中的一种，虽然它不是被经常使用的设计模式，但是在 Express 中却是相当重要。
首先，**责任链设计模式的目标是，避免请求发送者和接收者的耦合，同时让多个对象都有机会能够处理这个 request**，也就是说，该模式能够沿着一条处理链来传递 request，当接收到这个 request 时，这条链路上的每个 handler 能够决定是处理这个 request，也可以传递给下一个 handler 进行处理，用 UML 来表示：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171719065.png)
通过 UML 图可以看出，该设计模式由不同部分组成：

- **Handler**，处理类的抽象接口，比如包含 HandleRequest 方法。
- **ConcreteHandler**，Handler 抽象类的具体实现，它负责转发 request 给下一个 handler，或者是选择处理这个 request。
- **Client**，则是用来初始化 request 给 handler 进行处理。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720933.png)
理解了责任链设计模式，再看看 express 的路由架构到底是如何实现的。
首先，express 是一个开源的代码库，可以通过源代码来学习它是如何实现的，从这里可以获取到[express 的源代码](https://github.com/expressjs/express)：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720516.png)
express 路由和中间件都是一个**Layer**，每个 Layer 会包括`path`，`options`和`fn`函数，同时这个函数接收了 3 个参数：`request`，`response`和`next function`。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720750.png)
可以看到，在`handle_request`函数中，会执行在创建 Layer 时传入的`fn`函数。
在 express 中，可以使用`app.use`来注册中间件或路由，每个中间件或路由都是一个 handler，再回到源代码中，`use`函数会创建一个 Layer 对象，然后再将这个对象会推入栈中，并且这个栈是保存了所有的 Layer 对象：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720634.png)
结合 UML 图，可以看出：

- UML 中的**Handler**对应的就是一个 Layer 这个抽象类。
- UML 中的**ConcreteHandler**就是由 Layer 实例化处理的对象。
- 所有**ConcreteHandler**会被有序地保存到一个栈中。

然后，在责任链设计模式中，目前还缺少一个**Client**，继续分析 express 的源代码：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720331.png)
在`handle`这个函数中，首先会初始化参数和处理 OPTIONS 请求和 CORS 预检请求，但是只需要关注最后的 next 函数：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720431.png)
在这个 next 函数中，有个`while`循环，和一个局部变量`idx`：用于判断栈是否完成遍历，而`index`则表示在这个栈中的 Layer。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171720417.png)
最后通过`self.process_params`来调用`layer.handle_request`，传入 request、response 和 next，并且会循环遍历栈时，idx 会自增，直到 idx 大于栈的长度，则表示结束。
当然，这并不是 express 的全部代码，比如在执行 handler 之前，会校验路由的参数是否匹配。

### 总结一下

express 路由是基于责任链设计模式来支持中间件的处理，回顾一下这个设计模式：

- **Handler**，在 express 对应的是 Layer 这个类。
- **ConcreteHandler，**对应的是中间件和路由。
- **use**函数，是向责任链中添加路由和中间件，并且按照注册顺序来执行。
- **Client**，是初始化责任链中 handler。
- 在 express 中，通过使用`next()`的调用，来执行下一个**ConcreteHandler 函数。**
