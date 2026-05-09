import bcryptjs from 'bcryptjs';
import { getDb } from './db.js';

const aigcKnowledgePoints: Record<string, string[]> = {
  '1-3': ['AI绘画基础', '色彩认知', '创意表达', '图像识别', 'AI工具初识'],
  '4-6': ['AI绘画进阶', '图像生成原理', 'AI音视频基础', '提示词工程', '创意AI应用'],
  '7-9': ['AIGC技术原理', '深度学习基础', 'AI视频制作', 'AI音乐创作', 'AIGC伦理'],
};

const scratchKnowledgePoints: Record<string, string[]> = {
  '1-3': ['Scratch基础', '顺序结构', '循环结构', '事件处理', '角色动画'],
  '4-6': ['Scratch进阶', '克隆与图章', '变量与列表', '自定义积木', '综合游戏开发'],
  '7-9': ['Scratch高级', '递归思想', '网络基础', '复杂项目', '算法启蒙'],
};

const pythonKnowledgePoints: Record<string, string[]> = {
  '1-3': ['Python基础语法', '输入输出', 'Turtle绘图', '简单计算', '字符串基础'],
  '4-6': ['Python进阶', '条件判断', '列表与字典', '函数基础', '游戏开发入门'],
  '7-9': ['Python高级', '面向对象编程', 'Pygame Zero', '数据结构', '算法设计'],
};

const cppKnowledgePoints: Record<string, string[]> = {
  '1-3': ['计算机基础', '变量与输入输出', '顺序结构', '简单计算', '程序调试'],
  '4-6': ['循环与分支', '数组基础', '字符串处理', '函数入门', '一维数组应用'],
  '7-9': ['C++算法', '递归与排序', 'DFS与回溯', '贪心与二分', '竞赛算法'],
};

const mathKnowledgePoints: Record<string, string[]> = {
  '1-3': ['数与运算', '图形认知', '逻辑推理', '规律发现', '简单应用'],
  '4-6': ['整数运算', '几何基础', '逻辑推理', '数列规律', '应用题分析'],
  '7-9': ['代数基础', '几何证明', '逻辑推理', '组合计数', '算法思维'],
};

function getGradeRange(grade: number): string {
  if (grade <= 3) return '1-3';
  if (grade <= 6) return '4-6';
  return '7-9';
}

function generateAIGCQuestion(
  grade: number,
  index: number,
  kp: string
): {
  course_type: string;
  grade_range: string;
  question_type: string;
  content: string;
  options: string;
  answer: string;
  explanation: string;
  knowledge_point: string;
  score: number;
  difficulty: number;
} {
  const questions = [
    {
      content: `以下哪个工具可以用于AI绘画创作？`,
      options: ['Photoshop', 'Midjourney', 'Word', 'Excel'],
      answer: 'B',
      explanation: 'Midjourney是一款流行的AI绘画工具，可以根据文字描述生成图像。',
    },
    {
      content: `AI绘画的核心技术是什么？`,
      options: ['数据库查询', '深度学习/扩散模型', '文件压缩', '网络传输'],
      answer: 'B',
      explanation: 'AI绘画主要基于深度学习的扩散模型技术，通过学习大量图像数据生成新图像。',
    },
    {
      content: `在AI绘画中，"提示词"（Prompt）的作用是什么？`,
      options: ['保存图片', '描述想要生成的图像内容', '删除图片', '压缩图片'],
      answer: 'B',
      explanation: '提示词用于向AI描述你想要生成的图像内容，是AI绘画的重要输入。',
    },
    {
      content: `AI生成的视频属于以下哪种技术？`,
      options: ['传统动画', 'AIGC', '手工绘制', '摄影技术'],
      answer: 'B',
      explanation: 'AI生成的视频属于AIGC（人工智能生成内容）技术范畴。',
    },
    {
      content: `使用AI工具时，以下哪种做法是正确的？`,
      options: ['随意使用他人作品训练AI', '遵守使用规范，尊重版权', '生成虚假信息传播', '冒充他人创作'],
      answer: 'B',
      explanation: '使用AI工具时应遵守相关规范，尊重知识产权和他人权益。',
    },
    {
      content: `AI音乐生成工具可以做什么？`,
      options: ['只能播放音乐', '根据描述生成音乐', '删除音乐文件', '只能编辑歌词'],
      answer: 'B',
      explanation: 'AI音乐生成工具可以根据用户的文字描述或风格要求生成原创音乐。',
    },
    {
      content: `以下哪个不是AIGC的应用领域？`,
      options: ['文本生成', '图像生成', '机械加工', '音频生成'],
      answer: 'C',
      explanation: '机械加工是传统的制造业领域，不属于AIGC（人工智能生成内容）的应用范畴。',
    },
    {
      content: `AI绘画中的"风格迁移"是指什么？`,
      options: ['改变图片格式', '将一种艺术风格应用到另一张图片上', '删除图片背景', '调整图片大小'],
      answer: 'B',
      explanation: '风格迁移是将一种图像的艺术风格应用到另一张图像上的AI技术。',
    },
    {
      content: `提示词工程（Prompt Engineering）的主要目的是？`,
      options: ['修复电脑', '优化输入描述以获得更好的AI输出', '编写程序代码', '设计网页'],
      answer: 'B',
      explanation: '提示词工程是通过优化输入描述，引导AI生成更符合预期的输出内容。',
    },
    {
      content: `AI生成内容可能存在哪些问题？`,
      options: ['总是完美无误', '可能存在偏见或不准确信息', '无法生成图像', '只能生成文字'],
      answer: 'B',
      explanation: 'AI生成内容可能存在偏见、不准确或不符合事实的情况，需要人工审核。',
    },
  ];

  const q = questions[index % questions.length];
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'aigc',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: kp,
    score: 5,
    difficulty,
  };
}

function generateScratchQuestion(
  grade: number,
  index: number,
  kp: string
): {
  course_type: string;
  grade_range: string;
  question_type: string;
  content: string;
  options: string;
  answer: string;
  explanation: string;
  knowledge_point: string;
  score: number;
  difficulty: number;
} {
  const questions = [
    {
      content: `在Scratch中，让角色移动的积木属于哪个类别？`,
      options: ['外观', '运动', '声音', '事件'],
      answer: 'B',
      explanation: 'Scratch中的运动积木用于控制角色的移动、旋转等动作。',
    },
    {
      content: `Scratch中的"重复执行"积木属于什么结构？`,
      options: ['顺序结构', '循环结构', '分支结构', '事件结构'],
      answer: 'B',
      explanation: '重复执行积木用于重复执行某段代码，属于循环结构。',
    },
    {
      content: `在Scratch中，"当绿旗被点击"积木的作用是什么？`,
      options: ['结束程序', '启动程序', '暂停程序', '保存项目'],
      answer: 'B',
      explanation: '当绿旗被点击是Scratch中最常用的事件积木，用于启动程序。',
    },
    {
      content: `Scratch中的"如果...那么"积木属于什么结构？`,
      options: ['循环结构', '分支结构', '顺序结构', '事件结构'],
      answer: 'B',
      explanation: '如果...那么积木根据条件判断执行不同的代码，属于分支结构。',
    },
    {
      content: `在Scratch中，变量可以用来存储什么？`,
      options: ['只能存储数字', '可以存储数字、文字等', '只能存储图片', '只能存储声音'],
      answer: 'B',
      explanation: 'Scratch中的变量可以存储数字、文字（字符串）等多种类型的数据。',
    },
    {
      content: `Scratch中的"广播"功能主要用于什么？`,
      options: ['播放音乐', '角色之间的通信', '删除角色', '保存文件'],
      answer: 'B',
      explanation: '广播功能用于不同角色之间的通信和协调，一个角色发送广播，其他角色可以接收并响应。',
    },
    {
      content: `在Scratch中，"克隆"功能可以实现什么效果？`,
      options: ['删除角色', '创建角色的副本', '改变角色大小', '旋转角色'],
      answer: 'B',
      explanation: '克隆功能可以创建角色的副本，常用于制作弹幕、雨滴等多对象效果。',
    },
    {
      content: `Scratch项目保存后的文件扩展名是什么？`,
      options: ['.doc', '.sb3', '.jpg', '.mp3'],
      answer: 'B',
      explanation: 'Scratch 3.0项目保存后的文件扩展名为.sb3。',
    },
    {
      content: `在Scratch中，"碰到边缘就反弹"积木属于哪个类别？`,
      options: ['外观', '运动', '控制', '侦测'],
      answer: 'B',
      explanation: '碰到边缘就反弹是运动类别的积木，用于控制角色的运动行为。',
    },
    {
      content: `Scratch中的"列表"与"变量"的主要区别是什么？`,
      options: ['没有区别', '列表可以存储多个值，变量只能存储一个值', '变量可以存储多个值，列表只能存储一个值', '列表只能存储数字'],
      answer: 'B',
      explanation: '列表可以存储多个值（类似数组），而变量只能存储一个值。',
    },
  ];

  const q = questions[index % questions.length];
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'scratch',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: kp,
    score: 5,
    difficulty,
  };
}

function generatePythonQuestion(
  grade: number,
  index: number,
  kp: string
): {
  course_type: string;
  grade_range: string;
  question_type: string;
  content: string;
  options: string;
  answer: string;
  explanation: string;
  knowledge_point: string;
  score: number;
  difficulty: number;
} {
  const questions = [
    {
      content: `Python中，用于输出内容的函数是？`,
      options: ['input()', 'print()', 'output()', 'show()'],
      answer: 'B',
      explanation: 'Python中使用print()函数将内容输出到控制台。',
    },
    {
      content: `以下哪个是合法的变量名？`,
      options: ['2name', 'my-name', '_score', 'class'],
      answer: 'C',
      explanation: 'Python变量名可以以字母或下划线开头，不能包含连字符，也不能使用保留字。',
    },
    {
      content: `条件判断语句if的作用是？`,
      options: ['循环执行', '根据条件选择执行路径', '定义函数', '导入模块'],
      answer: 'B',
      explanation: 'if语句用于根据条件的真假来决定执行哪段代码。',
    },
    {
      content: `在编程中，"bug"指的是什么？`,
      options: ['昆虫', '程序中的错误', '病毒', '游戏角色'],
      answer: 'B',
      explanation: '在编程中，bug指的是程序中的错误或缺陷。',
    },
    {
      content: `Python中，用于存储多个数据的数据类型是？`,
      options: ['int', 'str', 'list', 'bool'],
      answer: 'C',
      explanation: 'list（列表）是Python中用于存储多个数据的数据类型。',
    },
    {
      content: `Python中，len()函数的作用是？`,
      options: ['计算长度', '计算面积', '计算体积', '计算速度'],
      answer: 'A',
      explanation: 'len()函数用于计算字符串、列表等对象的长度。',
    },
    {
      content: `以下哪种数据结构是"先进先出"的？`,
      options: ['栈', '队列', '数组', '链表'],
      answer: 'B',
      explanation: '队列（Queue）是一种先进先出（FIFO）的数据结构。',
    },
    {
      content: `面向对象编程中的"类"（Class）是什么？`,
      options: ['一种数据类型', '创建对象的模板', '一个函数', '一个变量'],
      answer: 'B',
      explanation: '类是面向对象编程中创建对象的模板，定义了对象的属性和方法。',
    },
    {
      content: `算法的时间复杂度表示什么？`,
      options: ['代码行数', '算法执行时间随输入规模增长的变化趋势', '程序运行时间', '内存使用量'],
      answer: 'B',
      explanation: '时间复杂度描述的是算法执行时间随输入数据规模增长的变化趋势。',
    },
    {
      content: `Python中，for循环通常用于什么场景？`,
      options: ['条件判断', '遍历序列中的元素', '定义函数', '导入模块'],
      answer: 'B',
      explanation: 'for循环常用于遍历列表、字符串等序列中的每个元素。',
    },
  ];

  const q = questions[index % questions.length];
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'python',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: kp,
    score: 5,
    difficulty,
  };
}

function generateCppQuestion(
  grade: number,
  index: number,
  kp: string
): {
  course_type: string;
  grade_range: string;
  question_type: string;
  content: string;
  options: string;
  answer: string;
  explanation: string;
  knowledge_point: string;
  score: number;
  difficulty: number;
} {
  const questions = [
    {
      content: `C++中，用于声明整数类型的关键字是？`,
      options: ['float', 'int', 'char', 'double'],
      answer: 'B',
      explanation: 'C++中使用int关键字声明整数类型的变量。',
    },
    {
      content: `C++中，cout的作用是？`,
      options: ['输入数据', '输出数据', '定义变量', '声明函数'],
      answer: 'B',
      explanation: 'cout是C++标准输出流对象，用于将数据输出到控制台。',
    },
    {
      content: `以下哪个是C++中的循环语句？`,
      options: ['if', 'for', 'switch', 'return'],
      answer: 'B',
      explanation: 'for是C++中的循环语句，用于重复执行某段代码。',
    },
    {
      content: `C++中，数组的下标从几开始？`,
      options: ['0', '1', '-1', '任意数'],
      answer: 'A',
      explanation: 'C++中数组的下标从0开始，第一个元素是arr[0]。',
    },
    {
      content: `C++中，以下哪个运算符用于取余数？`,
      options: ['/', '%', '*', '-'],
      answer: 'B',
      explanation: '%是取模（取余数）运算符，如10 % 3 = 1。',
    },
    {
      content: `递归算法的特点是什么？`,
      options: ['只执行一次', '函数调用自身', '不使用变量', '不返回结果'],
      answer: 'B',
      explanation: '递归是函数在执行过程中调用自身的编程技巧。',
    },
    {
      content: `以下哪种排序算法的平均时间复杂度是O(n log n)？`,
      options: ['冒泡排序', '快速排序', '选择排序', '插入排序'],
      answer: 'B',
      explanation: '快速排序的平均时间复杂度为O(n log n)，是常用的高效排序算法。',
    },
    {
      content: `C++中，结构体（struct）主要用于什么？`,
      options: ['定义函数', '封装多个相关的数据', '控制循环', '条件判断'],
      answer: 'B',
      explanation: '结构体用于将多个相关的数据封装在一起，形成一个新的数据类型。',
    },
    {
      content: `DFS（深度优先搜索）通常使用什么数据结构实现？`,
      options: ['队列', '栈', '链表', '哈希表'],
      answer: 'B',
      explanation: 'DFS通常使用栈（递归调用栈或显式栈）来实现。',
    },
    {
      content: `二分查找算法要求数据必须满足什么条件？`,
      options: ['无序', '有序', '随机', '重复'],
      answer: 'B',
      explanation: '二分查找要求数据必须是有序的，每次将搜索范围缩小一半。',
    },
  ];

  const q = questions[index % questions.length];
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'cpp',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: kp,
    score: 5,
    difficulty,
  };
}

function generateMathQuestion(
  grade: number,
  index: number,
  kp: string
): {
  course_type: string;
  grade_range: string;
  question_type: string;
  content: string;
  options: string;
  answer: string;
  explanation: string;
  knowledge_point: string;
  score: number;
  difficulty: number;
} {
  const questions = [
    {
      content: `小明有12颗糖，给了小红5颗，还剩几颗？`,
      options: ['5颗', '6颗', '7颗', '8颗'],
      answer: 'C',
      explanation: '12 - 5 = 7，所以小明还剩7颗糖。',
    },
    {
      content: `找规律：2, 4, 6, 8, __，下一个数是多少？`,
      options: ['9', '10', '12', '14'],
      answer: 'B',
      explanation: '这是一个等差数列，公差为2，所以下一个数是10。',
    },
    {
      content: `一个正方形有4条边，那么3个正方形一共有几条边？`,
      options: ['8条', '10条', '12条', '14条'],
      answer: 'C',
      explanation: '每个正方形4条边，3个正方形共有 4 × 3 = 12 条边。',
    },
    {
      content: `如果 A > B 且 B > C，那么以下哪个结论一定正确？`,
      options: ['A < C', 'A = C', 'A > C', '无法确定'],
      answer: 'C',
      explanation: '根据传递性，A > B 且 B > C，则 A > C。',
    },
    {
      content: `时钟显示3点15分，时针和分针形成的较小夹角是多少度？`,
      options: ['0度', '7.5度', '15度', '30度'],
      answer: 'B',
      explanation: '3点15分时，分针指向3，时针从3向4移动了1/4，即 30° × 1/4 = 7.5°。',
    },
    {
      content: `用0、1、2三个数字，可以组成多少个不同的三位数？（每个数字只能用一次）`,
      options: ['4个', '6个', '8个', '9个'],
      answer: 'A',
      explanation: '百位不能为0，所以百位有2种选择(1或2)，十位有2种，个位有1种，共 2×2×1=4 个。',
    },
    {
      content: `一个长方形的长是8厘米，宽是5厘米，它的周长是多少？`,
      options: ['13厘米', '26厘米', '40厘米', '50厘米'],
      answer: 'B',
      explanation: '长方形周长 = (长 + 宽) × 2 = (8 + 5) × 2 = 26 厘米。',
    },
    {
      content: `下列哪个数是质数？`,
      options: ['9', '15', '17', '21'],
      answer: 'C',
      explanation: '17只能被1和17整除，是质数；其他数都有除了1和自身以外的因数。',
    },
    {
      content: `甲、乙、丙三人中，一人说真话，两人说假话。甲说："乙在说谎。"乙说："丙在说谎。"丙说："甲和乙都在说谎。"请问谁在说真话？`,
      options: ['甲', '乙', '丙', '无法判断'],
      answer: 'B',
      explanation: '假设乙说真话，则丙说谎，甲说"乙在说谎"也是假话，符合一人说真话的条件。',
    },
    {
      content: `1到100之间（包含1和100），有多少个整数能被3整除？`,
      options: ['30个', '33个', '34个', '36个'],
      answer: 'B',
      explanation: '100 ÷ 3 = 33 余 1，所以有33个整数能被3整除（3, 6, 9, ..., 99）。',
    },
    {
      content: `一个水池有两个进水管，甲管单独注满需6小时，乙管单独注满需3小时。两管同时打开，几小时可以注满？`,
      options: ['1小时', '2小时', '3小时', '4小时'],
      answer: 'B',
      explanation: '甲每小时完成1/6，乙每小时完成1/3，合起来每小时完成 1/6 + 1/3 = 1/2，所以需要2小时。',
    },
    {
      content: `下列图形中，对称轴最多的是？`,
      options: ['等边三角形', '正方形', '长方形', '圆'],
      answer: 'D',
      explanation: '圆有无数条对称轴，正方形有4条，等边三角形有3条，长方形有2条。',
    },
  ];

  const q = questions[index % questions.length];
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'math',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: kp,
    score: 5,
    difficulty,
  };
}

export async function seedData() {
  const db = await getDb();

  // Fix old database schema: update course_type constraint to include new types
  // SAFETY: Use ALTER TABLE instead of DROP+RECREATE to avoid data loss
  try {
    // Check if questions table exists
    const sampleQ = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'");
    if (!sampleQ) {
      console.log('Questions table does not exist yet, will be created by initDb');
    } else {
      const hasNewTypes = sampleQ.sql && sampleQ.sql.includes("'scratch'") && sampleQ.sql.includes("'python'") && sampleQ.sql.includes("'cpp'") && sampleQ.sql.includes("'math'");
      const hasUsageCount = sampleQ.sql && sampleQ.sql.includes('usage_count');

      if (!hasNewTypes || !hasUsageCount) {
        console.log('Migrating questions table schema...');

        // SQLite supports ADD COLUMN, use it instead of recreating table
        if (!hasUsageCount) {
          try {
            await db.run('ALTER TABLE questions ADD COLUMN usage_count INTEGER DEFAULT 0');
            console.log('Added usage_count column');
          } catch (e: any) {
            if (!e.message.includes('duplicate column')) {
              console.error('Failed to add usage_count:', e.message);
            }
          }
          try {
            await db.run('ALTER TABLE questions ADD COLUMN correct_rate INTEGER DEFAULT 0');
            console.log('Added correct_rate column');
          } catch (e: any) {
            if (!e.message.includes('duplicate column')) {
              console.error('Failed to add correct_rate:', e.message);
            }
          }
        }

        // For CHECK constraint changes, we must recreate, but do it SAFELY with backup
        if (!hasNewTypes) {
          console.log('Recreating questions table for new course_type constraints (with backup)...');

          // Step 1: Verify source table has data before backup
          const sourceCount = await db.get('SELECT COUNT(*) as count FROM questions');
          console.log(`Source questions table has ${sourceCount.count} rows`);

          // Step 2: Backup existing data to a temp table first
          await db.run('DROP TABLE IF EXISTS questions_backup');
          await db.run('CREATE TABLE questions_backup AS SELECT * FROM questions');

          // Step 3: Verify backup succeeded
          const backupCount = await db.get('SELECT COUNT(*) as count FROM questions_backup');
          if (backupCount.count !== sourceCount.count) {
            throw new Error(`Backup verification failed: expected ${sourceCount.count} rows, got ${backupCount.count}`);
          }
          console.log(`Backup verified: ${backupCount.count} rows copied to questions_backup`);

          // Step 4: Create new table with updated course_type constraint
          await db.run('DROP TABLE IF EXISTS questions_new');
          await db.run(`
            CREATE TABLE questions_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              course_type TEXT NOT NULL CHECK(course_type IN ('aigc', 'scratch', 'python', 'cpp', 'math')),
              grade_range TEXT NOT NULL,
              question_type TEXT NOT NULL CHECK(question_type IN ('single', 'multiple', 'judge')),
              content TEXT NOT NULL,
              options TEXT NOT NULL,
              answer TEXT NOT NULL,
              explanation TEXT,
              knowledge_point TEXT,
              score INTEGER DEFAULT 1,
              difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
              status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
              ai_generated BOOLEAN DEFAULT 0,
              usage_count INTEGER DEFAULT 0,
              correct_rate INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Step 5: Migrate data from backup with course_type mapping
          const backupCols = await db.all("PRAGMA table_info(questions_backup)");
          const hasBackupUsageCount = backupCols.some((c: any) => c.name === 'usage_count');

          const migrateSql = `
            INSERT INTO questions_new (
              id, course_type, grade_range, question_type, content, options,
              answer, explanation, knowledge_point, score, difficulty, status,
              ai_generated, usage_count, correct_rate, created_at
            )
            SELECT
              id,
              CASE course_type
                WHEN 'programming' THEN 'python'
                WHEN 'logic' THEN 'cpp'
                ELSE course_type
              END,
              grade_range, question_type, content, options,
              answer, explanation, knowledge_point, score, difficulty, status,
              ai_generated, ${hasBackupUsageCount ? 'COALESCE(usage_count, 0)' : '0'}, ${hasBackupUsageCount ? 'COALESCE(correct_rate, 0)' : '0'}, created_at
            FROM questions_backup
          `;
          await db.run(migrateSql);

          // Step 6: Verify migration succeeded before dropping old table
          const newCount = await db.get('SELECT COUNT(*) as count FROM questions_new');
          if (newCount.count !== sourceCount.count) {
            throw new Error(`Migration verification failed: expected ${sourceCount.count} rows, got ${newCount.count}`);
          }
          console.log(`Migration verified: ${newCount.count} rows in questions_new`);

          // Step 7: Only now safe to drop old table
          await db.run('DROP TABLE questions');
          await db.run('ALTER TABLE questions_new RENAME TO questions');
          console.log('Migrated questions table schema successfully');

          // Step 8: Clean up backup (optional, keep for safety)
          // await db.run('DROP TABLE questions_backup');
          console.log('Backup table questions_backup retained for safety');
        }
      } else {
        console.log('Questions table schema is up to date');
      }
    }
  } catch (e: any) {
    console.error('Schema migration error:', e.message);
    // If migration fails, try to restore from backup if exists
    try {
      const backupExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='questions_backup'");
      if (backupExists) {
        console.log('Backup exists, migration partially failed but data is safe in questions_backup');
      }
    } catch {}
    // Don't re-throw - allow server to start even if migration has issues
  }

  const adminExists = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminExists) {
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, 'admin', '系统管理员']
    );
  }

  const teacherExists = await db.get('SELECT id FROM users WHERE username = ?', ['teacher1']);
  if (!teacherExists) {
    const hashedPassword = await bcryptjs.hash('teacher123', 10);
    const result = await db.run(
      'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
      ['teacher1', hashedPassword, 'teacher', '张老师']
    );
    await db.run('INSERT INTO teachers (user_id, subject) VALUES (?, ?)', [result.lastID, '编程']);
  }

  const questionCount = await db.get('SELECT COUNT(*) as count FROM questions');
  if (questionCount.count < 400) {
    console.log('[Seed] Questions count < 400, generating new questions via seed-all-questions.mjs...');
    try {
      const { execSync } = require('child_process');
      const scriptPath = require('path').join(__dirname, 'scripts', 'seed-all-questions.mjs');
      execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });
      console.log('[Seed] seed-all-questions.mjs completed');
    } catch (err: any) {
      console.error('[Seed] Failed to run seed-all-questions.mjs:', err.message);
    }
  }

  const configCount = await db.get('SELECT COUNT(*) as count FROM config');
  if (configCount.count === 0) {
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['level_a_min', '90']);
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['level_b_min', '80']);
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['level_c_min', '70']);
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['default_question_count', '15']);
    await db.run('INSERT INTO config (key, value) VALUES (?, ?)', ['default_time_limit', '60']);
  }

  const templateExists = await db.get('SELECT id FROM notice_templates WHERE name = ?', ['录取通知书']);
  if (!templateExists) {
    await db.run(
      `INSERT INTO notice_templates (name, type, content, variables, design_config) VALUES (?, ?, ?, ?, ?)`,
      [
        '录取通知书',
        'admission',
        '尊敬的{{studentName}}家长：\n\n恭喜您的孩子{{studentName}}通过我校的入学测评，获得{{courseType}}课程的学习资格！\n\n测评等级：{{level}}\n测评得分：{{score}}分\n\n我们诚挚邀请您的孩子加入我们的学习大家庭，开启精彩的科技学习之旅！\n\n请尽快联系我校完成报名手续。\n\n联系电话：400-XXX-XXXX\n学校地址：XXX市XXX区XXX路XXX号',
        JSON.stringify(['studentName', 'courseType', 'level', 'score']),
        JSON.stringify({ templateId: 'academic', schoolName: '未来科技学院', phone: '400-888-8888' }),
      ]
    );
  }

  const classExists = await db.get('SELECT id FROM classes WHERE name = ?', ['编程基础班']);
  if (!classExists) {
    const teacher = await db.get('SELECT id FROM teachers WHERE user_id = (SELECT id FROM users WHERE username = ?)', ['teacher1']);
    if (teacher) {
      await db.run('INSERT INTO classes (name, teacher_id, grade) VALUES (?, ?, ?)', ['编程基础班', teacher.id, 4]);
      await db.run('INSERT INTO classes (name, teacher_id, grade) VALUES (?, ?, ?)', ['AIGC创意班', teacher.id, 5]);
      await db.run('INSERT INTO classes (name, teacher_id, grade) VALUES (?, ?, ?)', ['数理逻辑班', teacher.id, 3]);
    }
  }

  const courseCount = await db.get('SELECT COUNT(*) as count FROM courses');
  if (courseCount.count === 0) {
    const courseData = [
      { type: 'scratch', ranges: ['1-3', '4-6', '7-9'], levels: ['入门班', '基础班', '进阶班', '培优班'] },
      { type: 'python', ranges: ['1-3', '4-6', '7-9'], levels: ['入门班', '基础班', '进阶班', '培优班'] },
      { type: 'cpp', ranges: ['1-3', '4-6', '7-9'], levels: ['入门班', '基础班', '进阶班', '培优班'] },
      { type: 'aigc', ranges: ['1-3', '4-6', '7-9'], levels: ['入门班', '基础班', '进阶班', '培优班'] },
    ];

    for (const cd of courseData) {
      for (const range of cd.ranges) {
        for (const level of cd.levels) {
          const courseName = `${cd.type.toUpperCase()}${level}`;
          const descriptionMap: Record<string, string> = {
            '入门班': `适合零基础学生，系统学习${cd.type.toUpperCase()}基础知识，培养学习兴趣。`,
            '基础班': `巩固${cd.type.toUpperCase()}核心概念，通过项目实践提升技能。`,
            '进阶班': `深入学习${cd.type.toUpperCase()}进阶内容，挑战更高难度的项目。`,
            '培优班': `${cd.type.toUpperCase()}竞赛方向，为信息学奥赛和相关竞赛做准备。`,
          };
          const objectivesMap: Record<string, string> = {
            '入门班': '掌握基础概念，完成简单项目',
            '基础班': '熟练运用核心知识，独立完成中等难度项目',
            '进阶班': '深入理解高级特性，具备复杂项目开发能力',
            '培优班': '达到竞赛水平，具备解决高难度问题的能力',
          };
          await db.run(
            `INSERT INTO courses (name, course_type, grade_range, description, course_objectives, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [courseName, cd.type, range, descriptionMap[level], objectivesMap[level], 'active']
          );
        }
      }
    }
    console.log(`[Seed] Inserted ${courseData.length * 3 * 4} courses`);
  }

  console.log('Seed data completed');
}
