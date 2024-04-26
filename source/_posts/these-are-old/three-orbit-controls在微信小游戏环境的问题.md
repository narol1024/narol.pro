---
title: three-orbit-controls 在微信小游戏环境的问题
lang: zh-CN
date: 1970-01-01
excerpt: three-orbit-controls这个是ThreeJS的扩展库，用于控制摄影机轨道，类似现实中摄影师坐在轨道车那样，可以自由控制摄影的朝向
categories:
  - 技术
---

## 目录

[three-orbit-controls](https://github.com/mattdesl/three-orbit-controls) 这个是 [ThreeJS](https://github.com/mrdoob/three.js/) 的扩展库，用于控制摄影机轨道，类似现实中摄影师坐在轨道车那样，可以自由控制摄影的朝向。想看效果直接观看 ThreeJS 的官方例子：[https://threejs.org/examples/misc_controls_orbit.html](https://threejs.org/examples/misc_controls_orbit.html)

## 兼容微信小游戏环境

最近在用 ThreeJS 写一个 3D 的微信小游戏时，由于为了控制最佳的摄影机角度，我用到了这个扩展库去调整摄影机的角度。

在旋转摄影机镜头时，画面直接被清空了，然后 google 了一下资料，发现这个扩展库只处理浏览器的环境，查看源码可以发现里面用了`element.clientWidth`，`element.clientWidth`，这些都是微信小游戏环境不支持的。

```js
function handleTouchMoveRotate(event) {
  //console.log( 'handleTouchMoveRotate' );
  rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
  rotateDelta.subVectors(rotateEnd, rotateStart);

  var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

  // rotating across whole screen goes 360 degrees around
  rotateLeft(((2 * Math.PI * rotateDelta.x) / element.clientWidth) * scope.rotateSpeed);

  // rotating up and down along whole screen attempts to go 360, but limited to 180
  rotateUp(((2 * Math.PI * rotateDelta.y) / element.clientHeight) * scope.rotateSpeed);

  rotateStart.copy(rotateEnd);

  scope.update();
}
```

在处理镜头旋转时，首先会判断`element`这个对象如果是`document`对象的话，则使用`document.body`去计算旋转值，否则用`OrbitControls`的第二参数`target`(第一个参数是 camera)。所以，在不考虑修改第三方类库的情况下，我们可以传入微信小游戏的`window`对象。这时候又会抛出另外一个问题：

> 微信小游戏环境下，window 只有 nnerWidth/innerHeight 属性，不具备 clientWidth/clientHeight

`weapp-adapter`模拟 BOM 对象，但只考虑 innerWidth/innerHeight，这时候我们需要自己去扩展 weapp-adapter 库。我们取名为`weapp-adapter-extend`。weapp-adapter 模拟 BOM 的原理其实是新建一个`_window`对象，再该对象挂载到`GameGlobal.global下`（开发者工具无法重定义 window，需要另外处理）：

```js
// weapp-adapter-extend/window.js

import _window from './window';

function inject() {
  const { platform } = wx.getSystemInfoSync();
  // 开发者工具无法重定义 window
  if (typeof __devtoolssubcontext === 'undefined' && platform === 'devtools') {
    for (const key in _window) {
      const descriptor = Object.getOwnPropertyDescriptor(global, key);

      if (!descriptor || descriptor.configurable === true) {
        Object.defineProperty(window, key, {
          value: _window[key],
        });
      }
    }
    window.parent = window;
  } else {
    for (const key in _window) {
      global[key] = _window[key];
    }
    global.window = global;
    global.top = global.parent = global;
  }
}

inject();
```

```js
// weapp-adapter-extend/window.js

export default {
  clientWidth: window.innerWidth,
  clientHeight: window.innerHeight,
};
```

最后，实例化`OrbitControls`时，我们就可以传入`window`对象了：

```js
const orbitControls = new OrbitControls(camera, window);
```

## 关于`MouseEvent`和`WheelEvent`

该扩展库用到了这两个事件去处理镜头放大缩小的交互行为，但微信小游戏环境并没有实现这两个事件，不过社区上有人已经模拟了`MouseEvent`，感兴趣可以去查看：[https://github.com/finscn/weapp-adapter](https://github.com/finscn/weapp-adapter)
