---
title: JS 广告投放组件踩坑记
lang: zh-CN
date: 1970-01-01
excerpt: 最近遇到这样一个需求，需要实现一个广告投放组件，用于抓取用户浏览器信息以及用户行为，组件本身不难，直接用 js 生成 iframe 内嵌广告模块即可，但是需要如何用 javascript 代码实现抓取用户的交互行为呢？
categories:
  - 技术
---

## 前言

最近遇到这样一个需求，需要实现一个广告投放组件，用于抓取用户浏览器信息以及用户行为，组件本身不难，直接用 js 生成 iframe 内嵌广告模块即可，但是需要如何用 javascript 代码实现抓取用户的交互行为呢？

## 思路

在网上找了很多资料，也参考了 google，淘宝和京东广告的实现方案，大概思路是这样的：

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404261328058.png)

总结来讲，就是：

- 投放的 js: 用户生成广告位，另外也是打点广告曝光的时间（监听页面的`scroll`事件）。
- 广告位的 js: 抓取用户的浏览器信息，广告交互行为，打点关闭页面的时间戳等信息。

所以，最终会以下面的 js 代码投放到用户的网站中：

```html
<script type="text/javascript">
  var ad_config = {
    width: 300,
    height: 280,
    adCode: 'acbd',
  };
</script>
<script type="text/javascript" src="//xxx.com/ad.js"></script>
```

也可把变量以参数的形式挂载到脚本的 url 上：

```html
<script type="text/javascript" src="//xxx.com/getAdInfo.js?id=1"></script>
```

## 一些问题

- **打点失败** ：数据打点请求，相对于 ajax 请求，采用`new Image()`来发送请求，无疑是非常简单可行的方案。但是需要注意一个地方，image 请求完成前可能会被浏览器回收，从而导致打点失败。解决方案请移步：[如何解决打点失败](http://www.cnblogs.com/xd502djj/p/3291064.html)。另外，务必在每个请求链接上带个随机参数，否则浏览器可能直接从缓存中获取（304），而不会请求。

- **浏览器重复请求** ：在使用`new Image()`打点请求的时候，遇到一个天坑，如果请求的地址是一张不存在的图片资源的话，会导致浏览器反复请求这张图片，从而出现多次请求的情况。如果需要验证此 bug，可以让接口的 response 返回 json 格式的格式，然后用 filddler 就能看到多次请求了。

- **多层 iframe** ：如果用户认为投放代码可能影响它本身站点的功能，这时候他们可能就会考虑在投放的 js 代码上再嵌入一层 iframe 了。此时投放的 javasript 已经无法监听浏览器的滚动了，因此需要在收集数据的时候，会额外增加一个字段（wtype），用来判断广告是否外嵌 iframe。这样在做数据分析的时候，可以分类分析。

- **关闭页面时间戳** ：在页面离开前发送的请求，存在一定的丢失率，所以，广告离开时间戳数据可能是残缺不完整的，需要大数据的童鞋清洗。另外在使用`beforeunload`事件时，注意要在事件的回调函数里销毁事件或加个`锁`，否则快速刷新页面（按住 f5），也会出现多次请求的情况，原因未明。

- **textarea 赋值问题** ：在 textarea 文本框里面赋值广告代码时，不能直接用：

```js
$('#textarea').val('<script></script>'); //这样会直接导致浏览器抛出错误
$('#textarea').val('<script><' + '/script>'); //而需要把script标签拆开
```

- **360 的 userAgent** ：抓取浏览器信息时，360 浏览器伪装了 chrome 和 IE 浏览器的 userAgent（3Q 大战的历史问题），因此只有在 360 本身的域名（或 360 浏览器指定的白名单域名，如 cnzz）下，才能抓到 360 浏览器真实的 ua。

- **IE 的 beforeunload** 在 IE 浏览器中，点击`<a href="javascript:"></a>`也会触发`beforeunload`事件的问题，不过可以通过代码修复这个 bug。

```js
var clickJsLinkTime;
if (isIE) {
  Util.onEvent(document, 'mouseup', function (event) {
    var target = event.target || event.srcElement;
    if (target.nodeType === 1 && /^ajavascript:/i.test(target.tagName + target.href)) {
      clickJsLinkTime = new Date();
    }
  });
}
Util.onEvent(window, 'beforeunload', function () {
  //由a标签点击触发的beforeunload
  if (isIE && new Date() - clickJsLinkTime < 50) {
    return;
  }
});
```

## 参考资料

- [beforeunload 丢失率统计](http://ued.taobao.org/blog/2012/11/beforeunload丢失率统计/)
- [new Image().src 的注意事项](http://www.cnblogs.com/xd502djj/p/3291064.html)
- [图片请求的阻塞问题](http://www.zhixing123.cn/php/26770.html)
