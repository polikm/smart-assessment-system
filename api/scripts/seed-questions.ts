import { getDb } from '../db.js';

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(answerValue: string, allOptions: string[]): { options: string; answer: string } {
  const opts = shuffle([...allOptions]);
  const answerIndex = opts.indexOf(answerValue);
  const answer = String.fromCharCode(65 + answerIndex);
  return { options: JSON.stringify(opts), answer };
}

// ========== C++算法题生成器（原数理逻辑+计算机常识） ==========
function generateCppQuestions(count: number, gradeRange: string): any[] {
  const questions: any[] = [];
  const templates = [
    { q: 'C++中，用于声明整数类型的关键字是？', a: 'int', opts: ['float', 'int', 'char', 'double'], kp: 'C++基础', diff: 1 },
    { q: 'C++中，cout的作用是？', a: '输出数据', opts: ['输入数据', '输出数据', '定义变量', '声明函数'], kp: 'C++基础', diff: 1 },
    { q: '以下哪个是C++中的循环语句？', a: 'for', opts: ['if', 'for', 'switch', 'return'], kp: 'C++基础', diff: 1 },
    { q: 'C++中，数组的下标从几开始？', a: '0', opts: ['0', '1', '-1', '任意数'], kp: 'C++基础', diff: 1 },
    { q: 'C++中，以下哪个运算符用于取余数？', a: '%', opts: ['/', '%', '*', '-'], kp: 'C++基础', diff: 2 },
    { q: '递归算法的特点是什么？', a: '函数调用自身', opts: ['只执行一次', '函数调用自身', '不使用变量', '不返回结果'], kp: '算法基础', diff: 2 },
    { q: '以下哪种排序算法的平均时间复杂度是O(n log n)？', a: '快速排序', opts: ['冒泡排序', '快速排序', '选择排序', '插入排序'], kp: '算法基础', diff: 3 },
    { q: 'C++中，结构体（struct）主要用于什么？', a: '封装多个相关的数据', opts: ['定义函数', '封装多个相关的数据', '控制循环', '条件判断'], kp: 'C++基础', diff: 2 },
    { q: 'DFS（深度优先搜索）通常使用什么数据结构实现？', a: '栈', opts: ['队列', '栈', '链表', '哈希表'], kp: '算法基础', diff: 3 },
    { q: '二分查找算法要求数据必须满足什么条件？', a: '有序', opts: ['无序', '有序', '随机', '重复'], kp: '算法基础', diff: 2 },
    { q: '计算机的中央处理器简称是什么？', a: 'CPU', opts: ['CPU', 'GPU', 'RAM', 'ROM'], kp: '计算机基础', diff: 1 },
    { q: '以下哪个是输入设备？', a: '键盘', opts: ['键盘', '显示器', '打印机', '音箱'], kp: '计算机基础', diff: 1 },
    { q: '计算机中用来存储数据的基本单位是？', a: '字节(Byte)', opts: ['字节(Byte)', '位(Bit)', '字(Word)', '千字节(KB)'], kp: '计算机基础', diff: 2 },
    { q: '以下哪个不是操作系统？', a: 'Photoshop', opts: ['Photoshop', 'Windows', 'macOS', 'Linux'], kp: '计算机基础', diff: 2 },
    { q: '互联网的全称是？', a: '因特网', opts: ['因特网', '局域网', '广域网', '城域网'], kp: '计算机基础', diff: 1 },
    { q: '以下哪个是浏览器？', a: 'Chrome', opts: ['Chrome', 'Word', 'Excel', 'PowerPoint'], kp: '计算机基础', diff: 1 },
    { q: '计算机病毒是一种？', a: '程序', opts: ['程序', '硬件', '文件', '网络'], kp: '计算机基础', diff: 2 },
    { q: '以下哪个键可以删除光标后的字符？', a: 'Delete', opts: ['Delete', 'Backspace', 'Enter', 'Shift'], kp: '计算机基础', diff: 1 },
    { q: 'USB接口的全称是？', a: '通用串行总线', opts: ['通用串行总线', '通用并行总线', '快速串行总线', '高速并行总线'], kp: '计算机基础', diff: 3 },
    { q: '以下哪个存储设备容量最大？', a: '硬盘', opts: ['硬盘', 'U盘', '内存条', '光盘'], kp: '计算机基础', diff: 2 },
    { q: 'Ctrl+C 的功能是？', a: '复制', opts: ['复制', '粘贴', '剪切', '全选'], kp: '计算机基础', diff: 1 },
    { q: 'Wi-Fi 使用的是哪种无线通信技术？', a: '无线电波', opts: ['无线电波', '红外线', '蓝牙', '光纤'], kp: '计算机基础', diff: 2 },
    { q: '计算机的内存条断电后数据会？', a: '丢失', opts: ['丢失', '保留', '自动备份', '转移到硬盘'], kp: '计算机基础', diff: 2 },
    { q: '以下哪个是输出设备？', a: '显示器', opts: ['显示器', '鼠标', '键盘', '扫描仪'], kp: '计算机基础', diff: 1 },
    { q: '文件的扩展名".docx"通常是什么类型的文件？', a: 'Word文档', opts: ['Word文档', 'Excel表格', '图片', '视频'], kp: '计算机基础', diff: 1 },
    { q: 'IP地址由几组数字组成？', a: '4组', opts: ['4组', '3组', '5组', '6组'], kp: '计算机基础', diff: 3 },
    { q: '以下哪个不是搜索引擎？', a: '微信', opts: ['微信', '百度', '谷歌', '必应'], kp: '计算机基础', diff: 1 },
    { q: '计算机中1GB等于多少MB？', a: '1024MB', opts: ['1024MB', '1000MB', '512MB', '2048MB'], kp: '计算机基础', diff: 2 },
    { q: '以下哪个是开源操作系统？', a: 'Linux', opts: ['Linux', 'Windows', 'macOS', 'iOS'], kp: '计算机基础', diff: 3 },
    { q: '以下哪个是云存储服务？', a: '百度网盘', opts: ['百度网盘', 'QQ', '微信', '淘宝'], kp: '计算机基础', diff: 1 },
  ];

  let id = 10000;
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const difficulty = Math.min(5, Math.max(1, t.diff + rand(-1, 1)));
    const score = difficulty <= 2 ? 5 : difficulty <= 4 ? 10 : 15;

    const { options, answer } = generateOptions(t.a, t.opts);
    questions.push({
      id: id++,
      content: t.q,
      options,
      answer,
      explanation: `正确答案是${t.a}。`,
      knowledge_point: t.kp,
      course_type: 'cpp',
      grade_range: gradeRange,
      difficulty,
      score,
      status: 'approved',
      usage_count: 0,
      correct_rate: 0,
    });
  }

  return questions;
}

// ========== Scratch图形化编程题生成器 ==========
function generateScratchQuestions(count: number, gradeRange: string): any[] {
  const questions: any[] = [];
  const templates = [
    { q: 'Scratch中，让角色移动的积木属于哪个类别？', a: '运动', opts: ['外观', '运动', '声音', '事件'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中的"重复执行"积木属于什么结构？', a: '循环结构', opts: ['顺序结构', '循环结构', '分支结构', '事件结构'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中，"当绿旗被点击"积木的作用是什么？', a: '启动程序', opts: ['结束程序', '启动程序', '暂停程序', '保存项目'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中的"如果...那么"积木属于什么结构？', a: '分支结构', opts: ['循环结构', '分支结构', '顺序结构', '事件结构'], kp: 'Scratch基础', diff: 2 },
    { q: 'Scratch中，变量可以用来存储什么？', a: '可以存储数字、文字等', opts: ['只能存储数字', '可以存储数字、文字等', '只能存储图片', '只能存储声音'], kp: 'Scratch基础', diff: 2 },
    { q: 'Scratch中的"广播"功能主要用于什么？', a: '角色之间的通信', opts: ['播放音乐', '角色之间的通信', '删除角色', '保存文件'], kp: 'Scratch进阶', diff: 2 },
    { q: 'Scratch中，"克隆"功能可以实现什么效果？', a: '创建角色的副本', opts: ['删除角色', '创建角色的副本', '改变角色大小', '旋转角色'], kp: 'Scratch进阶', diff: 3 },
    { q: 'Scratch项目保存后的文件扩展名是什么？', a: '.sb3', opts: ['.doc', '.sb3', '.jpg', '.mp3'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中，"碰到边缘就反弹"积木属于哪个类别？', a: '运动', opts: ['外观', '运动', '控制', '侦测'], kp: 'Scratch基础', diff: 2 },
    { q: 'Scratch中的"列表"与"变量"的主要区别是什么？', a: '列表可以存储多个值，变量只能存储一个值', opts: ['没有区别', '列表可以存储多个值，变量只能存储一个值', '变量可以存储多个值，列表只能存储一个值', '列表只能存储数字'], kp: 'Scratch进阶', diff: 3 },
    { q: 'Scratch中，"图章"积木的作用是什么？', a: '在舞台留下角色的印记', opts: ['删除角色', '在舞台留下角色的印记', '复制角色', '改变角色颜色'], kp: 'Scratch进阶', diff: 3 },
    { q: 'Scratch中，"自定义积木"的作用是什么？', a: '创建可重复使用的代码块', opts: ['删除积木', '创建可重复使用的代码块', '改变积木颜色', '移动积木位置'], kp: 'Scratch进阶', diff: 3 },
    { q: 'Scratch中，"等待1秒"积木属于哪个类别？', a: '控制', opts: ['运动', '外观', '控制', '侦测'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中，"将大小增加10"积木属于哪个类别？', a: '外观', opts: ['运动', '外观', '声音', '事件'], kp: 'Scratch基础', diff: 1 },
    { q: 'Scratch中，"播放声音"积木属于哪个类别？', a: '声音', opts: ['运动', '外观', '声音', '控制'], kp: 'Scratch基础', diff: 1 },
  ];

  let id = 20000;
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const difficulty = Math.min(5, Math.max(1, t.diff + rand(-1, 1)));
    const score = difficulty <= 2 ? 5 : difficulty <= 4 ? 10 : 15;

    const { options, answer } = generateOptions(t.a, t.opts);
    questions.push({
      id: id++,
      content: t.q,
      options,
      answer,
      explanation: `正确答案是${t.a}。`,
      knowledge_point: t.kp,
      course_type: 'scratch',
      grade_range: gradeRange,
      difficulty,
      score,
      status: 'approved',
      usage_count: 0,
      correct_rate: 0,
    });
  }

  return questions;
}

// ========== AIGC常识题生成器 ==========
function generateAIGCCommonQuestions(count: number, gradeRange: string): any[] {
  const questions: any[] = [];
  const templates = [
    { q: 'AI 的全称是什么？', a: '人工智能', opts: ['人工智能', '自动识别', '增强现实', '人工交互'], kp: 'AI概念', diff: 1 },
    { q: '以下哪个是AI绘画工具？', a: 'Midjourney', opts: ['Midjourney', 'Photoshop', 'Word', 'Excel'], kp: 'AIGC工具', diff: 1 },
    { q: 'ChatGPT 是什么类型的AI？', a: '大语言模型', opts: ['大语言模型', '图像识别', '语音识别', '自动驾驶'], kp: 'AI概念', diff: 2 },
    { q: 'AIGC 的全称是？', a: '人工智能生成内容', opts: ['人工智能生成内容', '人工智能游戏创作', '自动图像生成控制', '增强智能图形计算'], kp: 'AI概念', diff: 2 },
    { q: '以下哪个不是AIGC的应用？', a: '自动驾驶', opts: ['自动驾驶', 'AI写作', 'AI绘画', 'AI作曲'], kp: 'AIGC应用', diff: 2 },
    { q: '给AI的指令通常叫什么？', a: '提示词(Prompt)', opts: ['提示词(Prompt)', '命令行', '代码', '脚本'], kp: '提示词工程', diff: 1 },
    { q: 'AI生成的内容可能存在什么问题？', a: '版权问题', opts: ['版权问题', '颜色问题', '大小问题', '格式问题'], kp: 'AI伦理', diff: 2 },
    { q: '以下哪个是国内的AI大模型？', a: '文心一言', opts: ['文心一言', 'Facebook', 'Twitter', 'Instagram'], kp: 'AIGC工具', diff: 1 },
    { q: 'AI换脸技术可能带来什么风险？', a: '隐私泄露', opts: ['隐私泄露', '网速变慢', '电脑发热', '屏幕变暗'], kp: 'AI伦理', diff: 2 },
    { q: '以下哪个是AI写作工具？', a: 'ChatGPT', opts: ['ChatGPT', '计算器', '画图板', '记事本'], kp: 'AIGC工具', diff: 1 },
    { q: 'AI生成的图片版权归谁？', a: '存在争议', opts: ['存在争议', 'AI公司', '使用者', ' nobody'], kp: 'AI伦理', diff: 3 },
    { q: '以下哪个是AI音乐生成工具？', a: 'Suno', opts: ['Suno', 'Photoshop', 'Premiere', 'AutoCAD'], kp: 'AIGC工具', diff: 2 },
    { q: '训练AI模型需要什么？', a: '大量数据', opts: ['大量数据', '更多内存', '更大屏幕', '更快键盘'], kp: 'AI概念', diff: 2 },
    { q: 'AI生成的内容是否总是正确的？', a: '不一定', opts: ['不一定', '总是正确', '总是错误', '看心情'], kp: 'AI伦理', diff: 1 },
    { q: '以下哪个是AI视频生成工具？', a: 'Sora', opts: ['Sora', 'Excel', 'PowerPoint', '记事本'], kp: 'AIGC工具', diff: 2 },
    { q: '使用AI时，我们应该？', a: '批判性思考', opts: ['批判性思考', '完全相信', '从不使用', '随意传播'], kp: 'AI伦理', diff: 2 },
    { q: 'AI可以帮助我们做以下哪件事？', a: '写作文', opts: ['写作文', '吃饭', '睡觉', '跑步'], kp: 'AIGC应用', diff: 1 },
    { q: '以下哪个是提示词工程的原则？', a: '描述要具体清晰', opts: ['描述要具体清晰', '越短越好', '用外语最好', '不用标点'], kp: '提示词工程', diff: 2 },
    { q: 'AI绘画时，"风格"提示词的作用是什么？', a: '控制画面风格', opts: ['控制画面风格', '改变图片大小', '增加文件大小', '加快生成速度'], kp: '提示词工程', diff: 2 },
    { q: '以下哪个不是AI的伦理问题？', a: 'AI让电脑变快', opts: ['AI让电脑变快', 'AI偏见', '隐私泄露', '深度伪造'], kp: 'AI伦理', diff: 2 },
    { q: 'AI模型"通义千问"是哪个公司的？', a: '阿里巴巴', opts: ['阿里巴巴', '腾讯', '百度', '字节跳动'], kp: 'AIGC工具', diff: 2 },
    { q: 'AI生成内容时，我们应该？', a: '标注AI生成', opts: ['标注AI生成', '声称是自己原创', '删除来源', '随意转发'], kp: 'AI伦理', diff: 1 },
    { q: '以下哪个是AI语音合成工具？', a: 'ElevenLabs', opts: ['ElevenLabs', 'Photoshop', 'Illustrator', 'Maya'], kp: 'AIGC工具', diff: 3 },
    { q: 'AI的"幻觉"是指什么？', a: '生成虚假信息', opts: ['生成虚假信息', '出现图像', '产生声音', '显示动画'], kp: 'AI概念', diff: 3 },
    { q: '以下哪个是国内的AI绘画工具？', a: '通义万相', opts: ['通义万相', 'Word', 'Excel', 'PowerPoint'], kp: 'AIGC工具', diff: 2 },
  ];

  let id = 30000;
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const difficulty = Math.min(5, Math.max(1, t.diff + rand(-1, 1)));
    const score = difficulty <= 2 ? 5 : difficulty <= 4 ? 10 : 15;

    const { options, answer } = generateOptions(t.a, t.opts);
    questions.push({
      id: id++,
      content: t.q,
      options,
      answer,
      explanation: `正确答案是${t.a}。`,
      knowledge_point: 'AIGC常识',
      course_type: 'aigc',
      grade_range: gradeRange,
      difficulty,
      score,
      status: 'approved',
      usage_count: 0,
      correct_rate: 0,
    });
  }

  return questions;
}

// ========== Python编程题生成器 ==========
function generatePythonQuestions(count: number, gradeRange: string): any[] {
  const questions: any[] = [];
  const templates = [
    { q: 'Python中，用于输出内容的函数是？', a: 'print()', opts: ['input()', 'print()', 'output()', 'show()'], kp: 'Python基础', diff: 1 },
    { q: '以下哪个是合法的变量名？', a: '_score', opts: ['2name', 'my-name', '_score', 'class'], kp: 'Python基础', diff: 2 },
    { q: '条件判断语句if的作用是？', a: '根据条件选择执行路径', opts: ['循环执行', '根据条件选择执行路径', '定义函数', '导入模块'], kp: 'Python基础', diff: 1 },
    { q: '在编程中，"bug"指的是什么？', a: '程序中的错误', opts: ['昆虫', '程序中的错误', '病毒', '游戏角色'], kp: 'Python基础', diff: 1 },
    { q: 'Python中，用于存储多个数据的数据类型是？', a: 'list', opts: ['int', 'str', 'list', 'bool'], kp: 'Python基础', diff: 2 },
    { q: 'Python中，len()函数的作用是？', a: '计算长度', opts: ['计算长度', '计算面积', '计算体积', '计算速度'], kp: 'Python基础', diff: 2 },
    { q: '以下哪种数据结构是"先进先出"的？', a: '队列', opts: ['栈', '队列', '数组', '链表'], kp: 'Python进阶', diff: 3 },
    { q: '面向对象编程中的"类"（Class）是什么？', a: '创建对象的模板', opts: ['一种数据类型', '创建对象的模板', '一个函数', '一个变量'], kp: 'Python进阶', diff: 3 },
    { q: '算法的时间复杂度表示什么？', a: '算法执行时间随输入规模增长的变化趋势', opts: ['代码行数', '算法执行时间随输入规模增长的变化趋势', '程序运行时间', '内存使用量'], kp: 'Python进阶', diff: 3 },
    { q: 'Python中，for循环通常用于什么场景？', a: '遍历序列中的元素', opts: ['条件判断', '遍历序列中的元素', '定义函数', '导入模块'], kp: 'Python基础', diff: 1 },
    { q: 'Python中，字典用哪种符号表示？', a: '花括号{}', opts: ['方括号[]', '圆括号()', '花括号{}', '尖括号<>'], kp: 'Python基础', diff: 2 },
    { q: 'Python中，def关键字用于？', a: '定义函数', opts: ['定义函数', '定义变量', '定义类', '定义模块'], kp: 'Python基础', diff: 2 },
    { q: 'Python中，Turtle绘图模块的作用是？', a: '绘制图形', opts: ['播放音乐', '绘制图形', '处理数据', '网络通信'], kp: 'Python基础', diff: 1 },
    { q: 'Python中，以下哪个不是基本数据类型？', a: 'array', opts: ['int', 'str', 'bool', 'array'], kp: 'Python基础', diff: 2 },
    { q: 'Python中，range(5)生成的序列是？', a: '0,1,2,3,4', opts: ['0,1,2,3,4', '1,2,3,4,5', '0,1,2,3,4,5', '1,2,3,4'], kp: 'Python基础', diff: 2 },
  ];

  let id = 40000;
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const difficulty = Math.min(5, Math.max(1, t.diff + rand(-1, 1)));
    const score = difficulty <= 2 ? 5 : difficulty <= 4 ? 10 : 15;

    const { options, answer } = generateOptions(t.a, t.opts);
    questions.push({
      id: id++,
      content: t.q,
      options,
      answer,
      explanation: `正确答案是${t.a}。`,
      knowledge_point: t.kp,
      course_type: 'python',
      grade_range: gradeRange,
      difficulty,
      score,
      status: 'approved',
      usage_count: 0,
      correct_rate: 0,
    });
  }

  return questions;
}

// ========== AIGC素养题生成器 ==========
function generateAIGCQuestions(count: number, gradeRange: string): any[] {
  const questions: any[] = [];
  const templates = [
    { q: 'AI绘画中，"prompt"指的是？', a: '提示词', opts: ['提示词', '程序', '插件', '滤镜'], kp: 'AI绘画', diff: 1 },
    { q: '以下哪个是AI绘画的风格关键词？', a: '水彩画', opts: ['水彩画', '快速', '大声', '明亮'], kp: 'AI绘画', diff: 1 },
    { q: 'AI生成图片时，分辨率越高意味着？', a: '图片越清晰', opts: ['图片越清晰', '生成越快', '文件越小', '颜色越少'], kp: 'AI绘画', diff: 1 },
    { q: '以下哪个不是AI绘画的参数？', a: '音量', opts: ['音量', '步数', '引导比例', '种子'], kp: 'AI绘画', diff: 2 },
    { q: 'AI视频中，"关键帧"的作用是？', a: '控制画面变化', opts: ['控制画面变化', '增加音量', '改变颜色', '调整大小'], kp: 'AI音视频', diff: 2 },
    { q: 'AI写作时，"温度"参数控制什么？', a: '创意程度', opts: ['创意程度', '文章长度', '字体大小', '段落数量'], kp: 'AI写作', diff: 3 },
    { q: '以下哪个是AI音频生成工具？', a: 'Suno', opts: ['Suno', 'Photoshop', 'Premiere', 'Blender'], kp: 'AI音视频', diff: 2 },
    { q: 'AI绘画中，"负面提示词"的作用是？', a: '排除不需要的元素', opts: ['排除不需要的元素', '增加颜色', '提高分辨率', '加快生成'], kp: 'AI绘画', diff: 2 },
    { q: '以下哪个是AI写作的应用场景？', a: '写邮件', opts: ['写邮件', '做饭', '跑步', '睡觉'], kp: 'AI写作', diff: 1 },
    { q: 'AI生成视频时，"帧率"指的是？', a: '每秒画面数', opts: ['每秒画面数', '视频时长', '视频大小', '视频颜色'], kp: 'AI音视频', diff: 2 },
    { q: 'AI绘画中，"LoRA"是什么？', a: '微调模型', opts: ['微调模型', '绘画软件', '图片格式', '颜色模式'], kp: 'AI绘画', diff: 4 },
    { q: '以下哪个是AI视频生成平台？', a: 'Runway', opts: ['Runway', 'WordPress', 'Shopify', 'Slack'], kp: 'AI音视频', diff: 2 },
    { q: 'AI写作中，"续写"功能可以？', a: '接着已有内容写下去', opts: ['接着已有内容写下去', '删除内容', '翻译内容', '打印内容'], kp: 'AI写作', diff: 1 },
    { q: 'AI绘画中，"ControlNet"的作用是？', a: '控制图像结构', opts: ['控制图像结构', '增加颜色', '改变大小', '加快生成'], kp: 'AI绘画', diff: 4 },
    { q: '以下哪个是AI音乐的风格？', a: '古典', opts: ['古典', '红色', '圆形', '大'], kp: 'AI音视频', diff: 1 },
  ];

  let id = 50000;
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const difficulty = Math.min(5, Math.max(1, t.diff + rand(-1, 1)));
    const score = difficulty <= 2 ? 5 : difficulty <= 4 ? 10 : 15;

    const { options, answer } = generateOptions(t.a, t.opts);
    questions.push({
      id: id++,
      content: t.q,
      options,
      answer,
      explanation: `正确答案是${t.a}。`,
      knowledge_point: t.kp,
      course_type: 'aigc',
      grade_range: gradeRange,
      difficulty,
      score,
      status: 'approved',
      usage_count: 0,
      correct_rate: 0,
    });
  }

  return questions;
}

// ========== 主函数 ==========
async function seedQuestions() {
  const db = await getDb();
  console.log('开始生成题目...');

  const allQuestions: any[] = [];

  // C++算法题（含计算机常识）- 200道
  console.log('生成C++算法题...');
  allQuestions.push(...generateCppQuestions(60, '1-3'));
  allQuestions.push(...generateCppQuestions(80, '4-6'));
  allQuestions.push(...generateCppQuestions(60, '7-9'));

  // Scratch图形化编程题 - 200道
  console.log('生成Scratch图形化编程题...');
  allQuestions.push(...generateScratchQuestions(60, '1-3'));
  allQuestions.push(...generateScratchQuestions(80, '4-6'));
  allQuestions.push(...generateScratchQuestions(60, '7-9'));

  // AIGC常识题 - 50道
  console.log('生成AIGC常识题...');
  allQuestions.push(...generateAIGCCommonQuestions(25, '4-6'));
  allQuestions.push(...generateAIGCCommonQuestions(25, '7-9'));

  // Python编程题 - 200道
  console.log('生成Python编程题...');
  allQuestions.push(...generatePythonQuestions(60, '1-3'));
  allQuestions.push(...generatePythonQuestions(80, '4-6'));
  allQuestions.push(...generatePythonQuestions(60, '7-9'));

  // AIGC素养题 - 200道
  console.log('生成AIGC素养题...');
  allQuestions.push(...generateAIGCQuestions(60, '1-3'));
  allQuestions.push(...generateAIGCQuestions(80, '4-6'));
  allQuestions.push(...generateAIGCQuestions(60, '7-9'));

  // 额外补充题 - 300道（混合类型）
  console.log('生成补充题...');
  allQuestions.push(...generateCppQuestions(75, '4-6'));
  allQuestions.push(...generateScratchQuestions(75, '4-6'));
  allQuestions.push(...generatePythonQuestions(75, '4-6'));
  allQuestions.push(...generateAIGCQuestions(75, '4-6'));

  console.log(`共生成 ${allQuestions.length} 道题目，开始插入数据库...`);

  let inserted = 0;
  for (const q of allQuestions) {
    try {
      await db.run(
        `INSERT INTO questions (content, options, answer, explanation, knowledge_point, course_type, grade_range, difficulty, score, status, usage_count, correct_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.content, q.options, q.answer, q.explanation, q.knowledge_point, q.course_type, q.grade_range, q.difficulty, q.score, q.status, q.usage_count, q.correct_rate]
      );
      inserted++;
    } catch (err) {
      console.error(`插入题目失败: ${q.content.substring(0, 30)}...`, err);
    }
  }

  console.log(`成功插入 ${inserted} 道题目！`);

  // 统计各类型题目数量
  const stats = await db.all(`
    SELECT course_type, grade_range, COUNT(*) as count 
    FROM questions 
    GROUP BY course_type, grade_range
  `);
  console.log('题目分布统计:');
  for (const s of stats) {
    console.log(`  ${s.course_type} / ${s.grade_range}: ${s.count}道`);
  }

  const total = await db.get('SELECT COUNT(*) as count FROM questions');
  console.log(`题库总计: ${total.count} 道题目`);
}

seedQuestions().catch(console.error);
