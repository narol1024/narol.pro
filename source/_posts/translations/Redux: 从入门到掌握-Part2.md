---
title: 'Redux: 从入门到掌握-Part2'
lang: zh-CN
date: 2020-11-18
excerpt: '本文是：Redux: 从入门到掌握-Part1的续篇，通过上一篇文章，我们理解了 Redux 各种的概念，而这篇文章，我们将通过编写一个简单的 TO-DO 列表的项目来学会如何使用Redux'
categories:
  - 技术
---

> 本系列面向没有任何基础的 Redux 初学者，帮助开发者掌握 Redux，最后可以在项目中使用。
> 翻译自：[https://medium.com/@navaneeth.penumarthi/redux-complete-beginners-to-advanced-part-2-4aa15b2f43cd](https://medium.com/@navaneeth.penumarthi/redux-complete-beginners-to-advanced-part-2-4aa15b2f43cd)

### 回顾

本文是：[Redux: 从入门到掌握-Part1](https://www.yuque.com/docs/share/3d3e20f4-52b4-4ace-b992-18bc1a534f6a?# 《Redux: 从入门到掌握-Part1》)的续篇，通过上一篇文章，我们理解了 Redux 各种的概念，而这篇文章，我们将通过编写一个简单的 TO-DO 列表的项目来学会如何使用**Redux**。
如果你还没有准备好，请移步到 Part 1.

> 这个项目主要是 Redux 为主，因此不会包括 CSS，读者可以自己引入 CSS 样式或在下面的 Github 仓库发起 PR

现在，我们对 Redux 有初步地了解，通过编写一个简单的应用，可以加深对 Redux 的理解。

### 应用说明

这里我们将编写一个提供基本功能的 TO-DO 应用，比如：

- 添加一个 Task
- 移除一个 Task
- 标记一个 Task 为完成的状态

在编写代码之前，我们需要梳理一下这个应用的组件关系图，并且理解每一个组件负责的事情。
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171725785.png)
这个应用很简单，但足以让我们在 React 应用中学会使用 Redux。

### 组件说明

- Main：这是一个父组件，会包括整个应用的所有组件。
- Form：负责添加新的 Task。
- Tasks：这个组件会显示 Tasks，同时会包含移除或标记 Task 的功能。

### 开始

首先，需要创建一个新的 React 应用，并且安装所有的的依赖。
创建新的 React 应用：

```shell
npx create-react-app redux-app
```

然后需要安装一些应用的依赖：

```shell
npm i react-redux redux uuid
```

### Store 的数据结构

然后，先来确定一下 Store 的数据结构：
![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171725916.png)
准备好数据结构后，就可以进入编写前端代码了。

### 前端组件相关

这里开始编写前端部分的代码。

#### App.js

这个文件会包含一个`Main`组件。

```jsx
import React from 'react';
import Main from './Main';
const App = () => {
  return <Main />;
};
export default App;
```

#### Main.js

这个是`Form.js`和`Tasks.js`组件的父组件。

```jsx
import React from 'react';
import Form from './Form';
import Tasks from './Tasks';
const Main = () => {
  return (
    <div>
      <h1> NOTEPAD </h1>
      <Form />
      <Tasks />
    </div>
  );
};
export default Main;
```

#### Form.js

这个组件会包括表单输入，用来填写用户新的 Task，同时输入框都是受控组件，因此他们的输入变化会跟本地状态绑定。

```jsx
import React, { useState } from 'react';
const Form = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const onChangeTitle = (e) => {
    setTitle(e.target.value);
  };
  const onChangeDescription = (e) => {
    setDescription(e.target.value);
  };
  const onFormSubmit = () => {
    // we shall deal with this later.
  };
  return (
    <div>
      <form onSubmit={onFormSubmit}>
        <div>
          <label htmlFor="title"> Task title </label>
          <input
            type="text"
            placeholder="title"
            name="title"
            id="title"
            value={title}
            onChange={onChangeTitle}
          />
        </div>
        <div>
          <textarea
            name="description"
            id="description"
            cols="30"
            rows="10"
            placeholder="description"
            value={description}
            onChange={onChangeDescription}
          />
        </div>
        <input type="submit" value="submit" />
      </form>
    </div>
  );
};
export default Form;
```

可能你注意到了，`onFormSubmit`这个方法目前还没有任何代码，如果用户提交了一个新的 Task，就需要更新 Store 来创建一条新的数据，这个后面会再讲，这里先来看`Tasks`这个组件。

#### Task.js

这个组件，可以加载在 Store 中所有的 Tasks 数据，然后将它们显示出来，并且支持添加或删除 Task，或者标记 Task 的状态。

```jsx
import React from 'react';

const Tasks = () => {
  // The data from the store has to be fetched here.
  const removeTask = (id) => {
    // Deal with this later
  };
  const finishTask = (id) => {
    // Deal with this later
  };
  const renderTasks = () => {
    return tasks.map((element, index) => {
      return (
        <div key={index}>
          <h2> {element.title} </h2>
          <div>
            <button onClick={() => removeTask(element.id)}> ⛔ </button>
            <button onClick={() => finishTask(element.id)}> ✅ </button>
          </div>
          <p> {element.description} </p>
          <small> {element.date} </small>
          {element.finished ? 'finished' : ''}
        </div>
      );
    });
  };
  return (
    <div>
      <h1> Current tasks </h1>
      {renderTasks()}
    </div>
  );
};
export default Tasks;
```

### Action creators

前端组件部分已经完成，现在需要创建 Action，上文我们提到，组件如果要更新状态的话，就需要调用对应的 Action，这里我们创建 3 个 Action，分别对应不同的功能。

- 在 src 目录下，创建一个新的目录，并命名为 actions。
- 在这个 actions 目录下，创建两个文件，分别命名为`types.js`和`action.js`。

#### types.js

你还记得，我们之前讲到的，type 是每一个 Action 的必要字段，在这个代码文件中，我们列出了所有的 action types，并且导出它们。

```javascript
export const ADD_TASK = 'ADD_TASK';
export const REMOVE_TASK = 'REMOVE_TASK';
export const FINISH_TASK = 'FINISH_TASK';
```

#### action.js

这个代码文件包括了所有的 Action，并且它们都返回了一个 Action 对象。

```javascript
import { ADD_TASK, REMOVE_TASK, FINISH_TASK } from './types';
export const addTaskAction = (task) => {
  return {
    type: ADD_TASK,
    payload: task,
  };
};
export const removetaskAction = (id) => {
  return {
    type: REMOVE_TASK,
    payload: id,
  };
};
export const finishTaskAction = (id) => {
  return {
    type: FINISH_TASK,
    payload: id,
  };
};
```

- **addTaskAction**，这个是在用户需要创建一条包含 Task 信息时派发的 Action，其组成部分是以`ADD_TASK`为 type，Task 的标题或描述为 palyload，最后将这条 Action 用于添加新的 Task。

> 在用户填完表单并确认需要创建 Task 时，在`onSubmit`的事件回调中被调用，视图实现是在`Form.js`这个代码文件中。

- **removeTaskAction**，这个是在用户想要删除 Task 时派发的 Action，其组成部分是以`REMOVE_TASK`为 type，待删除 Task 的 id 为 palyload。

  > 在用户执行删除按钮操作时被调用，视图实现是在`Tasks.js`代码文件中。

- **finishTaskAction**，这个是是用户想要标记 Task 的状态为完成时派发的 Action，其组成部分是以`FINISH_TASK`为 type，待完成 Task 的 id 为 palyload。

> 在用户执行勾选完成操作时被调用，视图实现是在`Tasks.js`这个代码文件中。

### Reducers

- 在 src 中，创建一个新的目录，命名为`reducers`。
- 在这个 reducer 目录中，创建一个新的文件，命名为`index.js`。

在任何组件中，只要发起一个 Action 对象，Redux 内部就会将这个对象派发给每一个 reducer，相关的 reducer 就会更新状态，比如添加/移除/标记完成操作，在本文的例子中，我们只需要一个 reducer 就够了。

```javascript
import { combineReducers } from 'redux';
import { ADD_TASK, REMOVE_TASK, FINISH_TASK } from '../actions/types';
import { v4 as uuidv4 } from 'uuid';
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const initialState = [
  {
    id: uuidv4(),
    title: 'First task',
    description: 'This is the first task that is created by default',
    date: new Date().toLocaleDateString('en-EN', options),
    finished: false,
  },
];

const taskReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TASK:
      const { title, description } = action.payload;
      return [
        ...state,
        {
          id: uuidv4(),
          title,
          description,
          date: new Date().toLocaleDateString('en-EN', options),
          finished: false,
        },
      ];
    case REMOVE_TASK:
      const removeId = action.payload;
      return state.filter((task) => task.id !== removeId);
    case FINISH_TASK:
      const finishId = action.payload;
      return state.map((task) => {
        if (task.id === finishId) {
          return { ...task, finished: true };
        }
        return task;
      });
    default:
      return state;
  }
};
export default combineReducers({
  task: taskReducer,
});
```

- 每一个 reducer 都可以拿到当前的 state 和 action 对象。
- 如果 Action 返回一个对象，Redux 内部会自动派发这个对象以及当前的 state，以参数的形式给到 reducer。
- reducer 通过匹配 actions 的类型，更新对应状态。
- 虽然在本文的应用中，只有一个 reducer，但是如果是复杂的应用，也可以创建多个 reducer，然后在合并起来。

### Provider

Action creators 和 reducer 都创建完了，接下里是将它们跟 React 应用进行关联，这部分工作在 react-redux 会提供`Provider`这个组件，然后对 App 这个组件进行包裹，代码如下：

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import { Provider } from 'react-redux';
import { createStore, compose } from 'redux';
import reducers from './reducers';

const root = ReactDOM.createRoot(document.getElementById('root'));
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
root.render(
  <React.StrictMode>
    <Provider store={createStore(reducers, composeEnhancers())}>
      <App />
    </Provider>
  </React.StrictMode>,
);
```

这是 Redux 的样板代码，先导入 reducer，然后传给 create store 函数，最后 create store 函数传给 store 参数。

> composeEnhancers 也传入到了 store 参数中，这个在浏览器中，可以用来开启 redux developer tools 调试。

![](https://narol-blog.oss-cn-beijing.aliyuncs.com/blog-img/202404171726164.png)
Redux developer tools 这个插件可以用来跟踪或调试 Store 的的状态，从应用启动到任意的时间都可以支持。

现在，Action creators 和 reducers 都编写完了，现在需要关联我们的应用，上文提到，有部分事件的回调方法中没有编写代码，现在是时候补上。

### useDispatch Hook

这个 hook 可以让任意一个组件，发起一个 Action。比如在`Form.js`中，当前用户提交表单时，可以在`onSubmit`这个事件回调中发起`addTaskAction`这个 action。

```jsx
import { addTaskAction } from '../actions/action';
import { useDispatch } from 'react-redux';
//
const dispatch = useDispatch();
const onFormSubmit = (e) => {
  e.preventDefault();
  dispatch(addTaskAction({ title, description }));
  setTitle('');
  setDescription('');
};
//
```

useDispatch 在 react-redux 中，最容易使用的 hook：

- 从`react-redux`中导入 useDispatch hook。
- 导入 action
- 然后 dispatch 带有标题和描述的 addTaskAction。

#### 给读者的任务

现在你理解了如何使用 useDispatch hook 去发起一个 Action，那么你可以也试试用同样的方式，将处理删除任务和标记完成的代码给填补上。

> 在这两个功能中，你需要调用`removeTaskAction`和`finishTaskAction`这两个 action，同时你需要在 dispatch 函数中传递 id 参数。
> 或者你可以直接参考 Github 仓库的代码。

### useSelector Hook

最后一个工作是，我们需要将 Tasks 的数据从 Store 读取出来，这个部分的实现是在`Tasks.js`中，然后加载完数据后，将他们显示到视图上面，因此这就需要用`useSelector`这个 hook 了，代码如下：

```jsx
import { useSelector } from 'react-redux/es/exports';
const Tasks = () => {
  const tasks = useSelector((state) => {
    return state?.task;
  });
  //
};
```

- useSelector hook 的 state 参数，是用来访问当前 Store 所有的 state 数据。
- 这个 state 数据只能通过派发 Action，然后经过 reducer 进行更新。
- 在 Action 调用之前，state 数据是`initialState`对象的数据。
- 在访问 state 数据时，task 这个 key 对应的是导入 taskReducer 时确定的 key，通过这个属性，就可以访问 Task 的整个数据了。
- 在上面的 redux dev tools 的图片中，可以很清晰的看到 state 的数据结构。

> Hooks 只能用于函数组件，如果是在 Class 组件中，则需要用 mapStateToProps 来代替 hooks，这篇文章就不再阐述了。

### 总结

本文中，我们基本介绍了 Redux 的流程，功能和调用方式，不过 redux 确实有很多样板代码，看起来很重复，现在有很多 redux 的生态轮子都是基于 Redux 的，无论用什么轮子，其关键点或流程都是类似的。

感谢阅读！

### Links

[Redux: 从入门到掌握-Part1](https://www.yuque.com/docs/share/3d3e20f4-52b4-4ace-b992-18bc1a534f6a?# 《Redux: 从入门到掌握-Part1》)
[Github Repo](https://github.com/RangerCreaky/notepad)
[Live Demo](https://phenomenal-paprenjak-d3300f.netlify.app/)
