---
title: 在React中，如何避免非必要的渲染
lang: zh-CN
date: 2020-11-20
excerpt: 虽然我们都喜欢有着良好性能和状态驱动的React，但是它并总是令人满意的，比如当你在构建一个很复杂的应用时，你总是会遇到「非必要的渲染」的问题陷阱，而且在大多数情况下，你可能还没发现这个问题。
categories:
  - 翻译
---

> 翻译自: [https://medium.com/@vitaliysteffensen/how-i-eliminate-all-unnecessary-rerenders-in-react-79505deeedea](https://medium.com/@vitaliysteffensen/how-i-eliminate-all-unnecessary-rerenders-in-react-79505deeedea)

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171729581.png)

虽然我们都喜欢有着良好性能和状态驱动的 React，但是它并总是令人满意的，比如当你在构建一个很复杂的应用时，你总是会遇到「非必要的渲染」的问题陷阱，而且在大多数情况下，你可能还没发现这个问题。

首先，我们需要深入理解是什么导致「非必要的渲染」这个问题，以及我们可以如何快速发现问题，然后，我们将深入研究有哪些技术方案可以避免「非必要的渲染」和什么时候应该使用它们，强烈建议你熟悉这里面的大多数技术方案，因为解决这个问题根本就没有「银弹」。

### 目录

1. [Ensure I don’t encode any infinite loops](https://medium.com/@vitaliysteffensen/79505deeedea#e86b)
2. [Use Dynamic Programming](https://medium.com/@vitaliysteffensen/79505deeedea#90dd)
3. [Use the useReducer hook](https://medium.com/@vitaliysteffensen/79505deeedea#9c50)
4. [Prevent unnecessary unmounting](https://medium.com/@vitaliysteffensen/79505deeedea#bcd8)
5. [Optimized useEffect dependencies](https://medium.com/@vitaliysteffensen/79505deeedea#8c32)

### 理解 rerender

我们都知道，当 React 状态变化时，所有的组件都会重新计算或和渲染，如果这个组件依赖外部状态，比如`props`，`context`或`hooks`，也是一样的。

但是还有一种情况，默认情况下，React 组件会因为父组件的 rerender，这个组件也会跟着 rerender。「rerender」相当于重新计算，浏览器可能不只绘制 HTML 节点，还会在重新运行`return`语句之前的所有函数调用，这意味着这些「rerender」会造成性能变差。

你可能已经听说过，有很多情况会导致触发 rerender，但我们要如何发现它们呢？你可能会像我一样，使用`console.log`发现这些情况，但是最近我了解到有一种更加高效的调试方式。
我发现，在[**React Developer Tools**](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)中有一个性能分析器，它可以记录你的应用在运行时所有的渲染数据，并且通过可视化的方式展示出来，你可以像下面这张图一样，开启这个性能记录器。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171730161.png)
这个工具会观察所有受到特别操作而影响的组件，然后通过点击组件树，可以查看组件的`props`和`state`。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171729749.png)

### 避免 rerender

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171729830.gif)

#### 1.确保没有「死循环」的代码

rerender 最典型的问题是，你的代码包含了「死循环」的代码，它会导致严重的性能问题，最后出现严重的运行时问题。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171729963.png)
**最常见的「死循环」代码有：**

- 在`useEffect`中更新依赖

```javascript
useffect({
	setSomeState()
}, [someState])
```

上面这例子是在一个 useEffect 里面将 state 作为依赖，但里面又去执行了 state 的更新，这会导致无限递归。

- 直接调用一个函数，而不是引用

```javascript
<button onClick={updateStateFunction()}>Click me</button>
```

上面的代码是在一个 onClick 属性上直接调用一个函数，一旦我们初始化 JSX，这个函数就会被调用，这意味着在渲染页面时，这个函数会被调用，然后导致 rerender，这个递归会一直调用下去，直到 React 抛出运行时错误。
为了避免这个问题，我们应该这样写：

```javascript
<button onClick={() => updateStateFunction()}>Click me</button>
```

或

```javascript
<button onClick={updateStateFunction}>Click me</button>
```

- 在`render`方法中，更新状态

如果你在 Class 组件里的`render`方法中调用了 setState，那么这会导致死循环，是因为我们在 render 方法中，更新了状态后会导致 rerender，下一次的渲染又会调用这个状态更新，然后又一次...知道 React 抛出运行时错误。所以，一个基本原则是，在 React 的 render 方法中，需要这是一个纯函数的处理。

#### 2.动态优化性能

我们知道，当 React 组件在 props 或 state 发生变化时就会 rerender，即使这个组件的 props 和 state 和之前是一样的值，组件仍然会被 rerender，另外，当父组件 rerender，子组件也会跟着 rerender。这两种情况，都导致了不必要的 rerender，因此 React 提供了两种方式在解决：

- [React.PureComponent](https://reactjs.org/docs/react-api.html#reactpurecomponent)

如果你在使用的是 React Class 组件，可以直接继承这个`PureCompoent`，它会对组件的 prop 和 state 进行浅对比来避免上面提到的 rerender 的问题。

- [React.memo](https://felixgerschau.com/react-performance-react-memo/)

React.memo 相当于是一个纯函数组件，它以 HOC（高阶组件）的形式来去包裹你的函数组件，同样也可以解决上面提到的问题，不过有个问题是，memoized 组件只会比较 props，而不包括 states 或 contexts

- 使用场景

使用`React.PureComponent`和`React.memo`，相当于是用用词来换取性能优化，所以你应该准确地使用它，这里有几个使用规则：

- 组件是确保这是一个纯组件
- 组件在相同的 props 和 state 会触发 rerender
- 组件总是发生 rerender

如果你的组件引入了副作用，然后它就不是纯组件或者说它不适合被 memoized，这里有常见的副作用：

- 修改任意外部变量（组件外部）或对象属性
- 记录日志并使用 console 打印
- 写入数据文件
- 向服务端写入数据
- 触发任意的外部进程
- 调用其他副作用函数
- 进行异步数据调用
- 是否使用了[非原始数据类型](https://www.javatpoint.com/javascript-data-types)？

`React.PureComponent`和`React.memo`不能使用非原始数据，原因是它们不能直接进行比较，比如这个例子：

```javascript
a = { key: 10 };
b = { key: 10 };
c = a;
a === b; //returns false
a === c; //returns true
```

上面的例子说明，一个对象看起来跟另外一个对象看起来很像，但他们不是相等的，非原始数据类型只有同时指向同一个内存地址时才是相等，比如上面例子的`c`和`a`变量。

- 如果我们使用非原始数据类型，我们应该如何避免 rerender 呢？

使用 PureComponent，你可以不用写`shouldComponentUpdate`，这相当于是普通 Class 组件中使用`shouldComponentUpdate`，而在 React.memo 中，可以使用`areEqual`函数来控制 memo 的逻辑。
另外，你也可以使用[useCallback](https://reactjs.org/docs/hooks-reference.html#usecallback) hook 来解决这个问题，这 hook 是用于函数组件，它可以保存函数、对象或数组的实例，并且保证在依赖变化时，这个示例才会变化。
以下是一些介绍 React.memo，React.useCallback 的视频：
[https://youtu.be/uojLJFt9SzY](https://youtu.be/uojLJFt9SzY)

#### 3.使用 useReducer

useReducer 这个 hook 在状态更新时，可以避免不必要的 rerender，以下是`useReducer`对比`useState`为什么可以更好地减少 rerender 的原因：

- 如果`useReducer`返回与当前 state 是相同值时，React 将会就触发 bailout 的优化策略，来避免 rerender 子组件或其他副作用，因为它使用的是`Object.is`的比较算法。

#### 4.防止非必要的重新挂载

非必要的重新挂载，会意味着组件会完整地执行一次卸载和重新，这比 React 的 rerender 更消耗性能，因为重新挂载不只包括 rerender，还会重新初始化状态并且重新执行生命周期的方法。
造成不必要 unmounting 的两个最常见原因：

- 没有使用`event.preventDefault()`

`event.preventDefault()`通常被用于阻止浏览器的默认事件操作，在一些浏览器中，当触发一个点击事件时会导致整个页面都重新加载。

- 没有对 render 进行优化

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171729617.png)
上面的示例代码用了糟糕的条件判断来执行 React 的 render，因为无论状态如何变化，`<HeaderComponent/>`和`<ContentComponent/>`都会被重新挂载。在三元操作符里面使用相同的组件渲染，这是很糟糕的条件判断方式。
一种更好的方式是，把`<HeaderComponent/>`和`<ContentComponent/>`从条件判断中移出来，类似下面这样：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171730645.png)

#### 5.优化 useEffect 依赖

最后一种重要的优化方式是，优化 useEffect 的依赖，useEffect 经常会涉及一些导致 rerender 的副作用操作，所以，对于 useEffect 依赖而言，我们应该更具体一些，来避免不需要的执行。
这有两种主要的方式避免 useEffect 的不必要的执行：

- 具体的依赖

```javascript
useffect(
  {
    // do something
  },
  [someObjectState],
);
```

上面的例子是将一个属性作为依赖，这里有个问题是每次`someObject`发生改变时，`useEffect`会重新被执行，一种更好的方式是类似下面这样，指定`someObject`的属性：

```javascript
useffect(
  {
    // do something
  },
  [someObjectState.someProperty],
);
```

- 使用 memoization

另外一种方式是，使用`useMemo`来实现 memoized value，这个 memoized value 只有在 useMemo 的依赖变化时才会被更新，因此，它也可以减少 value 的变化次数，比如像这样的使用方式：

```javascript
const memoizedRoomSiz = useMemo(() => {
  return length * width;
}, [length]);
useffect(
  {
    // do something
  },
  [memoizedRoomSiz],
);
```

关于 memoization 的更多信息，我推荐你去读这篇文章：[https://javascript.plainenglish.io/react-usememo-and-when-you-should-use-it-e69a106bbb02](https://javascript.plainenglish.io/react-usememo-and-when-you-should-use-it-e69a106bbb02)

### 总结

虽然 React 是一个有着良好性能的类库，但它仍然有缺点，尤其是当你的应用越来越复杂时，这也是为什么我们必须提前关注 rerender 这个问题，不然应用只会越来越乱，然后记得使用 React Developer Tools profiler，它可以帮助你发现一些隐藏的 rerender，以下的优化措施：

- 注意「死循环」的代码
- 动态地优化性能问题
- 考虑使用 useReducer 来代替 useState
- 注意不必要的重新挂载
- 优化 useEffect 的依赖

如果这些你都做到了，那太棒了!!
