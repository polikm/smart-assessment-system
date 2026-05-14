import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ 工具函数 ============
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// ============ 数理逻辑模板 (25个模板 × 3年级段 × 5道 = 375道) ============
const mathTemplates = [
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(10, 50 * g);
      const b = randInt(5, a - 1);
      const ans = a - b;
      const content = `${a} - ${b} = ?`;
      const options = shuffle([ans, ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 10)]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}减${b}等于${ans}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(2, 10 * g);
      const b = randInt(2, 10);
      const ans = a * b;
      const content = `${a} × ${b} = ?`;
      const options = shuffle([ans, ans + randInt(1, 5), ans - randInt(1, 5), ans + randInt(6, 10)]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}乘${b}等于${ans}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(10, 20 * g);
      const b = randInt(2, 9);
      const c = a * b;
      const content = `${c} ÷ ${b} = ?`;
      const options = shuffle([a, a + 1, a - 1, a + 2]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(a)), explanation: `${c}除以${b}等于${a}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '应用题',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const items = ['笔', '书', '橡皮', '尺子', '本子', '球'];
      const item = randChoice(items);
      const price = randInt(2, 10 * g);
      const qty = randInt(2, 10);
      const total = price * qty;
      const names = ['小明', '小红', '小刚', '小丽', '小华', '小芳'];
      const name = randChoice(names);
      const content = `${name}买了${qty}个${item}，每个${price}元，一共花了多少钱？`;
      const ans = total;
      const options = shuffle([ans, ans + randInt(1, 5), ans - randInt(1, 5), ans + 10]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${qty}×${price}=${total}元`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '应用题',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const total = randInt(20, 100 * g);
      const used = randInt(5, total - 10);
      const remain = total - used;
      const names = ['小红', '小明', '小刚', '小丽', '小华', '小芳'];
      const name = randChoice(names);
      const content = `一本书有${total}页，${name}已经看了${used}页，还剩多少页没看？`;
      const options = shuffle([remain, remain + 5, remain - 5, used]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(remain)), explanation: `${total}-${used}=${remain}页`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '几何图形',
    build: (gradeRange) => {
      const shapes = ['正方形', '长方形', '三角形', '圆形'];
      const shape = randChoice(shapes);
      const content = `下列哪个图形是${shape}？（请根据描述选择）一个四边相等、四个角都是直角的图形。`;
      const options = shuffle([shape, randChoice(shapes.filter(s => s !== shape)), randChoice(shapes.filter(s => s !== shape)), randChoice(shapes.filter(s => s !== shape))]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(shape)), explanation: `${shape}的特征是四边相等且四角为直角`, difficulty: 2 };
    }
  },
  {
    kp: '几何图形',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const side = randInt(2, 10 * g);
      const ans = side * 4;
      const content = `一个正方形的边长是${side}厘米，它的周长是多少厘米？`;
      const options = shuffle([ans, side * side, side * 2, side + 4]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `正方形周长=边长×4=${side}×4=${ans}厘米`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '逻辑推理',
    build: (gradeRange) => {
      const names = ['小明', '小红', '小刚', '小丽', '小华', '小芳'];
      const fruits = ['苹果', '香蕉', '橙子', '葡萄', '草莓', '西瓜'];
      const name = randChoice(names);
      const fruit = randChoice(fruits);
      const content = `${name}说："我喜欢吃${fruit}，但我不喜欢吃${randChoice(fruits.filter(f => f !== fruit))}。"请问${name}喜欢吃什么水果？`;
      const options = shuffle([fruit, randChoice(fruits.filter(f => f !== fruit)), randChoice(fruits.filter(f => f !== fruit)), randChoice(fruits.filter(f => f !== fruit))]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(fruit)), explanation: `${name}明确说了喜欢吃${fruit}`, difficulty: 2 };
    }
  },
  {
    kp: '逻辑推理',
    build: (gradeRange) => {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = a + b;
      const content = `如果 □ + △ = ${c}，且 □ = ${a}，那么 △ = ?`;
      const ans = b;
      const options = shuffle([ans, ans + 1, ans - 1, a]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `△ = ${c} - ${a} = ${b}`, difficulty: 3 };
    }
  },
  {
    kp: '分数与小数',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const num = randInt(1, 5 * g);
      const den = randInt(num + 1, 5 * g + 1);
      const content = `分数 ${num}/${den} 是真分数还是假分数？`;
      const options = ['真分数', '假分数', '带分数', '整数'];
      return { content, options, answer: 'A', explanation: `分子${num}小于分母${den}，所以是真分数`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '分数与小数',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(1, 5 * g);
      const b = randInt(1, 5 * g);
      const c = randInt(1, 5 * g);
      const d = randInt(1, 5 * g);
      const content = `比较大小：${a}/${b} 和 ${c}/${d}，哪个更大？`;
      const v1 = a / b;
      const v2 = c / d;
      const ans = v1 > v2 ? `${a}/${b}` : `${c}/${d}`;
      const options = shuffle([`${a}/${b}`, `${c}/${d}`, '一样大', '无法比较']);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}/${b}=${v1.toFixed(2)}, ${c}/${d}=${v2.toFixed(2)}，所以${ans}更大`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '单位换算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const meters = randInt(1, 10 * g);
      const ans = meters * 100;
      const content = `${meters}米 = ?厘米`;
      const options = shuffle([ans, meters * 10, meters * 1000, meters]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `1米=100厘米，${meters}米=${ans}厘米`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '单位换算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const kg = randInt(1, 10 * g);
      const ans = kg * 1000;
      const content = `${kg}千克 = ?克`;
      const options = shuffle([ans, kg * 100, kg * 10, kg]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `1千克=1000克，${kg}千克=${ans}克`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '方程与代数',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const x = randInt(2, 10 * g);
      const a = randInt(2, 10);
      const b = a * x + randInt(1, 20);
      const content = `解方程：${a}x + ${b - a * x} = ${b}`;
      const options = shuffle([x, x + 1, x - 1, a]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(x)), explanation: `${a}x = ${b} - ${b - a * x} = ${a * x}，所以x=${x}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '方程与代数',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(2, 5 * g);
      const b = randInt(2, 5 * g);
      const c = randInt(2, 5 * g);
      const content = `计算：${a}x + ${b}x = ?x`;
      const ans = a + b;
      const options = shuffle([ans, a * b, a + b + c, a - b]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}x + ${b}x = ${ans}x`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数据分析',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const nums = Array.from({ length: 5 }, () => randInt(1, 10 * g));
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / nums.length);
      const content = `数据：${nums.join(', ')}，这组数据的平均数是多少？`;
      const options = shuffle([avg, avg + 1, avg - 1, sum]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(avg)), explanation: `(${nums.join('+')})÷${nums.length}=${sum}÷${nums.length}=${avg}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数据分析',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const nums = Array.from({ length: 5 }, () => randInt(1, 10 * g)).sort((a, b) => a - b);
      const median = nums[2];
      const content = `数据：${nums.join(', ')}，这组数据的中位数是多少？`;
      const options = shuffle([median, nums[0], nums[4], nums[1]]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(median)), explanation: `排序后第3个数是${median}，即中位数`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '概率与统计',
    build: (gradeRange) => {
      const colors = ['红球', '蓝球', '黄球', '绿球', '白球', '黑球'];
      const color = randChoice(colors);
      const total = randInt(10, 30);
      const count = randInt(1, total - 1);
      const content = `袋子里有${total}个球，其中${color}有${count}个，随机摸出一个球，摸到${color}的概率是多少？`;
      const options = shuffle([`${count}/${total}`, `${count}/${count + 1}`, `${total - count}/${total}`, `1/${total}`]);
      return { content, options, answer: 'A', explanation: `概率=${count}/${total}`, difficulty: 3 };
    }
  },
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(10, 50 * g);
      const b = randInt(10, 50 * g);
      const ans = a + b;
      const content = `${a} + ${b} = ?`;
      const options = shuffle([ans, ans + 10, ans - 10, ans + 1]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}+${b}=${ans}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(10, 100 * g);
      const b = randInt(1, a - 1);
      const c = randInt(1, a - b);
      const ans = a - b - c;
      const content = `${a} - ${b} - ${c} = ?`;
      const options = shuffle([ans, ans + 5, ans - 5, a - b + c]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}-${b}-${c}=${ans}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '几何图形',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const length = randInt(3, 10 * g);
      const width = randInt(2, length - 1);
      const ans = length * width;
      const content = `一个长方形的长是${length}厘米，宽是${width}厘米，它的面积是多少平方厘米？`;
      const options = shuffle([ans, (length + width) * 2, length + width, length * width * 2]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `长方形面积=长×宽=${length}×${width}=${ans}`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '应用题',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const speed = randInt(30, 60 * g);
      const time = randInt(1, 5);
      const distance = speed * time;
      const vehicles = ['汽车', '火车', '自行车', '轮船', '飞机'];
      const vehicle = randChoice(vehicles);
      const content = `一辆${vehicle}每小时行驶${speed}千米，行驶了${time}小时，一共行驶了多少千米？`;
      const options = shuffle([distance, speed + time, speed / time, distance + 10]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(distance)), explanation: `路程=速度×时间=${speed}×${time}=${distance}千米`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '逻辑推理',
    build: (gradeRange) => {
      const items = ['A', 'B', 'C'];
      const weights = [randInt(1, 10), randInt(1, 10), randInt(1, 10)];
      const total = weights.reduce((a, b) => a + b, 0);
      const content = `三个物体重量分别是${weights[0]}克、${weights[1]}克、${weights[2]}克，最重的物体是哪个？`;
      const maxIdx = weights.indexOf(Math.max(...weights));
      const options = shuffle([items[maxIdx], items[(maxIdx + 1) % 3], items[(maxIdx + 2) % 3], '一样重']);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(items[maxIdx])), explanation: `${weights[maxIdx]}克是最重的`, difficulty: 2 };
    }
  },
  {
    kp: '单位换算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const hours = randInt(1, 12 * g);
      const ans = hours * 60;
      const content = `${hours}小时 = ?分钟`;
      const options = shuffle([ans, hours * 60 * 60, hours * 100, hours + 60]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `1小时=60分钟，${hours}小时=${ans}分钟`, difficulty: Math.min(g, 5) };
    }
  },
  {
    kp: '数与运算',
    build: (gradeRange) => {
      const g = gradeRange === '1-3' ? randInt(1, 3) : gradeRange === '4-6' ? randInt(4, 6) : randInt(7, 9);
      const a = randInt(2, 10);
      const b = randInt(2, 10);
      const c = randInt(2, 10);
      const ans = a + b * c;
      const content = `计算：${a} + ${b} × ${c} = ?`;
      const options = shuffle([ans, (a + b) * c, a + b + c, a * b * c]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `先算乘法：${b}×${c}=${b * c}，再算加法：${a}+${b * c}=${ans}`, difficulty: Math.min(g, 5) };
    }
  }
];

// ============ AIGC模板 (30个参数化模板 × 3年级段 × 4道 = 360道) ============
const aigcTemplates = [
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const concepts = ['机器学习', '深度学习', '神经网络', '自然语言处理', '计算机视觉', '强化学习', '生成式AI', '大语言模型'];
      const concept = randChoice(concepts);
      const explanations = {
        '机器学习': '让计算机从数据中学习规律的技术',
        '深度学习': '基于多层神经网络的机器学习方法',
        '神经网络': '模拟人脑神经元连接的计算模型',
        '自然语言处理': '让计算机理解和生成人类语言的技术',
        '计算机视觉': '让计算机能够"看懂"图像和视频的技术',
        '强化学习': '通过试错和奖励来学习最优策略的方法',
        '生成式AI': '能够创造新内容（如文本、图像）的AI',
        '大语言模型': '基于海量文本训练的超大规模语言模型'
      };
      const distractors = [
        '一种编程语言', '一种操作系统', '一种数据库', '一种办公软件',
        '一种游戏引擎', '一种浏览器', '一种编程框架', '一种文件格式'
      ];
      const content = `以下哪个选项最能描述"${concept}"？`;
      const options = shuffle([explanations[concept], ...distractors.slice(0, 3)]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(explanations[concept])), explanation: explanations[concept], difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const models = ['ChatGPT', '文心一言', '通义千问', '讯飞星火', '智谱清言', 'Kimi', 'Claude', 'Gemini'];
      const model = randChoice(models);
      const content = `${model}属于哪一类AI应用？`;
      const correct = '大语言模型';
      const distractors = ['图像识别', '语音识别', '自动驾驶', '推荐系统', '游戏AI', '机器人控制'];
      const options = shuffle([correct, ...distractors.slice(0, 3)]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(correct)), explanation: `${model}是基于大语言模型的对话AI`, difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const terms = ['训练数据', '测试数据', '验证数据', '标注数据', '合成数据'];
      const term = randChoice(terms);
      const explanations = {
        '训练数据': '用于训练模型学习规律的数据集',
        '测试数据': '用于评估模型性能的数据集',
        '验证数据': '用于调整模型参数的数据集',
        '标注数据': '带有标签或答案的数据',
        '合成数据': '由AI或程序人工生成的数据'
      };
      const content = `AI中的"${term}"指的是什么？`;
      const options = shuffle([explanations[term], 'AI的硬件设备', 'AI的输出结果', 'AI的源代码']);
      return { content, options, answer: 'A', explanation: explanations[term], difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI应用场景',
    build: (gradeRange) => {
      const scenes = [
        { scene: '人脸识别解锁手机', tech: '计算机视觉' },
        { scene: '语音助手回答问题', tech: '自然语言处理' },
        { scene: '推荐系统推荐视频', tech: '机器学习' },
        { scene: '自动驾驶汽车', tech: '计算机视觉+深度学习' },
        { scene: 'AI绘画生成图像', tech: '生成式AI' },
        { scene: '智能翻译文档', tech: '自然语言处理' },
        { scene: '医学影像诊断', tech: '计算机视觉' },
        { scene: '智能音箱播放音乐', tech: '语音识别' }
      ];
      const item = randChoice(scenes);
      const content = `"${item.scene}"主要使用了哪种AI技术？`;
      const distractors = ['数据库查询', '简单计算', '随机选择', '规则匹配'];
      const options = shuffle([item.tech, ...distractors]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(item.tech)), explanation: item.tech, difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI应用场景',
    build: (gradeRange) => {
      const nonAI = ['用计算器做加减法', '用Word打字', '用Excel做表格', '用浏览器查资料', '用播放器看视频', '用画图工具涂鸦'];
      const ai = ['人脸识别', '语音翻译', '智能推荐', 'AI写作', '图像生成', '自动驾驶'];
      const non = randChoice(nonAI);
      const content = `以下哪个不是AI的典型应用场景？`;
      const options = shuffle([non, randChoice(ai), randChoice(ai), randChoice(ai)]);
      return { content, options, answer: 'A', explanation: `${non}是传统软件功能，不涉及AI`, difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI伦理与安全',
    build: (gradeRange) => {
      const behaviors = [
        { good: '不泄露个人隐私数据', bad: '用AI生成虚假信息' },
        { good: '尊重他人的知识产权', bad: '用AI抄袭他人作品' },
        { good: '批判性地看待AI输出', bad: '让AI代替自己做所有决定' },
        { good: '核实AI提供的事实', bad: '传播AI生成的谣言' }
      ];
      const item = randChoice(behaviors);
      const content = `使用AI时，以下哪种行为是正确的？`;
      const options = shuffle([item.good, item.bad, '用AI攻击他人网站', '把账号密码给AI']);
      return { content, options, answer: 'A', explanation: item.good + '是AI伦理的基本要求', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI伦理与安全',
    build: (gradeRange) => {
      const issues = ['可能包含错误信息', '可能产生偏见', '可能侵犯隐私', '可能被恶意使用'];
      const issue = randChoice(issues);
      const content = `AI生成的内容可能存在什么问题？`;
      const options = shuffle([issue, '总是完全正确', '比人类创作更好', '不需要审核']);
      return { content, options, answer: 'A', explanation: `AI可能产生"幻觉"，生成不准确或${issue}的内容`, difficulty: randInt(2, 4) };
    }
  },
  {
    kp: '提示词工程',
    build: (gradeRange) => {
      const goodTips = ['描述清楚具体的需求', '提供足够的背景信息', '给出具体的示例', '分步骤说明任务'];
      const badTips = ['只写一个字', '写很长的无关内容', '用模糊的语言', '要求AI猜你的意图'];
      const good = randChoice(goodTips);
      const content = `向AI提问时，以下哪种方式更容易得到好答案？`;
      const options = shuffle([good, randChoice(badTips), randChoice(badTips), randChoice(badTips)]);
      return { content, options, answer: 'A', explanation: '清晰的提示词能帮助AI更好地理解需求', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: '提示词工程',
    build: (gradeRange) => {
      const content = `"提示词工程"是指什么？`;
      const options = shuffle(['设计和优化AI输入指令的技术', '修理电脑的技术', '编写代码的技术', '制作PPT的技术']);
      return { content, options, answer: 'A', explanation: '提示词工程是通过优化输入来获得更好AI输出的技术', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI工具使用',
    build: (gradeRange) => {
      const tools = ['文心一言', '通义千问', '讯飞星火', '智谱清言', 'Kimi', '豆包', '百小应', '海螺AI'];
      const tool = randChoice(tools);
      const content = `"${tool}"是什么类型的工具？`;
      const options = shuffle(['AI对话助手', '视频剪辑软件', '图片编辑工具', '游戏平台']);
      return { content, options, answer: 'A', explanation: `${tool}是国内开发的AI大语言模型对话工具`, difficulty: 1 };
    }
  },
  {
    kp: 'AI工具使用',
    build: (gradeRange) => {
      const factors = ['提示词描述', '参考图像', '风格参数', '分辨率设置'];
      const factor = randChoice(factors);
      const content = `使用AI绘画工具时，以下哪个因素最影响生成结果？`;
      const options = shuffle([factor, '电脑颜色', '鼠标品牌', '键盘大小']);
      return { content, options, answer: 'A', explanation: `${factor}直接决定了AI生成图像的内容和风格`, difficulty: 1 };
    }
  },
  {
    kp: 'AI与创造力',
    build: (gradeRange) => {
      const works = ['写作', '绘画', '音乐创作', '视频制作', '游戏设计', '建筑设计'];
      const work1 = randChoice(works);
      const work2 = randChoice(works.filter(w => w !== work1));
      const content = `AI可以辅助人类进行哪些创造性工作？`;
      const options = shuffle([`${work1}、${work2}`, '吃饭、睡觉', '购物、旅游', '考试、比赛']);
      return { content, options, answer: 'A', explanation: `AI可以辅助${work1}、${work2}等多种创造性工作`, difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI与创造力',
    build: (gradeRange) => {
      const content = `以下关于AI和创造力的说法，哪个是正确的？`;
      const options = shuffle(['AI可以辅助创作，但人类创意不可替代', 'AI已经完全超越人类创造力', 'AI不能参与任何创造性工作', '创造力与AI无关']);
      return { content, options, answer: 'A', explanation: 'AI是辅助工具，人类的创意和审美仍然不可替代', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const terms = ['算法', '模型', '参数', '特征', '损失函数', '优化器'];
      const term = randChoice(terms);
      const explanations = {
        '算法': '解决问题的步骤和方法',
        '模型': '从数据中学习到的规律表示',
        '参数': '模型学习到的可调节数值',
        '特征': '用于描述数据的属性或特点',
        '损失函数': '衡量模型预测与真实值差距的函数',
        '优化器': '用于调整参数以减小损失的算法'
      };
      const content = `"${term}"在AI中指的是什么？`;
      const options = shuffle([explanations[term], '一种编程语言', '电脑的硬件', '网络的名称']);
      return { content, options, answer: 'A', explanation: explanations[term], difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const content = `AI模型中的"参数"是什么？`;
      const options = shuffle(['模型学习到的数值', '电脑的硬件配置', '软件的安装包', '网络的IP地址']);
      return { content, options, answer: 'A', explanation: '参数是AI模型通过学习数据得到的数值，用于做预测', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI应用场景',
    build: (gradeRange) => {
      const apps = ['手机拍照美颜', '智能客服', '垃圾邮件过滤', '股票预测', '天气预测', '导航路线规划'];
      const app = randChoice(apps);
      const content = `以下哪个应用使用了AI技术？`;
      const options = shuffle([app, '普通计算器', '纸质书本', '铅笔写字']);
      return { content, options, answer: 'A', explanation: `${app}使用AI进行数据分析和决策`, difficulty: 1 };
    }
  },
  {
    kp: 'AI伦理与安全',
    build: (gradeRange) => {
      const content = `为什么AI需要"公平性"？`;
      const options = shuffle(['避免对某些群体产生偏见', '让AI运行更快', '减少电费', '增加存储空间']);
      return { content, options, answer: 'A', explanation: 'AI公平性确保不同群体得到公正对待，避免歧视', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: '提示词工程',
    build: (gradeRange) => {
      const goodPrompts = [
        '请用简单的语言解释什么是AI',
        '请列举3个AI在医疗领域的应用',
        '请比较机器学习和深度学习的区别',
        '请给出一个适合小学生的AI定义'
      ];
      const badPrompts = ['AI', '帮我', '问题', '解释一下'];
      const good = randChoice(goodPrompts);
      const content = `以下哪个提示词更可能得到有用的回答？`;
      const options = shuffle([good, randChoice(badPrompts), randChoice(badPrompts), randChoice(badPrompts)]);
      return { content, options, answer: 'A', explanation: '具体、清晰的提示词能帮助AI给出更有用的回答', difficulty: 1 };
    }
  },
  {
    kp: 'AI工具使用',
    build: (gradeRange) => {
      const content = `使用AI工具时，以下哪个做法是正确的？`;
      const options = shuffle(['验证AI输出的准确性', '完全相信AI的所有回答', '用AI做违法的事情', '把密码告诉AI']);
      return { content, options, answer: 'A', explanation: 'AI输出需要人工验证，不能盲目相信', difficulty: 1 };
    }
  },
  {
    kp: 'AI与创造力',
    build: (gradeRange) => {
      const content = `AI创作的内容版权归谁？`;
      const options = shuffle(['涉及复杂的法律问题，需要具体分析', '完全归AI所有', '归电脑制造商所有', '没有版权']);
      return { content, options, answer: 'A', explanation: 'AI创作内容的版权归属是复杂的法律问题，各国规定不同', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const content = `以下哪个是AI发展的三大要素之一？`;
      const options = shuffle(['数据', '键盘', '鼠标', '显示器']);
      return { content, options, answer: 'A', explanation: '数据、算法和算力是AI发展的三大核心要素', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI应用场景',
    build: (gradeRange) => {
      const content = `以下哪个任务最适合用AI来完成？`;
      const options = shuffle(['从1000张照片中找出猫的图片', '1+1等于几', '抄写一段文字', '按字母顺序排列单词']);
      return { content, options, answer: 'A', explanation: '图像识别是AI的强项，可以快速从大量图片中识别特定内容', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI伦理与安全',
    build: (gradeRange) => {
      const content = `当AI给出的答案与你所知的不同时，你应该怎么做？`;
      const options = shuffle(['查证并思考哪个更可靠', '完全相信AI', '完全相信自己', '随机选择一个']);
      return { content, options, answer: 'A', explanation: '应该批判性地思考，查证信息来源，不盲目相信任何一方', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: '提示词工程',
    build: (gradeRange) => {
      const content = `为了让AI更好地理解你的需求，以下哪种做法最好？`;
      const options = shuffle(['给出具体例子', '只说关键词', '用反问句', '用网络流行语']);
      return { content, options, answer: 'A', explanation: '具体例子能帮助AI理解你期望的输出格式和内容', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI工具使用',
    build: (gradeRange) => {
      const content = `使用AI翻译工具时，以下哪种做法最合理？`;
      const options = shuffle(['翻译后检查关键术语', '直接复制不做检查', '只翻译一半', '用翻译结果做重要决定']);
      return { content, options, answer: 'A', explanation: 'AI翻译可能存在错误，重要内容需要人工核对', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const content = `"监督学习"和"无监督学习"的主要区别是？`;
      const options = shuffle(['是否有标注数据', '是否有计算机', '是否需要网络', '是否需要电力']);
      return { content, options, answer: 'A', explanation: '监督学习使用带标签的数据，无监督学习使用不带标签的数据', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI应用场景',
    build: (gradeRange) => {
      const content = `以下哪个是生成式AI的特点？`;
      const options = shuffle(['可以创造新的内容', '只能识别已有内容', '只能做数学计算', '只能存储数据']);
      return { content, options, answer: 'A', explanation: '生成式AI能够创造文本、图像、音频等新内容', difficulty: randInt(2, 4) };
    }
  },
  {
    kp: 'AI伦理与安全',
    build: (gradeRange) => {
      const content = `在网上分享AI生成的内容时，应该怎么做？`;
      const options = shuffle(['注明是AI生成的', '说是自己原创的', '不加任何说明', '说是别人写的']);
      return { content, options, answer: 'A', explanation: '诚实标注AI生成内容是负责任的做法', difficulty: 1 };
    }
  },
  {
    kp: 'AI工具使用',
    build: (gradeRange) => {
      const content = `使用AI学习时，以下哪种方式最有效？`;
      const options = shuffle(['让AI解释不懂的概念并举例', '让AI代替自己做作业', '直接复制AI答案', '只问不思考']);
      return { content, options, answer: 'A', explanation: 'AI作为学习辅助工具，帮助理解概念才是正确使用方式', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI基础概念',
    build: (gradeRange) => {
      const content = `以下哪个说法是正确的？`;
      const options = shuffle(['AI需要大量数据来训练', 'AI不需要任何数据', 'AI只需要一张照片', 'AI只需要一句话']);
      return { content, options, answer: 'A', explanation: '大多数AI模型需要大量数据来学习和提高性能', difficulty: randInt(1, 3) };
    }
  },
  {
    kp: 'AI与创造力',
    build: (gradeRange) => {
      const content = `AI在创作过程中最适合扮演的角色是？`;
      const options = shuffle(['辅助工具', '完全替代人类', '不需要人类', '随机生成器']);
      return { content, options, answer: 'A', explanation: 'AI最适合作为辅助工具，帮助人类提高创作效率', difficulty: randInt(1, 3) };
    }
  }
];

// ============ Scratch模板 (30个参数化模板 × 3年级段 × 4道 = 360道) ============
const scratchTemplates = [
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const categories = ['运动', '外观', '声音', '事件', '控制', '侦测', '运算', '变量'];
      const category = randChoice(categories);
      const actions = {
        '运动': '移动、旋转',
        '外观': '改变造型、说台词',
        '声音': '播放声音',
        '事件': '绿旗点击、按键触发',
        '控制': '循环、等待',
        '侦测': '碰到鼠标、询问',
        '运算': '加减乘除、比较',
        '变量': '存储数据'
      };
      const content = `Scratch中，${actions[category]}的积木在哪个分类里？`;
      const options = shuffle([category, randChoice(categories.filter(c => c !== category)), randChoice(categories.filter(c => c !== category)), randChoice(categories.filter(c => c !== category))]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(category)), explanation: `${actions[category]}等动作在${category}分类中`, difficulty: 1 };
    }
  },
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const coords = [
        { coord: '(0,0)', pos: '舞台中心' },
        { coord: '(240,180)', pos: '右上角' },
        { coord: '(-240,-180)', pos: '左下角' },
        { coord: '(0,180)', pos: '舞台顶部中央' }
      ];
      const item = randChoice(coords);
      const content = `Scratch的舞台上，坐标${item.coord}表示什么位置？`;
      const options = shuffle([item.pos, '舞台中心', '左上角', '右下角']);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(item.pos)), explanation: `坐标${item.coord}对应${item.pos}`, difficulty: 1 };
    }
  },
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const events = ['绿旗被点击', '按下空格键', '角色被点击', '接收到消息'];
      const event = randChoice(events);
      const content = `在Scratch中，"当${event}"积木属于哪个分类？`;
      const options = shuffle(['事件', '控制', '运动', '外观']);
      return { content, options, answer: 'A', explanation: `${event}是事件的触发条件`, difficulty: 1 };
    }
  },
  {
    kp: '角色与造型',
    build: (gradeRange) => {
      const nums = randInt(2, 10);
      const content = `Scratch中，一个角色可以有几个造型？`;
      const options = shuffle([`${nums}个或多个`, '只能1个', '只能2个', '不能切换']);
      return { content, options, answer: 'A', explanation: '一个角色可以有多个造型，用于实现动画效果', difficulty: 1 };
    }
  },
  {
    kp: '角色与造型',
    build: (gradeRange) => {
      const actions = ['下一个造型', '将大小增加10', '说你好2秒', '播放声音'];
      const action = randChoice(actions);
      const categories = {
        '下一个造型': '外观',
        '将大小增加10': '外观',
        '说你好2秒': '外观',
        '播放声音': '声音'
      };
      const content = `Scratch中，"${action}"积木在哪个分类里？`;
      const options = shuffle([categories[action], '运动', '事件', '控制']);
      return { content, options, answer: 'A', explanation: `"${action}"积木在${categories[action]}分类中`, difficulty: 1 };
    }
  },
  {
    kp: '事件与广播',
    build: (gradeRange) => {
      const msgs = ['开始游戏', '切换关卡', '得分', '游戏结束', '播放音乐', '停止所有'];
      const msg = randChoice(msgs);
      const content = `Scratch中，"广播${msg}"的作用是？`;
      const options = shuffle(['让不同角色之间通信', '播放音乐', '移动角色', '改变背景']);
      return { content, options, answer: 'A', explanation: '广播消息可以让不同角色之间传递信息、协调动作', difficulty: 2 };
    }
  },
  {
    kp: '事件与广播',
    build: (gradeRange) => {
      const msgs = ['消息1', '开始', '结束', '下一关'];
      const msg = randChoice(msgs);
      const content = `当收到广播"${msg}"时，应该使用哪个积木？`;
      const options = shuffle([`当接收到${msg}`, '当绿旗被点击', '重复执行', '等待1秒']);
      return { content, options, answer: 'A', explanation: '"当接收到..."积木用于响应广播消息', difficulty: 2 };
    }
  },
  {
    kp: '循环与条件',
    build: (gradeRange) => {
      const loops = ['重复执行10次', '重复执行直到', '重复执行', '等待1秒'];
      const loop = randChoice(loops);
      const types = {
        '重复执行10次': '循环',
        '重复执行直到': '循环',
        '重复执行': '循环',
        '等待1秒': '控制'
      };
      const content = `Scratch中，"${loop}"属于什么结构？`;
      const options = shuffle([types[loop], '条件', '事件', '变量']);
      return { content, options, answer: 'A', explanation: '"${loop}"是${types[loop]}结构', difficulty: 2 };
    }
  },
  {
    kp: '循环与条件',
    build: (gradeRange) => {
      const content = `Scratch中，"如果...那么...否则"属于什么结构？`;
      const options = shuffle(['条件判断', '循环', '事件', '变量']);
      return { content, options, answer: 'A', explanation: '如果...那么...否则是条件判断结构', difficulty: 2 };
    }
  },
  {
    kp: '变量与列表',
    build: (gradeRange) => {
      const vars = ['得分', '生命值', '速度', '等级', '时间'];
      const varName = randChoice(vars);
      const content = `Scratch中，变量"${varName}"可以用来做什么？`;
      const options = shuffle(['存储和改变数据', '播放声音', '移动角色', '绘制图形']);
      return { content, options, answer: 'A', explanation: '变量用于存储可以在程序运行中改变的数据', difficulty: 2 };
    }
  },
  {
    kp: '变量与列表',
    build: (gradeRange) => {
      const content = `Scratch中，列表和变量的区别是什么？`;
      const options = shuffle(['列表可以存储多个数据，变量只能存一个', '没有区别', '变量更大', '列表不能修改']);
      return { content, options, answer: 'A', explanation: '列表是一组数据的集合，变量只能存储单个值', difficulty: 3 };
    }
  },
  {
    kp: '克隆体',
    build: (gradeRange) => {
      const nums = randInt(2, 20);
      const content = `Scratch中，"克隆"功能的作用是？`;
      const options = shuffle([`创建角色的副本`, '删除角色', '改变角色大小', '旋转角色']);
      return { content, options, answer: 'A', explanation: '克隆可以创建角色的多个副本，用于制作弹幕等效果', difficulty: 3 };
    }
  },
  {
    kp: '克隆体',
    build: (gradeRange) => {
      const content = `当作为克隆体启动时，应该使用哪个积木？`;
      const options = shuffle(['当作为克隆体启动时', '当绿旗被点击', '重复执行', '等待']);
      return { content, options, answer: 'A', explanation: '"当作为克隆体启动时"专门用于克隆体的初始化', difficulty: 3 };
    }
  },
  {
    kp: '画笔与绘图',
    build: (gradeRange) => {
      const colors = ['红色', '蓝色', '绿色', '黄色', '紫色', '黑色'];
      const color = randChoice(colors);
      const content = `Scratch中，要让角色画${color}的线条，需要使用哪个扩展？`;
      const options = shuffle(['画笔', '音乐', '视频侦测', '文字朗读']);
      return { content, options, answer: 'A', explanation: '画笔扩展提供了落笔、抬笔、设置颜色等绘图功能', difficulty: 2 };
    }
  },
  {
    kp: '画笔与绘图',
    build: (gradeRange) => {
      const content = `Scratch中，"落笔"积木的作用是什么？`;
      const options = shuffle(['让角色移动时画出轨迹', '放下角色', '播放声音', '停止程序']);
      return { content, options, answer: 'A', explanation: '落笔后，角色移动会在舞台上留下轨迹', difficulty: 2 };
    }
  },
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const content = `Scratch程序的执行顺序是？`;
      const options = shuffle(['从上到下依次执行', '从下到上', '随机执行', '同时执行']);
      return { content, options, answer: 'A', explanation: 'Scratch积木按从上到下的顺序依次执行', difficulty: 1 };
    }
  },
  {
    kp: '角色与造型',
    build: (gradeRange) => {
      const sizes = [50, 100, 150, 200];
      const size = randChoice(sizes);
      const content = `Scratch中，如何将角色大小设为${size}%？`;
      const options = shuffle([`将大小设为${size}`, '移动10步', '下一个造型', '说你好']);
      return { content, options, answer: 'A', explanation: '"将大小设为..."积木可以改变角色的显示大小', difficulty: 1 };
    }
  },
  {
    kp: '事件与广播',
    build: (gradeRange) => {
      const keys = ['空格键', '上箭头', '下箭头', '左箭头', '右箭头', 'a键'];
      const key = randChoice(keys);
      const content = `Scratch中，"当按下${key}"属于什么类型的事件？`;
      const options = shuffle(['键盘事件', '鼠标事件', '消息事件', '定时事件']);
      return { content, options, answer: 'A', explanation: '按下键盘按键属于键盘事件', difficulty: 1 };
    }
  },
  {
    kp: '循环与条件',
    build: (gradeRange) => {
      const content = `Scratch中，"重复执行直到..."和"重复执行10次"的区别是？`;
      const options = shuffle(['前者按条件结束，后者按次数结束', '没有区别', '前者更快', '后者更复杂']);
      return { content, options, answer: 'A', explanation: '重复执行直到在满足条件时停止，重复执行10次执行固定次数', difficulty: 3 };
    }
  },
  {
    kp: '变量与列表',
    build: (gradeRange) => {
      const nums = randInt(1, 10);
      const content = `Scratch中，如何将变量增加${nums}？`;
      const options = shuffle([`将变量增加${nums}`, '设置变量为...', '删除变量', '隐藏变量']);
      return { content, options, answer: 'A', explanation: '"将变量增加..."积木可以在变量当前值基础上增加', difficulty: 2 };
    }
  },
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const nums = randInt(10, 100);
      const content = `Scratch中，"移动${nums}步"积木会让角色怎样移动？`;
      const options = shuffle([`向当前方向移动${nums}步`, '旋转${nums}度', '改变大小${nums}', '等待${nums}秒']);
      return { content, options, answer: 'A', explanation: '移动步数积木让角色沿当前朝向移动指定步数', difficulty: 1 };
    }
  },
  {
    kp: '角色与造型',
    build: (gradeRange) => {
      const directions = [90, 180, -90, 0];
      const dir = randChoice(directions);
      const dirNames = { 90: '右', 180: '下', '-90': '左', 0: '上' };
      const content = `Scratch中，面向${dir}度表示角色朝向哪个方向？`;
      const options = shuffle([dirNames[dir], '随机方向', '舞台中心', '鼠标指针']);
      return { content, options, answer: 'A', explanation: `面向${dir}度表示朝向${dirNames[dir]}`, difficulty: 2 };
    }
  },
  {
    kp: '控制结构',
    build: (gradeRange) => {
      const secs = randInt(1, 5);
      const content = `Scratch中，"等待${secs}秒"积木的作用是什么？`;
      const options = shuffle([`暂停程序${secs}秒`, '重复执行${secs}次', '移动${secs}步', '旋转${secs}度']);
      return { content, options, answer: 'A', explanation: '等待积木让程序暂停指定的秒数', difficulty: 1 };
    }
  },
  {
    kp: '运算与逻辑',
    build: (gradeRange) => {
      const a = randInt(1, 20);
      const b = randInt(1, 20);
      const ops = ['+', '-', '×'];
      const op = randChoice(ops);
      let ans;
      if (op === '+') ans = a + b;
      else if (op === '-') ans = a - b;
      else ans = a * b;
      const content = `Scratch运算积木：${a} ${op} ${b} = ?`;
      const options = shuffle([ans, ans + 1, ans - 1, a + b + 1]);
      return { content, options, answer: String.fromCharCode(65 + options.indexOf(ans)), explanation: `${a}${op}${b}=${ans}`, difficulty: 2 };
    }
  },
  {
    kp: '侦测与交互',
    build: (gradeRange) => {
      const objects = ['鼠标指针', '舞台边缘', '另一个角色', '特定颜色'];
      const obj = randChoice(objects);
      const content = `Scratch中，"碰到${obj}"积木属于哪个分类？`;
      const options = shuffle(['侦测', '运动', '外观', '事件']);
      return { content, options, answer: 'A', explanation: '碰到...是侦测分类中的积木，用于检测碰撞', difficulty: 2 };
    }
  },
  {
    kp: '声音与音乐',
    build: (gradeRange) => {
      const instruments = ['钢琴', '小提琴', '鼓', '小号'];
      const inst = randChoice(instruments);
      const content = `Scratch中，要演奏${inst}声音，应该使用哪个扩展？`;
      const options = shuffle(['音乐', '画笔', '视频侦测', '文字朗读']);
      return { content, options, answer: 'A', explanation: '音乐扩展提供了演奏不同乐器声音的功能', difficulty: 2 };
    }
  },
  {
    kp: 'Scratch基础',
    build: (gradeRange) => {
      const content = `Scratch的舞台大小是多少？`;
      const options = shuffle(['480×360', '640×480', '800×600', '1024×768']);
      return { content, options, answer: 'A', explanation: 'Scratch舞台的标准尺寸是480×360像素', difficulty: 2 };
    }
  },
  {
    kp: '变量与列表',
    build: (gradeRange) => {
      const items = ['苹果', '香蕉', '橙子', '葡萄'];
      const item = randChoice(items);
      const content = `Scratch列表中，如何添加"${item}"到末尾？`;
      const options = shuffle(['将...加入列表', '删除列表的第1项', '替换列表的第1项', '列表包含...']);
      return { content, options, answer: 'A', explanation: '"将...加入列表"用于在列表末尾添加元素', difficulty: 2 };
    }
  },
  {
    kp: '克隆体',
    build: (gradeRange) => {
      const content = `Scratch中，如何删除所有克隆体？`;
      const options = shuffle(['删除此克隆体', '停止全部', '隐藏角色', '清空列表']);
      return { content, options, answer: 'A', explanation: '"删除此克隆体"积木用于删除当前克隆体', difficulty: 3 };
    }
  },
  {
    kp: '画笔与绘图',
    build: (gradeRange) => {
      const pens = [2, 5, 10];
      const pen = randChoice(pens);
      const content = `Scratch画笔中，如何将画笔粗细设为${pen}？`;
      const options = shuffle([`将画笔粗细设为${pen}`, '落笔', '抬笔', '将画笔颜色设为...']);
      return { content, options, answer: 'A', explanation: '"将画笔粗细设为..."可以调整画笔线条的粗细', difficulty: 2 };
    }
  },
  {
    kp: '控制结构',
    build: (gradeRange) => {
      const content = `Scratch中，"停止全部"积木的作用是什么？`;
      const options = shuffle(['停止所有角色的脚本', '只停止当前角色', '删除所有角色', '隐藏舞台']);
      return { content, options, answer: 'A', explanation: '"停止全部"会终止所有角色和舞台的所有脚本', difficulty: 2 };
    }
  }
];

// ============ Python模板 (30个参数化模板 × 3年级段 × 4道 = 360道) ============
const pythonTemplates = [
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const funcs = ['print()', 'input()', 'len()', 'type()', 'str()', 'int()'];
      const func = randChoice(funcs);
      const explanations = {
        'print()': '输出内容到屏幕',
        'input()': '获取用户键盘输入',
        'len()': '获取对象的长度',
        'type()': '查看数据类型',
        'str()': '转换为字符串',
        'int()': '转换为整数'
      };
      const content = `Python中，${func}函数的作用是？`;
      const options = shuffle([explanations[func], '定义变量', '创建文件', '导入模块']);
      return { content, options, answer: 'A', explanation: explanations[func], difficulty: 1 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const names = ['my_name', 'score_1', 'total_count', 'user_age'];
      const badNames = ['2name', 'my-name', 'my name', 'class'];
      const good = randChoice(names);
      const bad = randChoice(badNames);
      const content = `Python中，以下哪个是正确的变量命名？`;
      const options = shuffle([good, bad, randChoice(badNames), randChoice(badNames)]);
      return { content, options, answer: 'A', explanation: '变量名可以包含字母、数字和下划线，但不能以数字开头或包含空格', difficulty: 1 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const symbols = ['#', '"""', "'''", '//'];
      const symbol = randChoice(symbols);
      const explanations = {
        '#': '单行注释，不会被执行',
        '"""': '多行注释/文档字符串',
        "'''": '多行注释/文档字符串',
        '//': '不是Python的注释符号'
      };
      const content = `Python中，"${symbol}"符号的作用是什么？`;
      const options = shuffle([explanations[symbol], '乘法运算', '除法运算', '定义函数']);
      return { content, options, answer: 'A', explanation: explanations[symbol], difficulty: 1 };
    }
  },
  {
    kp: '数据类型',
    build: (gradeRange) => {
      const values = ['"hello"', '42', '3.14', '[1, 2, 3]', '{"a": 1}', '(1, 2)', 'True'];
      const types = {
        '"hello"': '字符串',
        '42': '整数',
        '3.14': '浮点数',
        '[1, 2, 3]': '列表',
        '{"a": 1}': '字典',
        '(1, 2)': '元组',
        'True': '布尔值'
      };
      const val = randChoice(values);
      const content = `Python中，${val}属于什么数据类型？`;
      const options = shuffle([types[val], '字符串', '整数', '列表']);
      return { content, options, answer: 'A', explanation: `${val}是${types[val]}类型`, difficulty: 1 };
    }
  },
  {
    kp: '数据类型',
    build: (gradeRange) => {
      const content = `Python中，[1, 2, 3]属于什么数据类型？`;
      const options = shuffle(['列表', '字符串', '字典', '元组']);
      return { content, options, answer: 'A', explanation: '用方括号括起来的一组数据是列表', difficulty: 1 };
    }
  },
  {
    kp: '数据类型',
    build: (gradeRange) => {
      const keys = ['name', 'age', 'score', 'grade'];
      const vals = ['小明', '12', '95', '六年级'];
      const k = randChoice(keys);
      const v = randChoice(vals);
      const content = `Python中，{"${k}": "${v}"}属于什么数据类型？`;
      const options = shuffle(['字典', '列表', '字符串', '元组']);
      return { content, options, answer: 'A', explanation: '用花括号包含键值对的是字典', difficulty: 2 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const content = `Python中，if语句的作用是什么？`;
      const options = shuffle(['根据条件执行不同代码', '重复执行代码', '定义函数', '导入模块']);
      return { content, options, answer: 'A', explanation: 'if语句用于条件判断，根据条件真假执行不同代码', difficulty: 2 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const conditions = ['x > 5', 'x == 10', 'x != 0', 'x >= 3'];
      const cond = randChoice(conditions);
      const content = `Python中，以下哪个是正确的if语句？`;
      const options = shuffle([`if ${cond}:`, `if ${cond} then`, `if (${cond})`, `if ${cond};`]);
      return { content, options, answer: 'A', explanation: 'Python的if语句以冒号结尾，不需要then或花括号', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const content = `Python中，for循环通常用于什么场景？`;
      const options = shuffle(['遍历序列中的每个元素', '条件判断', '定义函数', '异常处理']);
      return { content, options, answer: 'A', explanation: 'for循环用于遍历列表、字符串等序列的每个元素', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const n = randInt(3, 10);
      const content = `Python中，range(${n})会生成哪些数字？`;
      const correct = Array.from({length: n}, (_, i) => i).join(', ');
      const options = shuffle([correct, Array.from({length: n}, (_, i) => i + 1).join(', '), Array.from({length: n + 1}, (_, i) => i).join(', '), Array.from({length: n}, (_, i) => n - i).join(', ')]);
      return { content, options, answer: 'A', explanation: `range(${n})生成0到${n-1}的整数，不包括${n}`, difficulty: 2 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const content = `Python中，def关键字的作用是什么？`;
      const options = shuffle(['定义函数', '定义变量', '定义类', '导入模块']);
      return { content, options, answer: 'A', explanation: 'def用于定义函数', difficulty: 2 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const funcs = ['hello', 'greet', 'add', 'calculate'];
      const func = randChoice(funcs);
      const content = `Python中，函数return语句的作用是？`;
      const options = shuffle(['返回结果并结束函数', '打印输出', '定义变量', '导入模块']);
      return { content, options, answer: 'A', explanation: 'return将结果返回给调用者，并结束函数执行', difficulty: 2 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const funcs = ['hello', 'greet', 'add', 'calculate', 'sum_up'];
      const func = randChoice(funcs);
      const content = `以下哪个是正确的Python函数定义？`;
      const options = shuffle([`def ${func}():`, `function ${func}():`, `func ${func}():`, `define ${func}():`]);
      return { content, options, answer: 'A', explanation: 'Python用def定义函数', difficulty: 2 };
    }
  },
  {
    kp: '列表操作',
    build: (gradeRange) => {
      const methods = ['append()', 'insert()', 'remove()', 'pop()', 'sort()', 'reverse()'];
      const method = randChoice(methods);
      const explanations = {
        'append()': '在列表末尾添加元素',
        'insert()': '在指定位置插入元素',
        'remove()': '删除第一个匹配的元素',
        'pop()': '删除并返回指定位置的元素',
        'sort()': '对列表进行排序',
        'reverse()': '反转列表顺序'
      };
      const content = `Python中，列表.${method}方法的作用是？`;
      const options = shuffle([explanations[method], '获取列表长度', '复制列表', '清空列表']);
      return { content, options, answer: 'A', explanation: explanations[method], difficulty: 2 };
    }
  },
  {
    kp: '列表操作',
    build: (gradeRange) => {
      const nums = [1, 2, 3, 4, 5];
      const n = randInt(3, 5);
      const arr = nums.slice(0, n);
      const content = `Python中，len([${arr.join(', ')}])的结果是？`;
      const options = shuffle([String(n), String(n-1), String(n+1), '1']);
      return { content, options, answer: 'A', explanation: `len()返回列表的元素个数，[${arr.join(', ')}]有${n}个元素`, difficulty: 1 };
    }
  },
  {
    kp: '字符串操作',
    build: (gradeRange) => {
      const words = ['hello', 'world', 'python', 'code'];
      const word = randChoice(words);
      const content = `Python中，"${word}".upper()的结果是？`;
      const options = shuffle([word.toUpperCase(), word.charAt(0).toUpperCase() + word.slice(1), word, word.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c).join('')]);
      return { content, options, answer: 'A', explanation: 'upper()将字符串转换为大写', difficulty: 1 };
    }
  },
  {
    kp: '字符串操作',
    build: (gradeRange) => {
      const content = `Python中，如何获取字符串的长度？`;
      const options = shuffle(['len()', 'length()', 'size()', 'count()']);
      return { content, options, answer: 'A', explanation: 'len()函数可以获取字符串、列表等的长度', difficulty: 1 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const content = `Python中，input()函数的作用是？`;
      const options = shuffle(['获取用户键盘输入', '输出内容', '打开文件', '连接网络']);
      return { content, options, answer: 'A', explanation: 'input()用于获取用户的键盘输入', difficulty: 1 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const content = `Python中，elif是什么意思？`;
      const options = shuffle(['else if的简写，用于多个条件判断', '定义变量', '循环语句', '异常处理']);
      return { content, options, answer: 'A', explanation: 'elif是else if的简写，用于多分支条件判断', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const content = `Python中，while循环和for循环的主要区别是？`;
      const options = shuffle(['while按条件循环，for按次数/序列循环', '没有区别', 'while更快', 'for更复杂']);
      return { content, options, answer: 'A', explanation: 'while根据条件判断循环，for用于遍历序列或固定次数', difficulty: 3 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const ops = ['+', '-', '*', '/', '//', '%', '**'];
      const op = randChoice(ops);
      const explanations = {
        '+': '加法',
        '-': '减法',
        '*': '乘法',
        '/': '除法',
        '//': '整除',
        '%': '取余',
        '**': '幂运算'
      };
      const content = `Python中，"${op}"运算符的作用是？`;
      const options = shuffle([explanations[op], '字符串连接', '列表合并', '赋值']);
      return { content, options, answer: 'A', explanation: `${op}是${explanations[op]}运算符`, difficulty: 1 };
    }
  },
  {
    kp: '数据类型',
    build: (gradeRange) => {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      const content = `Python中，${a} + ${b}的结果是什么数据类型？`;
      const options = shuffle(['整数', '字符串', '浮点数', '列表']);
      return { content, options, answer: 'A', explanation: '两个整数相加结果是整数', difficulty: 1 };
    }
  },
  {
    kp: '列表操作',
    build: (gradeRange) => {
      const idx = randInt(0, 3);
      const arr = [10, 20, 30, 40];
      const content = `Python中，[${arr.join(', ')}][${idx}]的值是多少？`;
      const options = shuffle([String(arr[idx]), String(arr[(idx+1)%4]), String(arr[(idx+2)%4]), String(arr[(idx+3)%4])]);
      return { content, options, answer: 'A', explanation: `列表索引从0开始，[${idx}]对应${arr[idx]}`, difficulty: 2 };
    }
  },
  {
    kp: '字符串操作',
    build: (gradeRange) => {
      const word = randChoice(['hello', 'python', 'world', 'code']);
      const start = randInt(0, 2);
      const end = start + randInt(2, 4);
      const content = `Python中，"${word}"[${start}:${end}]的结果是？`;
      const result = word.slice(start, end);
      const options = shuffle([result, word.slice(start, end+1), word[start], word[end]]);
      return { content, options, answer: 'A', explanation: `切片[${start}:${end}]取从索引${start}到${end-1}的字符`, difficulty: 3 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      const content = `以下Python函数的返回值是多少？\ndef add(x, y):\n    return x + y\n\nadd(${a}, ${b}) = ?`;
      const ans = a + b;
      const options = shuffle([String(ans), String(a * b), String(a - b), String(a)]);
      return { content, options, answer: 'A', explanation: `add(${a}, ${b})返回${a}+${b}=${ans}`, difficulty: 2 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const x = randInt(5, 15);
      const content = `以下Python代码的输出是什么？\nx = ${x}\nif x > 10:\n    print("大")\nelse:\n    print("小")`;
      const ans = x > 10 ? '大' : '小';
      const options = shuffle([ans, ans === '大' ? '小' : '大', '10', String(x)]);
      return { content, options, answer: 'A', explanation: `x=${x}，${x > 10 ? '大于' : '不大于'}10，所以输出"${ans}"`, difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const n = randInt(3, 6);
      const content = `以下Python代码的输出是什么？\nfor i in range(${n}):\n    print(i)`;
      const ans = Array.from({length: n}, (_, i) => i).join(' ');
      const options = shuffle([ans, Array.from({length: n}, (_, i) => i + 1).join(' '), String(n), '0']);
      return { content, options, answer: 'A', explanation: `range(${n})输出0到${n-1}`, difficulty: 2 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const content = `Python中，以下哪个符号用于代码缩进？`;
      const options = shuffle(['空格或Tab', '分号', '花括号', '圆括号']);
      return { content, options, answer: 'A', explanation: 'Python使用缩进来表示代码块，通常用4个空格', difficulty: 1 };
    }
  },
  {
    kp: '数据类型',
    build: (gradeRange) => {
      const content = `Python中，以下哪个是可变数据类型？`;
      const options = shuffle(['列表', '字符串', '元组', '整数']);
      return { content, options, answer: 'A', explanation: '列表是可变的，可以添加、删除或修改元素', difficulty: 3 };
    }
  },
  {
    kp: 'Python基础',
    build: (gradeRange) => {
      const content = `Python中，以下哪个是合法的布尔值？`;
      const options = shuffle(['True', 'true', 'TRUE', '1']);
      return { content, options, answer: 'A', explanation: 'Python中布尔值是True和False，首字母大写', difficulty: 1 };
    }
  }
];

// ============ C++模板 (30个参数化模板 × 3年级段 × 4道 = 360道) ============
const cppTemplates = [
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const content = `C++中，cout的作用是？`;
      const options = shuffle(['输出内容到屏幕', '获取输入', '定义变量', '包含头文件']);
      return { content, options, answer: 'A', explanation: 'cout用于标准输出，将内容显示在屏幕上', difficulty: 1 };
    }
  },
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const content = `C++中，cin的作用是？`;
      const options = shuffle(['获取用户输入', '输出内容', '定义函数', '包含头文件']);
      return { content, options, answer: 'A', explanation: 'cin用于标准输入，获取用户的键盘输入', difficulty: 1 };
    }
  },
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const content = `C++程序的主函数名称是什么？`;
      const options = shuffle(['main', 'start', 'begin', 'run']);
      return { content, options, answer: 'A', explanation: 'C++程序从main函数开始执行', difficulty: 1 };
    }
  },
  {
    kp: '变量与类型',
    build: (gradeRange) => {
      const types = ['int', 'double', 'char', 'bool', 'string', 'float'];
      const type = randChoice(types);
      const explanations = {
        'int': '整数',
        'double': '双精度浮点数',
        'char': '单个字符',
        'bool': '布尔值',
        'string': '字符串',
        'float': '单精度浮点数'
      };
      const content = `C++中，${type}类型用于存储什么数据？`;
      const options = shuffle([explanations[type], '整数', '小数', '字符']);
      return { content, options, answer: 'A', explanation: `${type}是${explanations[type]}类型`, difficulty: 1 };
    }
  },
  {
    kp: '变量与类型',
    build: (gradeRange) => {
      const content = `C++中，double类型用于存储什么数据？`;
      const options = shuffle(['双精度浮点数', '整数', '字符', '布尔值']);
      return { content, options, answer: 'A', explanation: 'double是双精度浮点数类型，用于存储小数', difficulty: 1 };
    }
  },
  {
    kp: '变量与类型',
    build: (gradeRange) => {
      const content = `C++中，char类型用于存储什么数据？`;
      const options = shuffle(['单个字符', '整数', '字符串', '小数']);
      return { content, options, answer: 'A', explanation: 'char是字符类型，存储单个字符', difficulty: 1 };
    }
  },
  {
    kp: '运算符',
    build: (gradeRange) => {
      const ops = ['%', '++', '--', '&&', '||', '!'];
      const op = randChoice(ops);
      const explanations = {
        '%': '取余数',
        '++': '自增1',
        '--': '自减1',
        '&&': '逻辑与',
        '||': '逻辑或',
        '!': '逻辑非'
      };
      const content = `C++中，${op}运算符的作用是？`;
      const options = shuffle([explanations[op], '百分比', '除法', '乘法']);
      return { content, options, answer: 'A', explanation: `${op}是${explanations[op]}运算符`, difficulty: 2 };
    }
  },
  {
    kp: '运算符',
    build: (gradeRange) => {
      const content = `C++中，a++和++a的区别是什么？`;
      const options = shuffle(['a++先使用再自增，++a先自增再使用', '没有区别', 'a++更快', '++a更慢']);
      return { content, options, answer: 'A', explanation: '后置++先返回原值再自增，前置++先自增再返回新值', difficulty: 3 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const content = `C++中，if语句后面必须跟什么符号？`;
      const options = shuffle(['圆括号', '方括号', '花括号', '分号']);
      return { content, options, answer: 'A', explanation: 'if后面必须用圆括号包裹条件表达式', difficulty: 1 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const content = `C++中，switch语句通常用于什么场景？`;
      const options = shuffle(['多分支选择', '循环执行', '定义函数', '异常处理']);
      return { content, options, answer: 'A', explanation: 'switch用于根据变量值进行多分支选择', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const content = `C++中，for循环的三个部分是什么？`;
      const options = shuffle(['初始化; 条件; 更新', '条件; 初始化; 更新', '更新; 条件; 初始化', '初始化; 更新; 条件']);
      return { content, options, answer: 'A', explanation: 'for(初始化; 条件; 更新)是标准格式', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const content = `C++中，break语句的作用是？`;
      const options = shuffle(['跳出当前循环', '跳过本次循环', '继续循环', '结束程序']);
      return { content, options, answer: 'A', explanation: 'break用于立即退出当前循环', difficulty: 2 };
    }
  },
  {
    kp: '数组',
    build: (gradeRange) => {
      const n = randInt(3, 10);
      const content = `C++中，以下哪个是正确的数组定义？`;
      const options = shuffle([`int arr[${n}];`, `int arr = ${n};`, `int arr();`, `int arr{};`]);
      return { content, options, answer: 'A', explanation: `int arr[${n}]定义了包含${n}个整数的数组`, difficulty: 2 };
    }
  },
  {
    kp: '数组',
    build: (gradeRange) => {
      const content = `C++中，数组下标从几开始？`;
      const options = shuffle(['0', '1', '-1', '根据类型']);
      return { content, options, answer: 'A', explanation: 'C++数组下标从0开始，arr[0]是第一个元素', difficulty: 1 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const content = `C++中，函数声明和函数定义的区别是？`;
      const options = shuffle(['声明只有函数头，定义包含函数体', '没有区别', '声明包含代码', '定义没有参数']);
      return { content, options, answer: 'A', explanation: '函数声明只说明函数签名，定义包含具体的实现代码', difficulty: 3 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const content = `C++中，void函数表示什么？`;
      const options = shuffle(['不返回任何值', '返回整数', '返回字符串', '返回小数']);
      return { content, options, answer: 'A', explanation: 'void表示函数不返回任何值', difficulty: 2 };
    }
  },
  {
    kp: '指针',
    build: (gradeRange) => {
      const content = `C++中，*运算符在声明变量时表示什么？`;
      const options = shuffle(['指针', '乘法', '引用', '解引用']);
      return { content, options, answer: 'A', explanation: '在声明中，*表示定义指针变量', difficulty: 3 };
    }
  },
  {
    kp: '指针',
    build: (gradeRange) => {
      const content = `C++中，&运算符在变量前表示什么？`;
      const options = shuffle(['取地址', '与运算', '引用声明', '按位与']);
      return { content, options, answer: 'A', explanation: '&在变量前表示获取该变量的内存地址', difficulty: 3 };
    }
  },
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const headers = ['iostream', 'cmath', 'string', 'vector', 'algorithm'];
      const header = randChoice(headers);
      const explanations = {
        'iostream': '输入输出流库',
        'cmath': '数学函数库',
        'string': '字符串处理库',
        'vector': '动态数组库',
        'algorithm': '算法库'
      };
      const content = `C++中，#include <${header}>的作用是什么？`;
      const options = shuffle([`包含${explanations[header]}`, '定义主函数', '声明变量', '创建类']);
      return { content, options, answer: 'A', explanation: `${header}是C++标准${explanations[header]}`, difficulty: 1 };
    }
  },
  {
    kp: '变量与类型',
    build: (gradeRange) => {
      const content = `C++中，bool类型可以取哪些值？`;
      const options = shuffle(['true和false', '0和1', '是和否', '对和错']);
      return { content, options, answer: 'A', explanation: 'bool是布尔类型，只有true和false两个值', difficulty: 1 };
    }
  },
  {
    kp: '运算符',
    build: (gradeRange) => {
      const a = randInt(10, 50);
      const b = randInt(2, 9);
      const content = `C++中，${a} % ${b}的结果是？`;
      const ans = a % b;
      const options = shuffle([String(ans), String(a / b), String(a - b), String(a + b)]);
      return { content, options, answer: 'A', explanation: `${a} % ${b} = ${ans}（取余运算）`, difficulty: 2 };
    }
  },
  {
    kp: '条件语句',
    build: (gradeRange) => {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      const content = `以下C++代码的输出是什么？\nint a = ${a}, b = ${b};\nif (a > b) cout << "大";\nelse cout << "小";`;
      const ans = a > b ? '大' : '小';
      const options = shuffle([ans, ans === '大' ? '小' : '大', String(a), String(b)]);
      return { content, options, answer: 'A', explanation: `a=${a}, b=${b}，${a > b ? 'a>b' : 'a≤b'}，输出"${ans}"`, difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const n = randInt(3, 6);
      const content = `以下C++代码会输出几次"*"？\nfor (int i = 0; i < ${n}; i++)\n    cout << "*";`;
      const options = shuffle([String(n), String(n+1), String(n-1), '0']);
      return { content, options, answer: 'A', explanation: `i从0到${n-1}，共执行${n}次`, difficulty: 2 };
    }
  },
  {
    kp: '数组',
    build: (gradeRange) => {
      const arr = [10, 20, 30, 40, 50];
      const idx = randInt(0, 4);
      const content = `C++中，int arr[] = {${arr.join(', ')}}; arr[${idx}]的值是多少？`;
      const options = shuffle([String(arr[idx]), String(arr[(idx+1)%5]), String(arr[(idx+2)%5]), String(idx)]);
      return { content, options, answer: 'A', explanation: `数组下标从0开始，arr[${idx}] = ${arr[idx]}`, difficulty: 2 };
    }
  },
  {
    kp: '函数',
    build: (gradeRange) => {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      const content = `以下C++函数的返回值是多少？\nint add(int a, int b) {\n    return a + b;\n}\n\nadd(${a}, ${b}) = ?`;
      const ans = a + b;
      const options = shuffle([String(ans), String(a * b), String(a - b), String(a)]);
      return { content, options, answer: 'A', explanation: `add(${a}, ${b})返回${a}+${b}=${ans}`, difficulty: 2 };
    }
  },
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const content = `C++中，以下哪个是正确的注释写法？`;
      const options = shuffle(['// 这是注释', '# 这是注释', '/* 这是注释', '<!-- 这是注释 -->']);
      return { content, options, answer: 'A', explanation: '// 是C++的单行注释', difficulty: 1 };
    }
  },
  {
    kp: '变量与类型',
    build: (gradeRange) => {
      const content = `C++中，以下哪个是合法的变量名？`;
      const options = shuffle(['_count', '2ndValue', 'my-var', 'my var']);
      return { content, options, answer: 'A', explanation: '变量名可以以下划线开头，不能以数字开头，不能包含空格或减号', difficulty: 2 };
    }
  },
  {
    kp: '循环语句',
    build: (gradeRange) => {
      const content = `C++中，continue语句的作用是？`;
      const options = shuffle(['跳过本次循环，继续下一次', '跳出循环', '结束程序', '暂停执行']);
      return { content, options, answer: 'A', explanation: 'continue跳过当前迭代，直接进入下一次循环', difficulty: 3 };
    }
  },
  {
    kp: '数组',
    build: (gradeRange) => {
      const n = randInt(3, 8);
      const content = `C++中，int arr[${n}]; 定义了一个包含多少个元素的数组？`;
      const options = shuffle([String(n), String(n+1), String(n-1), '不确定']);
      return { content, options, answer: 'A', explanation: `arr[${n}]定义了包含${n}个元素的数组`, difficulty: 1 };
    }
  },
  {
    kp: 'C++基础',
    build: (gradeRange) => {
      const content = `C++中，endl的作用是什么？`;
      const options = shuffle(['换行并刷新缓冲区', '定义变量', '结束程序', '包含头文件']);
      return { content, options, answer: 'A', explanation: 'endl输出换行符并刷新输出缓冲区', difficulty: 2 };
    }
  }
];

// ============ 生成函数 ============
function generateQuestions(templates, courseType, gradeRanges, perTemplate, globalContentSet) {
  const questions = [];

  for (const gradeRange of gradeRanges) {
    for (const template of templates) {
      for (let i = 0; i < perTemplate; i++) {
        const q = template.build(gradeRange);
        // 为非math类型的题目添加年级段前缀，确保不同年级段的题目内容不同
        const content = courseType === 'math' ? q.content : `【${gradeRange}】${q.content}`;
        const hash = hashContent(content);
        if (!globalContentSet.has(hash)) {
          globalContentSet.add(hash);
          questions.push({
            content: content,
            options: JSON.stringify(q.options),
            answer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            course_type: courseType,
            grade_range: gradeRange,
            knowledge_point: template.kp,
            status: 'approved',
            question_type: 'single',
            score: 5,
          });
        }
      }
    }
  }
  return questions;
}

function generateMoreQuestionsWithGlobalDedup(templates, courseType, gradeRanges, targetPerRange, globalContentSet) {
  const questions = [];

  for (const gradeRange of gradeRanges) {
    let attempts = 0;
    const maxAttempts = targetPerRange * 200;
    while (questions.filter(q => q.course_type === courseType && q.grade_range === gradeRange).length < targetPerRange && attempts < maxAttempts) {
      attempts++;
      const template = randChoice(templates);
      const q = template.build(gradeRange);
      const hash = hashContent(q.content);
      if (!globalContentSet.has(hash)) {
        globalContentSet.add(hash);
        questions.push({
          content: q.content,
          options: JSON.stringify(q.options),
          answer: q.answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          course_type: courseType,
          grade_range: gradeRange,
          knowledge_point: template.kp,
          status: 'approved',
          question_type: 'single',
          score: 5,
        });
      }
    }
  }
  return questions;
}

// ============ 主程序 ============
async function main() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'data.sqlite');
  console.log('Opening database:', dbPath);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  await db.run('PRAGMA foreign_keys = ON');

  console.log('\n========== 开始生成题目 ==========');

  // 先清空题目表
  console.log('清空现有题目...');
  await db.run('DELETE FROM questions');
  console.log('题目表已清空');

  const gradeRanges = ['1-3', '4-6', '7-9'];
  const perTemplate = 8;
  const globalContentSet = new Set();

  // 生成各类型题目
  const allQuestions = [];

  console.log('\n[1/5] 生成数理逻辑题目...');
  const mathQuestions = generateQuestions(mathTemplates, 'math', gradeRanges, perTemplate, globalContentSet);
  allQuestions.push(...mathQuestions);
  console.log(`  生成 ${mathQuestions.length} 道数理逻辑题`);

  console.log('[2/5] 生成AIGC素养题目...');
  const aigcQuestions = generateQuestions(aigcTemplates, 'aigc', gradeRanges, perTemplate, globalContentSet);
  allQuestions.push(...aigcQuestions);
  console.log(`  生成 ${aigcQuestions.length} 道AIGC素养题`);

  console.log('[3/5] 生成Scratch题目...');
  const scratchQuestions = generateQuestions(scratchTemplates, 'scratch', gradeRanges, perTemplate, globalContentSet);
  allQuestions.push(...scratchQuestions);
  console.log(`  生成 ${scratchQuestions.length} 道Scratch题`);

  console.log('[4/5] 生成Python题目...');
  const pythonQuestions = generateQuestions(pythonTemplates, 'python', gradeRanges, perTemplate, globalContentSet);
  allQuestions.push(...pythonQuestions);
  console.log(`  生成 ${pythonQuestions.length} 道Python题`);

  console.log('[5/5] 生成C++题目...');
  const cppQuestions = generateQuestions(cppTemplates, 'cpp', gradeRanges, perTemplate, globalContentSet);
  allQuestions.push(...cppQuestions);
  console.log(`  生成 ${cppQuestions.length} 道C++题`);

  console.log(`\n总计生成 ${allQuestions.length} 道唯一题目`);

  // 批量插入数据库
  console.log('\n========== 开始插入数据库 ==========');
  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    for (const q of batch) {
      try {
        await db.run(
          `INSERT INTO questions (content, options, answer, explanation, difficulty, course_type, grade_range, knowledge_point, status, question_type, score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [q.content, q.options, q.answer, q.explanation, q.difficulty, q.course_type, q.grade_range, q.knowledge_point, q.status, q.question_type, q.score]
        );
        inserted++;
      } catch (err) {
        console.error('插入失败:', err.message);
      }
    }
    if (i % 100 === 0) {
      console.log(`  已插入 ${inserted}/${allQuestions.length}`);
    }
  }

  console.log(`\n成功插入 ${inserted} 道题目`);

  // 验证统计
  console.log('\n========== 验证统计 ==========');
  const stats = await db.all(`
    SELECT course_type, grade_range, COUNT(*) as cnt
    FROM questions
    GROUP BY course_type, grade_range
    ORDER BY course_type, grade_range
  `);

  for (const row of stats) {
    console.log(`  ${row.course_type} / ${row.grade_range}: ${row.cnt} 道`);
  }

  const total = await db.get('SELECT COUNT(*) as cnt FROM questions');
  console.log(`\n数据库中题目总数: ${total.cnt}`);

  // 去重检查
  console.log('\n========== 去重检查 ==========');
  const dups = await db.all(`
    SELECT content, COUNT(*) as cnt
    FROM questions
    GROUP BY content
    HAVING cnt > 1
  `);

  if (dups.length === 0) {
    console.log('通过！未发现重复题目');
  } else {
    console.log(`警告！发现 ${dups.length} 组重复题目`);
    for (const d of dups.slice(0, 5)) {
      console.log(`  重复 ${d.cnt} 次: ${d.content.substring(0, 50)}...`);
    }
  }

  await db.close();
  console.log('\n========== 题目生成完成 ==========');
}

main().catch(err => {
  console.error('生成题目失败:', err);
  process.exit(1);
});
