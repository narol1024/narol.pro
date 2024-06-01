---
title: Javascript响应式的关键-观察者模式
lang: zh-CN
date: 2020-11-12
excerpt: 很多开发者喜欢往前端框架加入一些神秘的「面纱」，比如React，它能够直接地看到数据的流向，但这一切跟他们之前所了解的完全不一样。如果不知道这里面的实现，看起来确实比较神奇，就如 Arthur C. Clarke 说的：
categories:
  - 翻译
---

> 深入理解我最喜欢的设计模式，以及它为什么会在响应式设计中如此的重要。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171716951.png)

很多开发者喜欢往前端框架加入一些神秘的「面纱」，比如`React`，它能够直接地看到数据的流向，但这一切跟他们之前所了解的完全不一样。如果不知道这里面的实现，看起来确实比较神奇，就如 Arthur C. Clarke 说的：

> 任何足够先进的技术都与魔法无异。

不过在了解响应式背后的基本原理后，就会发现这其实没什么神奇的，并且还能够帮助你理解框架本身。

提醒一下，本文不打算模拟实现或精简一个`React`框架，来帮助你理解整个框架的工作原理。本文只想谈的是一种被广泛用于前端框架的设计模式。

### 什么是观察者模式

首先第一件事，你需要理解它本身是一种设计模式，不用担心，一旦你了解它之后，你会发现根本没有神奇。

这种所谓的「**行为设计模式**」，它负责处理对象的行为，以及在某种特定情况下，对象之间是如何通信的。也就是说，该设计模式是表示当一组对象（观察者）关注到另一个对象（被观察者）的状态变化，以及如何建立起**观察者**-**被观察者**之间的关系。

有个关键点，**观察者**并不需要时刻关注着被**观察者**对象，它们而是会以订阅的方式，一旦**被观察者**发生了某些事件后就会通知到**观察者**。这个细节相当关键，因为如果观察者一直处理关注，就意味着需要有个不断循环的程序来检查这些变化。虽然单个对象下，这无关紧要，但如果扩展到数百个甚至数千个，性能问题就会凸显出来。

假设**观察者**能够独立运行或处理闲置，而不需要另外作循环检查，那么就能够解决性能上的问题了。

举个例子，假如你是一个上班族，你每天都需要看报纸，此时有两种选择，一种是在订阅报纸后，它每天都会自动送到你家门口，另外一种是，你需要花费时间和精力亲自去拿报纸。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171717002.png)

上图不是设计模式的 UML，而是以一个简单的例子来说明 3 个观察者是如何与被观察者进行通信的。

从图的左侧可以看出，每个观察者是如何调用`addSubscriber`，以及`notifySubscribers`方法是如何通过传递 event 参数，来调用`update`方法。虽然你也有可以让观察者直接访问被观察者对象的状态，但我认为这种设计模式则会更加清晰，因为这里的被观察者能够直接展示了变化（即触发了通知）。

可以看到这种模式的背后其实没有什么神奇的，因为这种设计太优雅，以至于会让开发者看起来像是一种「魔法」。

### 使用 Javascript 实现观察者模式

接下来，我们用代码实现一个例子，在一个`for`循环内不断地遍历变量，并且在遍历到某个特定值时，去执行「反应」事件（原文是`react`）。

举个例子，假设有一个从 1 到 1000 的`for`循环，并且希望在遍历到奇数项时，执行「反应」事件，就像这样的：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171716583.png)
现在我们开始写 Javascritpt 代码，不过有一点需要注意，当前 Javascript 没有私有方法和属性，甚至没有虚类和抽象方法，所以我们需要根据实际情况去实现它。

代码实现如下：

```javascript
const Looper = require('./looper');
const OddNotifier = require('./oddNotifier');

const l = new Looper(1, 100000);
l.addObserver(new OddNotifier());
l.run();
```

代码非常简单，`Lopper`类负责实现 for 循环，并且`run`方法可以运行这个循环，而前面的`addObserver`方法则是允许我们加入一些**观察者**。在每个观察者的内部都实现了`WHEN`（什么时候）和`HOW`（做什么）的逻辑，在我们这个例子中，观察者就是`OddNotifier`。

运行代码后，会得到以下结果：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171716160.png)
正如你所见，我们实现了一个「相当啰嗦」的观察者。

接下来，我们来看下观察者`OddNotifier`的实现：

```javascript
const Observer = require('./observer');

class OddNotifier extends Observer {
  constructor() {
    super();
  }

  eventIsRelevant(evnt) {
    return evnt.evntName == 'new-index' && evnt.value % 2 != 0;
  }

  reactToEvent(evnt) {
    console.log('----------------------');
    console.log('Odd number found!');
    console.log(evnt.value);
    console.log('----------------------');
  }
}
```

上面的代码，我们重写了父类`Observer`的`eventIsRelevant`和`reactToEvent`方法。注意，这里我们并没有实现`update`方法，因为它在父类已经被实现：

```javascript
class Observer {
  update(event) {
    if (this.eventIsRelevant(event)) {
      this.reactToEvent(event);
    }
  }

  eventIsRelevant() {
    throw new Error('This needs to be implemented');
  }

  reactToEvent() {
    throw new Error('This needs to be implemented');
  }
}

module.exports = Observer;
```

这里定义了一个`update`方法去接收`event`参数，如果满足触发条件，那么就会调用`reactToEvent`，而**具体是什么条件，则是留给每个具体的观察者去定义**。

我们注意到`Lopper`类是继承了另外一个`Subject`类，不过它只关心如何变量变量值，在每次变量中，它都会触发一个新的`event`去通知观察者：

```javascript
const Subject = require('./subject');

module.exports = class Looper extends Subject {
  constructor(first, last) {
    super();
    this.start = first;
    this.state = first;
    this.end = last;
  }

  run() {
    for (this.state = this.start; this.state < this.end; this.state++) {
      this.notifyObservers({
        evntName: 'new-index',
        value: this.state,
      });
    }
  }
};
```

上面的`Lopper`类不会关心如何添加和通知观察者，它只需要在特定时机，调用`notifyObservers`方法，在这个例子中，这个时机被定义为「每一次循环产生新的变量值」，需要视具体情况而定。实际上，如果实现逻辑更复杂一些，我们也可以触发多个事件，但是否触发，是根据观察者内部实现确定的。

最后来看下`Subject`的实现，也非常简单，它只关心收集（collect）和通知（notifying）观察者：

```javascript
class Subject {
  constructor() {
    this.observers = [];
  }

  addObserver(obs) {
    this.observers.push(obs);
  }

  notifyObservers(event) {
    this.observers.forEach((o) => o.update(event));
  }
}

module.exports = Subject;
```

是不是很简单？现在我们再深入一些，继续看另外一个例子，特别是`React`开发者。

假设有以下一段代码：

```javascript
let [looper, increaseLooper] = useState(1);

console.log('Initial state: ', looper.state);

console.log('Increasing the value by 1');
increaseLooper();
console.log('Increasing the value by 1');
increaseLooper();
console.log('Increasing the value by 1');
increaseLooper();
```

这里创建了一个`hook`，`looper`变量的初始值是 1，并且返回了一个用于递增变量值的函数`increaseLooper`，代码运行结果：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171717045.png)

`hook`的实现如下：

```javascript
function useState(start) {
  let l = new Looper(start, start * 10000);

  l.addObserver(new OddNotifier());

  let fn = () => {
    l.increase();
  };

  return [l, fn];
}
```

`increase`的内部实现是更新`state`的变化和通知所有的观察者：

```javascript
//....
increase() {
  this.state++;
  this.notifyObservers({
    evntName: "new-index",
    value: this.state
  })
}
//...
```

至此，**观察者模式**的「面纱」已经被揭开了，我理解`hook`的神秘行为只不过是一组预先设置好的观察者。
