---
title: Apollo Fetch的配置详解
lang: zh-CN
date: 2020-05-07
excerpt: 像大多数前端开发工具一样，Apollo Client是非常灵活的，比如Apollo Cache就是其中一个。Apollo Client为浏览器提供了获取数据的缓存设置，避免不必要的网络请求，来提升应用的性能。
categories:
  - 技术
text-align: left
---

> 本文翻译自 [Understanding Apollo Fetch Policies](https://medium.com/@galen.corey/understanding-apollo-fetch-policies-705b5ad71980)

像大多数前端开发工具一样，Apollo Client 是非常灵活的，比如 Apollo Cache 就是其中一个。Apollo Client 为浏览器提供了获取数据的缓存设置，避免不必要的网络请求，来提升应用的性能。不过有时候也会很复杂，因为我们可能不知道数据从哪里来的，可能是从服务端 API 加载最新的数据，又可能是从缓存中获取，它完全取决于你自己的设置。但是我们从缓存中获取实时数据时，如果这个数据相对服务器已经过期，问题就会更明显了。

## Fetch Policies

在使用 Apolllo Query 时，数据是从缓存或者服务端接口中获取，取决于 fetch policy 的设置。fetch policy 表示获取数据的优先级，比如是从服务端拉取最新的数据，还是从缓存中快速读取到数据。理解 fetch policy，有助于更清晰地理解 Apollo GraphQL 应用的数据流，解决一些获取数据时的异常。

### cache-first:

Apollo 默认的 fetch policy 是 cache-first（缓存优先），与获取最新数据相比，这种方式会快速获取到数据。如果你不想数据发生变化或者对数据实时性要求不高的情况下，可以使用缓存优先：

1.获取数据时，Apollo 会从 Apollo Cache 数据中检查是否命中缓存，如果命中则直接跳到 step 4。

2.如果没有命中，Apollo 则会发起一个网络请求到服务端。

3.服务端返回数据，Apollo 使用该数据去更新缓存。

5.返回数据。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171056143.webp)

### cache-and-network:

如果我们需要要显示经常更新的数据时，这是一个很好的 fetch policy。cache first 强调的是快速获取数据，而 cache-and-network 则侧重于让缓存数据跟服务端一样保持最新。如果对数据进行了修改，但是又担心缓存过期时，这个策略会是一个很好的解决方案。

1.获取数据时，Apollo 会从 Apollo Cache 数据中检查是否命中缓存。

2.如果命中缓存，则返回。

3.无论 step 2 中是否获取到数据，Apollo 都会发一个请求去服务端获取最新数据。

4.更新缓存里的数据。

5.返回数据。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171056145.webp)

### network-only:

如果不想因为显示过期的数据带来的风险时，使用 network-only 会更加合理，这个策略比如快速获取数据，更倾向于保证数据的实时性。不像 cache-and-network，该策略不会从缓存返回可能过期的数据，同时它又能保证缓存的数据是最新的。

1.Apollo 直接发起一个请求，而不会检查缓存。

2.服务端返回数据，并更新缓存数据。

3.返回数据。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171056146.webp)

### no-cache:

no-cache 有点类似 network-only，但是它跳过了缓存数据的更新。如果你不想在缓存中存储任何信息时，它会非常合适。

1.Apollo 直接发起一个请求，而不会检查缓存。

2.服务端返回数据，但不会写入缓存中。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171056147.webp)

### cache-only:

跟 no-cache 恰恰相反，这个策略会避免发起网络请求，但是如果获取数据没在缓存中的话，就会抛出一个错误。如果需要给用户一直显示同个数据而忽略服务端的变化时，或者在离线访问时，这个策略就非常有用了。

1.Apollo 从缓存获取数据。

2.如果获取的数据在缓存的话，则返回，否则会抛出一个错误。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171056148.webp)

## 设置 Fetch Policies

你既可以为整个应用设置 fetch policy，也可以单独为某个 query 设置，至于使用哪种策略，还需要根据实际的技术架构而定。

## 真的需要改变默认的 fetch policy 吗？

看情况而定，虽然我们理解了 fetch policy 后，对理解 Apollo 的数据流非常有帮助，但这不意味着它就是银弹。在某些情况下，fetch policy 会非常好用，但是我还是建议去看下 refetching, polling, 或者优化服务端的响应。
