# Thread Debug Guide

## 如何调试Thread切换错误

当您点击Thread时出现"messages is not iterable"错误时，请按以下步骤调试：

### 1. 打开浏览器开发者工具
- 按F12或右键→检查元素
- 切换到Console标签页

### 2. 查看调试日志
点击Thread时，您会看到类似以下的调试信息：

```
Thread switch_start: { threadId: "...", operation: "switch_start", timestamp: "..." }
Thread state for [threadId]: { ... }
Extracting messages from thread state: { ... }
Thread switch_complete: { threadId: "...", operation: "switch_complete", messageCount: 0 }
```

### 3. 常见问题和解决方案

#### 问题1: Thread state为null
如果看到"Thread state is null or undefined"，说明API调用失败：
- 检查LangGraph服务是否正在运行
- 检查Thread ID是否有效
- 检查网络连接

#### 问题2: Thread state没有values属性
如果看到"Thread state does not have values property"：
- 可能Thread是新创建的，没有消息历史
- 这是正常情况，应该返回空数组

#### 问题3: values是数组而不是对象
如果看到"Thread state values is an array"：
- LangGraph可能返回了不同格式的数据
- 代码会自动在数组中查找messages属性

#### 问题4: messages不是数组
如果看到"Messages property exists but is not an array"：
- LangGraph API返回了意外格式的messages
- 代码会返回空数组避免错误

### 4. 手动测试Thread状态
您可以在浏览器控制台中手动测试：

```javascript
// 获取当前加载的Thread状态
import { getThreadState } from './lib/chatApi.js';
getThreadState('your-thread-id').then(state => console.log('Thread state:', state));
```

### 5. 解决步骤
1. **检查控制台日志** - 查看具体是哪种错误情况
2. **验证Thread ID** - 确保Thread ID是有效的
3. **检查LangGraph服务** - 确保后端服务正常运行
4. **清除本地存储** - 如果需要，清除localStorage中的Thread数据：
   ```javascript
   localStorage.removeItem('assistant-threads');
   localStorage.removeItem('current-thread-id');
   ```

### 6. 如果问题持续存在
- 删除有问题的Thread并重新创建
- 检查LangGraph API文档确认正确的返回格式
- 联系开发团队获取支持

现在的代码已经增加了全面的错误处理，即使LangGraph API返回意外格式，也不会导致应用崩溃。
