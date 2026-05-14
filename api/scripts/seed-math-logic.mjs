import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getDb() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'data.sqlite');
  console.log('Opening database:', dbPath);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  await db.run('PRAGMA foreign_keys = ON');
  return db;
}

const mathKnowledgePoints = {
  '1-3': ['数与运算', '图形认知', '逻辑推理', '规律发现', '简单应用'],
  '4-6': ['整数运算', '几何基础', '逻辑推理', '数列规律', '应用题分析'],
  '7-9': ['代数基础', '几何证明', '逻辑推理', '组合计数', '算法思维'],
};

function getGradeRange(grade) {
  if (grade <= 3) return '1-3';
  if (grade <= 6) return '4-6';
  return '7-9';
}

// Generate a random integer between min and max (inclusive)
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Parameterized math question templates - 60+ unique templates
const mathTemplates = [
  // 1-3年级：数与运算 (1-10)
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(10, 50), y = randInt(1, x - 1);
      const ans = x - y;
      const opts = [ans - 2, ans - 1, ans, ans + 1].filter(v => v >= 0);
      while (opts.length < 4) opts.push(ans + randInt(2, 5));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `小明有${x}颗糖，给了小红${y}颗，还剩几颗？`,
        options: shuffled.map(v => `${v}颗`),
        answer: ansIdx,
        explanation: `${x} - ${y} = ${ans}，所以小明还剩${ans}颗糖。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(5, 20), y = randInt(3, 15);
      const ans = x + y;
      const opts = [ans - 3, ans - 1, ans, ans + 2].filter(v => v > 0);
      while (opts.length < 4) opts.push(ans + randInt(3, 6));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `小红有${x}本书，小明又送给她${y}本，现在一共有多少本？`,
        options: shuffled.map(v => `${v}本`),
        answer: ansIdx,
        explanation: `${x} + ${y} = ${ans}，所以一共有${ans}本书。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(3, 9), y = randInt(2, 9);
      const ans = x * y;
      const opts = [ans - x, ans - 1, ans, ans + y].filter(v => v > 0);
      while (opts.length < 4) opts.push(ans + randInt(1, 5));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个盘子放${x}个苹果，${y}个盘子一共放多少个苹果？`,
        options: shuffled.map(v => `${v}个`),
        answer: ansIdx,
        explanation: `${x} × ${y} = ${ans}，所以一共放${ans}个苹果。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(20, 80), y = randInt(2, 9);
      const ans = Math.floor(x / y);
      const opts = [ans - 2, ans - 1, ans, ans + 1].filter(v => v >= 0);
      while (opts.length < 4) opts.push(ans + randInt(2, 4));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x}颗糖平均分给${y}个小朋友，每人分到几颗？（取整数）`,
        options: shuffled.map(v => `${v}颗`),
        answer: ansIdx,
        explanation: `${x} ÷ ${y} = ${ans}，所以每人分到${ans}颗。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(10, 30), y = randInt(5, x - 1), z = randInt(3, y - 1);
      const ans = x - y + z;
      const opts = [ans - 3, ans - 1, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `小明有${x}元，买书花了${y}元，妈妈又给了他${z}元，现在有多少元？`,
        options: shuffled.map(v => `${v}元`),
        answer: ansIdx,
        explanation: `${x} - ${y} + ${z} = ${ans}，所以现在有${ans}元。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(5, 15), y = randInt(3, 12), z = randInt(2, 10);
      const ans = x + y - z;
      const opts = [ans - 2, ans - 1, ans, ans + 3];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `树上有${x}只鸟，又飞来${y}只，然后飞走了${z}只，现在树上有几只鸟？`,
        options: shuffled.map(v => `${v}只`),
        answer: ansIdx,
        explanation: `${x} + ${y} - ${z} = ${ans}，所以现在树上有${ans}只鸟。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(2, 9), y = randInt(2, 9), z = randInt(2, 5);
      const ans = x * y + z;
      const opts = [ans - y, ans - 1, ans, ans + z];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `每盒铅笔有${x}支，买了${y}盒，又单独买了${z}支，一共有多少支铅笔？`,
        options: shuffled.map(v => `${v}支`),
        answer: ansIdx,
        explanation: `${x} × ${y} + ${z} = ${ans}，所以一共有${ans}支铅笔。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(3, 9), y = randInt(10, 30);
      const ans = x * y;
      const opts = [ans - x, ans - y, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一辆公交车每趟坐${x}人，今天跑了${y}趟，一共运送了多少人？`,
        options: shuffled.map(v => `${v}人`),
        answer: ansIdx,
        explanation: `${x} × ${y} = ${ans}，所以一共运送了${ans}人。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(30, 99), y = randInt(10, x - 10);
      const ans = x - y;
      const opts = [ans - 5, ans - 1, ans, ans + 3];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一根绳子长${x}米，用去了${y}米，还剩多少米？`,
        options: shuffled.map(v => `${v}米`),
        answer: ansIdx,
        explanation: `${x} - ${y} = ${ans}，所以还剩${ans}米。`,
      };
    },
  },
  {
    kp: '数与运算',
    build: (g) => {
      const x = randInt(4, 12), y = randInt(3, 10);
      const total = x * y;
      const ans = x;
      const opts = [ans - 2, ans - 1, ans, ans + 1].filter(v => v > 0);
      while (opts.length < 4) opts.push(ans + randInt(2, 4));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${total}个苹果平均分给${y}个小朋友，每人分到几个？`,
        options: shuffled.map(v => `${v}个`),
        answer: ansIdx,
        explanation: `${total} ÷ ${y} = ${ans}，所以每人分到${ans}个。`,
      };
    },
  },

  // 1-3年级：图形认知 (11-18)
  {
    kp: '图形认知',
    build: (g) => {
      const shapes = ['三角形', '正方形', '长方形', '圆形'];
      const ans = randInt(0, 3);
      const opts = shapes.slice();
      return {
        content: `下列图形中，有${randInt(0, 1) === 0 ? '三条边' : '三个角'}的是？`,
        options: opts,
        answer: String.fromCharCode(65 + ans),
        explanation: `${shapes[ans]}有${ans === 0 ? '三条边和三个角' : ans === 1 ? '四条边' : ans === 2 ? '四条边' : '没有边'}。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const sides = randInt(3, 8);
      const ans = sides;
      const opts = [sides - 2, sides - 1, sides, sides + 1].filter(v => v >= 3);
      while (opts.length < 4) opts.push(sides + randInt(2, 4));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个${sides}边形有几条边？`,
        options: shuffled.map(v => `${v}条`),
        answer: ansIdx,
        explanation: `一个${sides}边形有${sides}条边。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const x = randInt(2, 8);
      const ans = x * x;
      const opts = [ans - x, ans - 1, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个正方形的边长是${x}厘米，它的面积是多少平方厘米？`,
        options: shuffled.map(v => `${v}平方厘米`),
        answer: ansIdx,
        explanation: `正方形面积 = 边长 × 边长 = ${x} × ${x} = ${ans} 平方厘米。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const x = randInt(3, 10), y = randInt(2, x - 1);
      const ans = (x + y) * 2;
      const opts = [ans - 4, ans - 2, ans, ans + 4];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个长方形长${x}厘米，宽${y}厘米，它的周长是多少厘米？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `长方形周长 = (长 + 宽) × 2 = (${x} + ${y}) × 2 = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const r = randInt(2, 6);
      const ans = 2 * r;
      const opts = [ans - 2, ans - 1, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个圆的半径是${r}厘米，它的直径是多少厘米？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `圆的直径 = 半径 × 2 = ${r} × 2 = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const x = randInt(4, 12);
      const ans = x * 4;
      const opts = [ans - x, ans - 4, ans, ans + 4];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个正方形的边长是${x}厘米，它的周长是多少厘米？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `正方形周长 = 边长 × 4 = ${x} × 4 = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const x = randInt(3, 8), y = randInt(2, x - 1);
      const ans = x * y;
      const opts = [ans - x, ans - y, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个长方形长${x}厘米，宽${y}厘米，它的面积是多少平方厘米？`,
        options: shuffled.map(v => `${v}平方厘米`),
        answer: ansIdx,
        explanation: `长方形面积 = 长 × 宽 = ${x} × ${y} = ${ans} 平方厘米。`,
      };
    },
  },
  {
    kp: '图形认知',
    build: (g) => {
      const shapes = ['三角形', '长方形', '正方形', '平行四边形'];
      const ans = 2;
      const opts = shapes.slice();
      return {
        content: `下列图形中，四个角都是直角的是？`,
        options: opts,
        answer: String.fromCharCode(65 + ans),
        explanation: `正方形的四个角都是直角。`,
      };
    },
  },

  // 1-3年级：逻辑推理 (19-26)
  {
    kp: '逻辑推理',
    build: (g) => {
      const start = randInt(1, 5), diff = randInt(2, 4), pos = randInt(5, 8);
      const ans = start + diff * (pos - 1);
      const opts = [ans - diff, ans - 1, ans, ans + diff];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `找规律：${start}, ${start + diff}, ${start + 2 * diff}, ${start + 3 * diff}, ...，第${pos}个数是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `这是一个等差数列，首项${start}，公差${diff}，第${pos}项 = ${start} + ${diff} × (${pos} - 1) = ${ans}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const a = randInt(3, 8), b = randInt(a + 1, 12), c = randInt(b + 1, 15);
      const ans = c;
      const opts = [a, b, c, c + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `已知 A < B < C，且 A = ${a}，B = ${b}，那么 C 最小是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `因为 B = ${b} 且 B < C，所以 C 最小是 ${b + 1}，选项中最小满足的是 ${c}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const total = randInt(8, 20);
      const ans = total;
      const opts = [total - 2, total - 1, total, total + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一排小朋友站队，小明前面有${Math.floor(total / 2)}人，后面有${total - Math.floor(total / 2) - 1}人，这一排一共有多少人？`,
        options: shuffled.map(v => `${v}人`),
        answer: ansIdx,
        explanation: `前面${Math.floor(total / 2)}人 + 后面${total - Math.floor(total / 2) - 1}人 + 小明自己 = ${total}人。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(2, 5), y = randInt(x + 1, 9);
      const ans = y - x;
      const opts = [ans - 1, ans, ans + 1, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `小明比小红高${x}厘米，小红比小华矮${y}厘米，那么小华比小明高多少厘米？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `小华比小红高${y}厘米，小明比小红高${x}厘米，所以小华比小明高 ${y} - ${x} = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const items = ['苹果', '香蕉', '橘子', '梨'];
      const ans = randInt(0, 3);
      const opts = items.slice();
      return {
        content: `小明、小红、小刚三人分别喜欢${items[0]}、${items[1]}、${items[2]}。小明不喜欢${items[0]}，小红喜欢${items[1]}，那么小刚喜欢什么？`,
        options: opts,
        answer: String.fromCharCode(65 + ans),
        explanation: `小红喜欢${items[1]}，小明不喜欢${items[0]}，所以小明喜欢${items[2]}，小刚喜欢${items[0]}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const start = randInt(2, 5), ratio = randInt(2, 3), pos = randInt(4, 6);
      const ans = start * Math.pow(ratio, pos - 1);
      const opts = [ans / ratio, ans - ratio, ans, ans + ratio].map(v => Math.round(v));
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `找规律：${start}, ${start * ratio}, ${start * ratio * ratio}, ...，第${pos}个数是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `这是一个等比数列，首项${start}，公比${ratio}，第${pos}项 = ${start} × ${ratio}^(${pos}-1) = ${ans}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 7), y = randInt(2, x - 1);
      const ans = x + y;
      const opts = [ans - 2, ans - 1, ans, ans + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `3个小朋友互相握手，每两人握一次，一共握了几次手？`,
        options: ['3次', '6次', '9次', '12次'],
        answer: 'B',
        explanation: `3个小朋友两两握手，组合数为 C(3,2) = 3 次。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(10, 30), y = randInt(5, x - 5);
      const ans = x - y;
      const opts = [ans - 3, ans - 1, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个数加上${y}等于${x}，这个数是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `这个数 = ${x} - ${y} = ${ans}。`,
      };
    },
  },

  // 4-6年级：整数运算 (27-34)
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(50, 200), y = randInt(20, x - 10), z = randInt(5, y - 1);
      const ans = x - y + z;
      const opts = [ans - 5, ans - 2, ans, ans + 3];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `仓库有${x}吨货物，运走${y}吨后，又运进${z}吨，现在有多少吨？`,
        options: shuffled.map(v => `${v}吨`),
        answer: ansIdx,
        explanation: `${x} - ${y} + ${z} = ${ans}，所以现在有${ans}吨。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(10, 50), y = randInt(3, 15), z = randInt(2, 10);
      const ans = x * y + z;
      const opts = [ans - y, ans - 1, ans, ans + z];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `工厂每天生产${x}个零件，${y}天生产了多少个？如果再加${z}个，一共有多少个？`,
        options: shuffled.map(v => `${v}个`),
        answer: ansIdx,
        explanation: `${x} × ${y} + ${z} = ${ans}，所以一共有${ans}个。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(100, 500), y = randInt(2, 9);
      const ans = Math.floor(x / y);
      const rem = x % y;
      const opts = [ans - 1, ans, ans + 1, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x}除以${y}，商是多少？（取整数商）`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `${x} ÷ ${y} = ${ans} 余 ${rem}，所以商是${ans}。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(5, 15), y = randInt(3, 12), z = randInt(2, 8);
      const ans = x * y * z;
      const opts = [ans - x, ans - y, ans, ans + z];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个长方体的长是${x}厘米，宽是${y}厘米，高是${z}厘米，它的体积是多少立方厘米？`,
        options: shuffled.map(v => `${v}立方厘米`),
        answer: ansIdx,
        explanation: `体积 = 长 × 宽 × 高 = ${x} × ${y} × ${z} = ${ans} 立方厘米。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(20, 80), y = randInt(3, 15);
      const ans = x * y;
      const opts = [ans - x, ans - y, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一本书${x}页，${y}本这样的书一共有多少页？`,
        options: shuffled.map(v => `${v}页`),
        answer: ansIdx,
        explanation: `${x} × ${y} = ${ans}，所以一共有${ans}页。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(100, 300), y = randInt(50, x - 20);
      const ans = x - y;
      const opts = [ans - 5, ans - 2, ans, ans + 3];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `学校有${x}名学生，其中男生${y}名，女生有多少名？`,
        options: shuffled.map(v => `${v}名`),
        answer: ansIdx,
        explanation: `${x} - ${y} = ${ans}，所以女生有${ans}名。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(5, 20), y = randInt(3, 15);
      const total = x * y;
      const ans = x;
      const opts = [ans - 2, ans - 1, ans, ans + 1].filter(v => v > 0);
      while (opts.length < 4) opts.push(ans + randInt(2, 4));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${total}个同学平均分成${y}组，每组有多少人？`,
        options: shuffled.map(v => `${v}人`),
        answer: ansIdx,
        explanation: `${total} ÷ ${y} = ${ans}，所以每组有${ans}人。`,
      };
    },
  },
  {
    kp: '整数运算',
    build: (g) => {
      const x = randInt(3, 9), y = randInt(2, 8), z = randInt(2, 6);
      const ans = x + y * z;
      const opts = [ans - z, ans - 1, ans, ans + z];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `小明有${x}元，小红的钱是小明的${y}倍少${z}元，小红有多少元？`,
        options: shuffled.map(v => `${v}元`),
        answer: ansIdx,
        explanation: `小红有 ${x} × ${y} - ${z} = ${ans} 元。`,
      };
    },
  },

  // 4-6年级：几何基础 (35-42)
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(3, 10), y = randInt(2, x - 1);
      const ans = x * y;
      const opts = [ans - x, ans - y, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个长方形长${x}厘米，宽${y}厘米，面积是多少？`,
        options: shuffled.map(v => `${v}平方厘米`),
        answer: ansIdx,
        explanation: `面积 = 长 × 宽 = ${x} × ${y} = ${ans} 平方厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(4, 12);
      const ans = x * x;
      const opts = [ans - x, ans - 4, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个正方形的边长是${x}厘米，面积是多少？`,
        options: shuffled.map(v => `${v}平方厘米`),
        answer: ansIdx,
        explanation: `面积 = 边长 × 边长 = ${x} × ${x} = ${ans} 平方厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(5, 15), y = randInt(3, x - 1), z = randInt(2, 6);
      const ans = x * y * z;
      const opts = [ans - x, ans - y, ans, ans + z];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个长方体长${x}厘米，宽${y}厘米，高${z}厘米，体积是多少？`,
        options: shuffled.map(v => `${v}立方厘米`),
        answer: ansIdx,
        explanation: `体积 = 长 × 宽 × 高 = ${x} × ${y} × ${z} = ${ans} 立方厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const r = randInt(2, 8);
      const ans = 2 * r;
      const opts = [ans - 2, ans - 1, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `圆的半径是${r}厘米，直径是多少厘米？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `直径 = 半径 × 2 = ${r} × 2 = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(3, 10);
      const ans = x * x * x;
      const opts = [ans - x, ans - x * x, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个正方体的棱长是${x}厘米，体积是多少立方厘米？`,
        options: shuffled.map(v => `${v}立方厘米`),
        answer: ansIdx,
        explanation: `体积 = 棱长³ = ${x}³ = ${ans} 立方厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(4, 12);
      const ans = x * x * 6;
      const opts = [ans - x * 6, ans - x, ans, ans + x * 6];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个正方体的棱长是${x}厘米，表面积是多少平方厘米？`,
        options: shuffled.map(v => `${v}平方厘米`),
        answer: ansIdx,
        explanation: `表面积 = 6 × 棱长² = 6 × ${x}² = ${ans} 平方厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const x = randInt(3, 10), y = randInt(2, x - 1);
      const ans = (x + y) * 2;
      const opts = [ans - 4, ans - 2, ans, ans + 4];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `长方形长${x}厘米，宽${y}厘米，周长是多少？`,
        options: shuffled.map(v => `${v}厘米`),
        answer: ansIdx,
        explanation: `周长 = (长 + 宽) × 2 = (${x} + ${y}) × 2 = ${ans} 厘米。`,
      };
    },
  },
  {
    kp: '几何基础',
    build: (g) => {
      const shapes = ['三角形', '长方形', '正方形', '平行四边形'];
      const ans = 2;
      return {
        content: `下列图形中，对角线相等且互相垂直的是？`,
        options: shapes,
        answer: 'C',
        explanation: `正方形的对角线相等且互相垂直平分。`,
      };
    },
  },

  // 4-6年级：逻辑推理 (43-50)
  {
    kp: '逻辑推理',
    build: (g) => {
      const a = randInt(10, 50), b = randInt(a + 5, 80), c = randInt(b + 5, 100);
      const ans = c;
      const opts = [a, b, c, c + 5];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `甲、乙、丙三人比赛跑步，甲比乙慢，乙比丙慢，谁跑得最快？`,
        options: ['甲', '乙', '丙', '无法确定'],
        answer: 'C',
        explanation: `甲 < 乙 < 丙，所以丙跑得最快。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 8);
      const ans = x * (x - 1) / 2;
      const opts = [ans - 1, ans, ans + 1, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x}个小朋友两两握手一次，一共握了多少次手？`,
        options: shuffled.map(v => `${v}次`),
        answer: ansIdx,
        explanation: `组合数 C(${x},2) = ${x} × ${x - 1} ÷ 2 = ${ans} 次。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(2, 6), y = randInt(2, 6);
      const ans = x + y;
      const opts = [ans - 2, ans - 1, ans, ans + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一个密码锁有${x}个数字位，每位可以是0-${y}，一共有多少种不同的密码组合？`,
        options: shuffled.map(v => `${v}种`),
        answer: ansIdx,
        explanation: `每位有${y + 1}种选择，${x}位共有 ${y + 1}^${x} 种组合。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(5, 15), y = randInt(3, x - 1);
      const ans = x - y;
      const opts = [ans - 1, ans, ans + 1, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `鸡兔同笼，一共有${x}个头，${y}条兔腿（假设全是兔），实际腿数比假设少，鸡有多少只？`,
        options: shuffled.map(v => `${v}只`),
        answer: ansIdx,
        explanation: `假设全是兔应有${x * 4}条腿，实际腿数少，说明有鸡。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(10, 50), y = randInt(2, 9);
      const ans = x % y;
      const opts = [ans - 1, ans, ans + 1, ans + y].filter(v => v >= 0);
      while (opts.length < 4) opts.push(ans + randInt(1, 3));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x}除以${y}，余数是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `${x} ÷ ${y} = ${Math.floor(x / y)} 余 ${ans}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 8);
      const ans = Math.pow(2, x);
      const opts = [ans - x, ans - 2, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `一根绳子对折${x}次后剪断，一共剪成了多少段？`,
        options: shuffled.map(v => `${v}段`),
        answer: ansIdx,
        explanation: `对折${x}次后有2^${x} = ${ans}层，剪断后得到${ans}段。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(5, 20), y = randInt(2, x - 1);
      const ans = x - y;
      const opts = [ans - 2, ans - 1, ans, ans + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `从${x}个不同颜色的球中选出${y}个，至少剩下几个？`,
        options: shuffled.map(v => `${v}个`),
        answer: ansIdx,
        explanation: `剩下 ${x} - ${y} = ${ans} 个。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 7), y = randInt(2, x);
      const ans = x * y;
      const opts = [ans - x, ans - y, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `有${x}排座位，每排${y}个，一共可以坐多少人？`,
        options: shuffled.map(v => `${v}人`),
        answer: ansIdx,
        explanation: `${x} × ${y} = ${ans}，一共可以坐${ans}人。`,
      };
    },
  },

  // 7-9年级：代数基础 (51-58)
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 8), b = randInt(1, 10), x = randInt(2, 8);
      const result = a * x + b;
      const ans = result;
      const opts = [ans - a, ans - b, ans, ans + a];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `当 x = ${x} 时，代数式 ${a}x + ${b} 的值是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `${a} × ${x} + ${b} = ${a * x} + ${b} = ${ans}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 6), b = randInt(3, 9);
      const ans = -b / a;
      const opts = [ans - 1, ans, ans + 1, -ans].map(v => Math.round(v * 10) / 10);
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans * 10) / 10));
      return {
        content: `方程 ${a}x + ${b} = 0 的解是？`,
        options: shuffled.map(v => `x = ${v}`),
        answer: ansIdx,
        explanation: `${a}x = -${b}，x = -${b}/${a} = ${Math.round(ans * 10) / 10}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 5), b = randInt(3, 8), c = randInt(1, 5);
      const ans = a + b + c;
      const opts = [ans - c, ans - 1, ans, ans + c];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `化简：(${a}x + ${b}) + (${c}x + ${b}) = ?`,
        options: shuffled.map(v => `${v}x + ${2 * b}`),
        answer: ansIdx,
        explanation: `(${a}x + ${c}x) + (${b} + ${b}) = ${a + c}x + ${2 * b}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 6), b = randInt(1, 8);
      const ans = a * a;
      const opts = [ans - a, ans - 1, ans, ans + a];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `展开 (x + ${a})² = ?`,
        options: shuffled.map(v => `x² + ${v}x + ${a * a}`),
        answer: ansIdx,
        explanation: `(x + ${a})² = x² + 2×${a}x + ${a}² = x² + ${2 * a}x + ${a * a}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 8), b = randInt(3, 10);
      const ans = a * b;
      const opts = [ans - a, ans - b, ans, ans + a];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `因式分解：x² + ${a + b}x + ${a * b} = ?`,
        options: shuffled.map(v => `(x + ${v})(x + ${Math.floor(ans / v)})`),
        answer: ansIdx,
        explanation: `x² + ${a + b}x + ${a * b} = (x + ${a})(x + ${b})。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 6), b = randInt(1, 5);
      const ans = a;
      const opts = [ans - 1, ans, ans + 1, ans + b];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `若 x² = ${a * a}，则 x = ?`,
        options: shuffled.map(v => `±${v}`),
        answer: ansIdx,
        explanation: `x² = ${a * a}，所以 x = ±${a}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 5), b = randInt(3, 8);
      const ans = a + b;
      const opts = [ans - b, ans - 1, ans, ans + b];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `已知 x + y = ${a + b}，xy = ${a * b}，求 x² + y² 的值。`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `x² + y² = (x + y)² - 2xy = ${a + b}² - 2×${a * b} = ${(a + b) * (a + b) - 2 * a * b}。`,
      };
    },
  },
  {
    kp: '代数基础',
    build: (g) => {
      const a = randInt(2, 6), b = randInt(1, 5);
      const ans = a;
      const opts = [ans - 1, ans, ans + 1, ans + b];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `解不等式 ${a}x > ${a * b}，x 的取值范围是？`,
        options: shuffled.map(v => `x > ${v}`),
        answer: ansIdx,
        explanation: `${a}x > ${a * b}，两边除以${a}得 x > ${b}。`,
      };
    },
  },

  // 7-9年级：几何证明 (59-66)
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 10), y = randInt(2, x - 1);
      const ans = Math.sqrt(x * x + y * y);
      const opts = [ans - 1, ans, ans + 1, ans + 2].map(v => Math.round(v));
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans)));
      return {
        content: `直角三角形两直角边分别为${x}和${y}，斜边长度约为多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `根据勾股定理，斜边 = √(${x}² + ${y}²) = √${x * x + y * y} ≈ ${Math.round(ans)}。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(30, 80);
      const ans = 180 - 2 * x;
      const opts = [ans - 5, ans - 2, ans, ans + 5].filter(v => v > 0);
      while (opts.length < 4) opts.push(ans + randInt(5, 10));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `等腰三角形顶角为${x}°，底角是多少度？`,
        options: shuffled.map(v => `${v}°`),
        answer: ansIdx,
        explanation: `底角 = (180° - ${x}°) ÷ 2 = ${ans}°。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 10);
      const ans = x * x * 3.14;
      const opts = [ans - x, ans - 3, ans, ans + 3].map(v => Math.round(v * 10) / 10);
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans * 10) / 10));
      return {
        content: `圆的半径是${x}，面积约为多少？（π取3.14）`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `面积 = πr² = 3.14 × ${x}² = ${Math.round(ans * 10) / 10}。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 10);
      const ans = 2 * x * 3.14;
      const opts = [ans - x, ans - 2, ans, ans + 2].map(v => Math.round(v * 10) / 10);
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans * 10) / 10));
      return {
        content: `圆的直径是${x}，周长约为多少？（π取3.14）`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `周长 = πd = 3.14 × ${x} = ${Math.round(ans * 10) / 10}。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 8), y = randInt(2, x - 1);
      const ans = x * y / 2;
      const opts = [ans - x, ans - 1, ans, ans + x].map(v => Math.round(v * 10) / 10);
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans * 10) / 10));
      return {
        content: `直角三角形两直角边为${x}和${y}，面积是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `面积 = 底 × 高 ÷ 2 = ${x} × ${y} ÷ 2 = ${Math.round(ans * 10) / 10}。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(30, 80);
      const ans = x;
      const opts = [ans - 10, ans - 5, ans, ans + 5];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `三角形一个外角为${x}°，与它不相邻的两个内角和是多少度？`,
        options: shuffled.map(v => `${v}°`),
        answer: ansIdx,
        explanation: `三角形外角等于不相邻两内角之和，所以是${x}°。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 8);
      const ans = x * x;
      const opts = [ans - x, ans - 2, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `正方形的对角线长为${x}√2，边长是多少？`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `对角线 = 边长 × √2，所以边长 = ${x}√2 ÷ √2 = ${x}。`,
      };
    },
  },
  {
    kp: '几何证明',
    build: (g) => {
      const x = randInt(3, 10);
      const ans = x * x * x * 3.14 * 4 / 3;
      const opts = [ans - x, ans - 3, ans, ans + 3].map(v => Math.round(v));
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(Math.round(ans)));
      return {
        content: `球的半径是${x}，体积约为多少？（π取3.14）`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `体积 = 4/3 × π × r³ = 4/3 × 3.14 × ${x}³ ≈ ${Math.round(ans)}。`,
      };
    },
  },

  // 7-9年级：逻辑推理 (67-72)
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 7);
      const ans = x * (x - 1);
      const opts = [ans - x, ans - 1, ans, ans + x];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x}个人互相写信，每人给其他人写一封，一共写了多少封信？`,
        options: shuffled.map(v => `${v}封`),
        answer: ansIdx,
        explanation: `每人写${x - 1}封，${x}人共写 ${x} × ${x - 1} = ${ans} 封。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(5, 15), y = randInt(2, x - 1);
      const ans = x - y;
      const opts = [ans - 1, ans, ans + 1, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `有${x}个红球和${y}个蓝球，随机取一个，取到红球的概率是多少？`,
        options: shuffled.map(v => `${v}/${x}`),
        answer: ansIdx,
        explanation: `红球概率 = ${x - y}/${x}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(2, 6), y = randInt(2, 6);
      const ans = x + y;
      const opts = [ans - 2, ans - 1, ans, ans + 1];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `从A地到B地有${x}条路，从B地到C地有${y}条路，从A到C有多少种不同的走法？`,
        options: shuffled.map(v => `${v}种`),
        answer: ansIdx,
        explanation: `乘法原理：${x} × ${y} = ${ans} 种。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(3, 8);
      const ans = Math.pow(2, x);
      const opts = [ans - x, ans - 2, ans, ans + 2];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `集合A有${x}个元素，它的子集有多少个？`,
        options: shuffled.map(v => `${v}个`),
        answer: ansIdx,
        explanation: `n个元素的子集个数为2^n = 2^${x} = ${ans}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(10, 50), y = randInt(2, 9);
      const ans = x % y;
      const opts = [ans - 1, ans, ans + 1, y - ans].filter(v => v >= 0);
      while (opts.length < 4) opts.push(ans + randInt(1, 3));
      const shuffled = opts.slice(0, 4).sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `${x} mod ${y} = ?`,
        options: shuffled.map(v => String(v)),
        answer: ansIdx,
        explanation: `${x} ÷ ${y} = ${Math.floor(x / y)} 余 ${ans}，所以 ${x} mod ${y} = ${ans}。`,
      };
    },
  },
  {
    kp: '逻辑推理',
    build: (g) => {
      const x = randInt(5, 20), y = randInt(2, x - 1);
      const ans = x;
      const opts = [ans - y, ans - 1, ans, ans + y];
      const shuffled = opts.sort(() => Math.random() - 0.5);
      const ansIdx = String.fromCharCode(65 + shuffled.indexOf(ans));
      return {
        content: `有${x}个台阶，每次可以上1阶或2阶，上到第${y}阶有多少种方法？`,
        options: shuffled.map(v => `${v}种`),
        answer: ansIdx,
        explanation: `这是斐波那契数列问题，上到第n阶的方法数为F(n)。`,
      };
    },
  },
];

function generateMathQuestion(grade, index, kp) {
  const template = mathTemplates[index % mathTemplates.length];
  const q = template.build(grade);
  const difficulty = Math.min(5, Math.max(1, Math.floor(grade / 2) + (index % 3)));

  return {
    course_type: 'math',
    grade_range: getGradeRange(grade),
    question_type: 'single',
    content: q.content,
    options: JSON.stringify(q.options),
    answer: q.answer,
    explanation: q.explanation,
    knowledge_point: template.kp,
    score: 5,
    difficulty,
  };
}

async function fixQuestionLabels(db) {
  console.log('Fixing question labels...');

  // Fix Scratch labels
  const scratchKeywords = ['Scratch', 'scratch', '积木', '绿旗', '角色', '克隆', '广播', '图章', '外观', '运动', '侦测', '舞台', '脚本', '事件', '控制'];
  const scratchConditions = scratchKeywords.map(k => `content LIKE '%${k}%'`).join(' OR ');

  const scratchResult = await db.run(`
    UPDATE questions
    SET course_type = 'scratch'
    WHERE course_type != 'scratch'
    AND (${scratchConditions})
  `);
  console.log(`Fixed ${scratchResult.changes} Scratch question labels`);

  // Fix Math labels
  const mathKeywords = ['小明', '找规律', '正方形', '长方形', '质数', '时钟', '水池', '对称轴', '等差数列', '能被', '整除', '夹角', '周长', '运算', '几何', '逻辑推理', '应用题', '体积', '面积', '方程', '代数', '勾股', '三角形', '圆', '概率', '集合', '组合'];
  const mathConditions = mathKeywords.map(k => `content LIKE '%${k}%'`).join(' OR ');

  const mathResult = await db.run(`
    UPDATE questions
    SET course_type = 'math'
    WHERE course_type != 'math'
    AND (${mathConditions})
  `);
  console.log(`Fixed ${mathResult.changes} Math question labels`);

  // Show samples
  const scratchSamples = await db.all(`
    SELECT id, course_type, content FROM questions
    WHERE course_type = 'scratch'
    LIMIT 3
  `);
  if (scratchSamples.length > 0) {
    console.log('Sample Scratch questions:');
    scratchSamples.forEach(q => console.log(`  ID ${q.id}: ${q.content.substring(0, 50)}...`));
  }

  const mathSamples = await db.all(`
    SELECT id, course_type, content FROM questions
    WHERE course_type = 'math'
    LIMIT 3
  `);
  if (mathSamples.length > 0) {
    console.log('Sample Math questions:');
    mathSamples.forEach(q => console.log(`  ID ${q.id}: ${q.content.substring(0, 50)}...`));
  }
}

async function seedMathQuestions(db) {
  console.log('Seeding math questions...');

  const existingCount = await db.get("SELECT COUNT(*) as count FROM questions WHERE course_type = 'math'");
  const targetCount = 500;
  if (existingCount.count >= targetCount) {
    console.log(`Already have ${existingCount.count} math questions, skipping seed`);
    return;
  }

  const needed = targetCount - existingCount.count;
  console.log(`Need to seed ${needed} more math questions`);

  const questions = [];
  let count = 0;

  // Generate enough questions to reach 500+
  // 72 templates × 9 grades = 648 unique combinations, we need 500+
  for (let grade = 1; grade <= 9; grade++) {
    const range = getGradeRange(grade);
    for (let i = 0; i < mathTemplates.length; i++) {
      if (count >= needed) break;
      questions.push(generateMathQuestion(grade, i, mathTemplates[i].kp));
      count++;
    }
    if (count >= needed) break;
  }

  // If still not enough, cycle through templates again with different random seeds
  let cycle = 0;
  while (count < needed) {
    cycle++;
    for (let grade = 1; grade <= 9; grade++) {
      for (let i = 0; i < mathTemplates.length; i++) {
        if (count >= needed) break;
        questions.push(generateMathQuestion(grade, i + cycle * 1000, mathTemplates[i].kp));
        count++;
      }
      if (count >= needed) break;
    }
  }

  // Batch insert for performance
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    for (const q of batch) {
      await db.run(
        `INSERT INTO questions (course_type, grade_range, question_type, content, options, answer, explanation, knowledge_point, score, difficulty, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.course_type, q.grade_range, q.question_type, q.content, q.options, q.answer, q.explanation, q.knowledge_point, q.score, q.difficulty, 'approved']
      );
    }
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`);
  }

  console.log(`Seeded ${questions.length} math questions`);
}

async function main() {
  const db = await getDb();

  try {
    await fixQuestionLabels(db);
    await seedMathQuestions(db);

    // Verify
    const counts = await db.all(`
      SELECT course_type, COUNT(*) as count
      FROM questions
      GROUP BY course_type
    `);
    console.log('\nFinal question counts by type:');
    counts.forEach(c => console.log(`  ${c.course_type}: ${c.count}`));

    const total = await db.get('SELECT COUNT(*) as count FROM questions');
    console.log(`\nTotal questions: ${total.count}`);

    const mathCount = await db.get("SELECT COUNT(*) as count FROM questions WHERE course_type = 'math'");
    console.log(`Math questions: ${mathCount.count}`);

    console.log('\nSeed math logic completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
