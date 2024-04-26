---
title: call 和 apply 的用法和区别
lang: zh-CN
date: 1970-01-01
excerpt: 这次，要讲的是`call` 和 `apply`。 作为一名前端 jser，对于他们俩的区别，傻傻分不清楚，更别说使用了。
categories:
  - 技术
---

## 简介

这次，要讲的是`call` 和 `apply`。 作为一名前端 jser，对于他们俩的区别，傻傻分不清楚，更别说使用了。还是先去[JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)查了下。

- `call`：使用一个指定的 this 值和若干个指定的参数值的前提下调用某个函数或方法。
- `apply`：在指定的 this 值和参数（数组或类数组对象）的情况下调用某个函数。

这定义看起来很抽象，先别着急，继续看下去。

## 通俗点

换个通俗易懂的说法就是：

- `call`：调用一个对象的一个方法，以另一个对象替换当前的 this，其中传参以不定数的参数传传入。
- `apply`：调用一个对象的一个方法，以另一个对象替换当前的 this，其中传参以数组或类数组对象传入。

是不是感觉又理解了一点了，没关系，再看看下面的例子，应该就差不多了。

```javascript
var food = 'fish';
var Tom = { food: 'beef' };
var eatFood = function (friend1, friend2) {
  console.log('我跟' + friend1 + '和' + friend2 + '一起去吃' + this.food);
};
/*我跟Karry和Mage一起去吃fish*/
eatFood('Karry', 'Mage');
/*我跟Monter和Father一起去吃beef*/
eatFood.call(Tom, 'Monter', 'Father');
eatFood.apply(Tom, ['Monter', 'Father']);
```

eatFood 是一个函数对象，`call`和`apply`是函数对象的一个内置的方法。在非严格模式下，直接调用 eatFood()的时候，函数里的 this 是指向 window 的，所以打印出来的`food`是 `fish` ；而通过`call`或`apply`调用，此时 eatFood 的 this 指针已经被 Tom 代替了，所以，因此打印出来的是`beef`。

还有从例子中，我们也可以看出，call 是接收参数需要逐个列举出来，apply 则是接收数组形式的参数即可，比如普通数组或者 arguments 类数组都可以。

## 作用

其实使用`call`或`apply`最大的好处，就是可以扩充作用域，对象不需要与方法有任何的耦合关心。
举个栗子，在实现 javascript 的对象继承的时候，除了使用原型链的方式外，我们还可以使用是用`call`和`apply`来实现 javascript 的对象继承（构造函数实现继承）。

```javascript
function Animal(name) {
  this.name = name;
  this.sayName = function () {
    console.log(this.name);
  };
}
function Cat(name) {
  Animal.call(this, name); /*或Animal.apply(this,[name])*/
}
var cat = new Cat('maomao');
cat.sayName();
```

从例子可以看到，Cat 函数对象本身是没有 sayName 这个方法属性的,那为什么却可以调用呢？实际上，Animal.call(this) 的意思就是使用 Animal 对象代替 Cat 函数对象里面的 this 指针，那么 Cat 中不就有 Animal 的所有属性和方法了吗，Cat 对象就能够直接调用 Animal 的方法以及属性了.

## 参考资料

- JavaScript MDN [call](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call) [apply](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
- ITeye 博客 [JS 中的 call()和 apply()方法](http://uule.iteye.com/blog/1158829)
