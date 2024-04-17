---
title: 'Redux: 从入门到掌握-Part1'
lang: zh-CN
date: 2022-11-17
excerpt: 很多开发者喜欢往前端框架加入一些神秘的「面纱」，比如React，它能够直接地看到数据的流向，但这一切跟他们之前所了解的完全不一样。如果不知道这里面的实现，看起来确实比较神奇，就如 Arthur C. Clarke 说的：
categories:
  - 技术
---

> 本系列面向没有任何基础的 Redux 初学者，帮助开发者掌握 Redux，最后可以在项目中使用。
> 翻译自：[https://medium.com/@navaneeth.penumarthi/redux-complete-beginner-to-advanced-part-1-db0795cbba07](https://medium.com/@navaneeth.penumarthi/redux-complete-beginner-to-advanced-part-1-db0795cbba07)

## 为什么要 Redux？

在深入 Redux 之前，我们需要先理解什么是 Redux，为什么要使用 Redux？
**Redux**，是一个状态管理库，它是一个帮助开发者以更优雅，更一致的方式来管理状态。不过，问题是，Redux 是如何解决我们所面临的复杂问题。

## 假如没有 Redux

设想一下，在一个 React 大型 Web 应用中，包它含了很多组件，并且每一个组件都自己的状态。
此时，如果某一些组件，需要使用相同的数据时，我们可以会使用`props`来传递数据，这种方式对于只使用 3-5 个组件的应用来说，没有任何问题。然而，随着应用不断地迭代，变成一个大型应用时，每一个组件包含许多状态，而且状态之间又有关联，那么管理数据会变得非常麻烦，而且整个应用出现`prop drilling`问题。

## Prop drilling

我们考虑一种情况，一个 React 应用中有 10 个不同的组件，而且组件之间存在嵌套：

- component8 和 compont9 都需要使用在 App 这个组件下的状态变量。
- 另外，在 component5 会使用在 component9 进行更新的状态变量。

用一种图来表示就是：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171721715.png)

为了实现上面的目标，这个状态变量需要从 App 这个组件开始，一层层地传递，直到最终的子组件，显然，这种方式很繁琐，因此被称之为**prop drilling**。
为了解决这个问题，Redux 是通过集中式管理多个组件的状态到`store`中，如果某个组件需要状态，可以直接通过 store 获取到，并且还可以更新它，因此使用 Redux 之后，就不再需要通过组件的 props 来一层层传递数据了。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171721819.png)

## 一个例子

现在，我们都对 Redux 有一个大概的了解，接下来我们以一个例子来说明，如果理解这个例子之后，Redux 的所有概念都会变得非常的清晰。
假设一个银行里，有 4 个部门：

- **Account**，负责处理注册或删除账户。
- **Deposit**，负责存款到指定账户。
- **WithDraw**，负责从账号中提取金额。

那么客户无论什么时候想去银行注册或删除账户、办理存款和提款，只需要填写一份表格，清晰地表达处业务诉求，比如类似下面这几个表格：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171722754.png)
填完表格后，客户可能会提交给银行的接待员，之后接待员会复制一份这个表格，传给每个部门，每一个部门的经理会根据这个表格，确定这是不是他的业务范围内：

- 如果是，经理会从银行的数据库（**Central Database**）中处理对应的客户需求。
- 如果不是，经理就会选择忽略这个客户需求。

再比如，还有另外两个部门，比如「销售」和「营销」，他们会从客户的详细信息中（比如余额）进行分析，来帮助提升银行的绩效之类的，因此，这些部门是可以直接从**Central Database**中获取详情的数据信息。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171722616.png)

## 理解 Redux

如果你理解了上面的例子，现在就可以结合例子中的每个部门，去理解 Redux 的每一个概念。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171722480.png)

### Action Creators

一个`Action Creator`就是一个返回对象的函数，这个对象就是`action`。在上面的例子中，客户填写一个注册或删除账户，或存款或提款的表格，这个客户就是在 React 应用中，就是一个发 Action Creator 的组件，无论组件什么时候需要更新，它只需要发起一下 Action 就可以了。

### Actions

在 Redux 中，客户的表格对应的就是`action`，这个 action 会包含需要更新的数据，同时它是一个纯对象，包含两个属性：

- Type：这是 action 的必要字段，它决定了 action 的类型。
- Payload：这是可选的字段，比如携带需要更新的数据。

### Dispatch

在上面的例子中，客户填写的表格会递交给接待员，这个接待员再将表单复制一份提交给每一个部门，在 Redux 中，`dispatch`函数就是充当了这个角色。

### Reducers

在上面的例子中，我们有 3 个部门，每个部门就是一个`reducer`，在 Redux 中，reducer 是一个函数，同时它接收两个参数：

1. 当前的状态
2. action 对象

相关的 Reducer 会从 store 中获取或更新对应的信息。

## 总结

所以，组件无论什么时候通过调用`Action Creator`生成一个 action，而且必须是返回一个纯对象，同时这个对象必须包含`type`字段，然后这个 action 会分发给每一个 reducer。
然后每一个 reducer 会校验 action 的 type：

- 如果这个 reducer 是负责处理这个 type 的，它就会根据 action 的 payload 去更新 store。
- 如果不是，这个 reducer 就什么都不做。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171722088.png)

## 最后

Redux，刚接触可能会比较难理解，但是如果你读了这篇文章后，我详细你是可以理解为什么需要 Redux，以及它是如何工作的。
但是 Redux 的学习曲线才刚刚开始，你还需要实际去编写一些项目的代码。好了，这篇文章的篇幅不宜过长，可能会吓到刚刚学习 Redux 的小伙伴们，因此，给点时间好好消化一下，下个博客将使用上面的这些概念，编写一个 TODO 应用。
下面附上的链接是 github 链接，以及下一篇 blog 中的示例代码。

## Links

[Github Repo](https://github.com/RangerCreaky/notepad)
[Live Demo](https://phenomenal-paprenjak-d3300f.netlify.app/)
