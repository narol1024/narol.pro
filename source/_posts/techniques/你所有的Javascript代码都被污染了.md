---
title: 你所有的Javascript代码都被污染了
lang: zh-CN
date: 2022-11-21
excerpt: 好吧，可能不是所有的 Javascript 代码都会（作者有标题党的嫌疑 😂），这是一篇关于 Javascript 的`prototype`被污染的短文，我已经不只一次看到这个问题了。
categories:
  - 技术
---

> 翻译自：[https://dev.to/jankapunkt/all-your-javascript-code-is-polluted-3e8l](https://dev.to/jankapunkt/all-your-javascript-code-is-polluted-3e8l)

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171649308.png)

好吧，可能不是所有的 Javascript 代码都会（作者有标题党的嫌疑 😂），这是一篇关于 Javascript 的`prototype`被污染的短文，我已经不只一次看到这个问题了。

### 这是怎么回事呢？

如果你使用了 Javscript 的「[Object-bracket notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors#property_names)」来创建对象，并且接受用户输入来修改这个对象，那么你的代码很可能已经引入了 Prototype 污染，先来看看一个简单的例子：

```javascript
const internal = {
  foo: {
    bar: null,
  },
};

const acceptUserInput = (type, subtype, value) => {
  internal[type][subtype] = value;
};
```

接着这样调用：

```javascript
// no problem so far, this is the expected input
acceptUserInput('foo', 'bar', 'I am so clever');

// malicious input
acceptUserInput('__proto__', 'polluted', 'Bon jour 🐻‍❄️');
```

经过恶意输入后的结果是，你之后创建的所有对象，都会包含`polluted`这个属性，而且它的值是`Bon jour 🐻‍❄️`：

```javascript
const obj = {};
console.debug(obj.polluted); // 'Bon jour 🐻‍❄️'
```

### 为什么这样会有问题？

在客户端中使用这样 Javascript 问题不大，但是如果这些代码是在服务端（Node.js）的话，这相对于给攻击者开了一个门。如果说攻击者知道你在鉴定用户权限时，使用的是运行时创建的对象而不是`Object.create(null)`，那么 Prototype 污染这个问题使他们可以绕过鉴权程序，去获取更多的系统访问权限。

```javascript
const internal = {
  foo: {
    bar: null,
  },
};

const acceptUserInput = (type, subtype, value) => {
  internal[type][subtype] = value;
};

// assume, this object
// is constructed when reading
// values from db
const getRoles = () => ({ canAccessThat: true });

const userCanAccessThis = () => {
  const me = getCurrentUser(); // get from session etc.
  const roles = getRoles(me.id);
  return roles.canAccessThis === true;
};

// malicious input
acceptUserInput('__proto__', 'canAccessThis', true);

// will now always return true for every user
userCanAccessThis();
```

这只是一个简化之后的例子，希望你能够看到它给系统带来的严重问题。

### 如何避免这个问题？

- 减少「Object-bracket notation」的使用，尽可能去使用「dot notation」。
- 根据具体场景，适当地使用 Map 或 Set。
- 在深度合并对象时，要注意在 Prototype 链是否受到影响。
- 永远不要相信用户的输入，记得校验，特别的在服务端。
- 使用`Object.create(null)`来创建一个没有 prototype 的对象。
