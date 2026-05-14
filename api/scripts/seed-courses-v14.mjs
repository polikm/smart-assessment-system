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

const coursesData = [
  {
    name: '图形化编程：像搭积木一样编程（Level 1）',
    course_type: 'scratch',
    grade_range: '1-3',
    description: '本课程为低龄孩子打造图形化编程启蒙课，以积木式拖拽操作降低编程门槛，通过趣味动画、小游戏实践，让孩子掌握编程基础逻辑，培养计算思维，冲刺 GESP 图形化一级认证。',
    syllabus: '计算机基础、Scratch 操作、顺序/分支/循环结构、运动/侦测/外观/画笔模块、变量、广播、程序调试、真题冲刺',
    target_audience: '6-9 岁，编程刚入门或有少量基础',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP 图形化编程一级、白名单赛事',
    matching_events: 'CCF GESP 一级、全国青少年信息素养大赛、粤港澳青少年信息学创新大赛',
    start_date: '2026-07-15',
  },
  {
    name: '科学与生活：通过 Scratch 了解生活中的奥秘（Level 2）',
    course_type: 'scratch',
    grade_range: '1-3',
    description: '在 Scratch 一级基础上深化编程能力，结合生活场景与科学知识，通过克隆、列表、自定义积木、递归等进阶功能，开发趣味科学项目，提升逻辑推理与复杂程序设计能力，备战 GESP 图形化二级。',
    syllabus: '克隆与图章、变量/列表、数学运算、自定义积木、递归、流程图、网络基础、综合游戏开发',
    target_audience: '7-10 岁，完成 Level 1 或同等能力',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP 图形化编程二级、白名单赛事',
    matching_events: 'CCF GESP 二级、全国青少年信息素养大赛、粤港澳青少年信息学创新大赛',
    start_date: '2026-07-15',
  },
  {
    name: 'Python 编程：在游戏中学习编程（Level 1）',
    course_type: 'python',
    grade_range: '4-6',
    description: '以游戏化教学为核心，带领孩子入门 Python 代码编程，掌握基础语法、输入输出、数据结构与 Turtle 绘图，通过猜数字、龟龟赛跑等趣味游戏，夯实 Python 编程基础，适配 GESP Python 一级备考。',
    syllabus: 'Python 环境、输入输出、条件判断、列表/字典、Turtle 绘图、模块、龟龟赛跑/弹球游戏开发',
    target_audience: '9-12 岁，编程入门/少量基础',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP Python 一级、白名单赛事',
    matching_events: 'CCF GESP 一级、全国白名单赛事、广东省青少年电子信息素养大赛',
    start_date: '2026-07-15',
  },
  {
    name: 'Python 编程：程序中的趣味逻辑（Level 2）',
    course_type: 'python',
    grade_range: '4-6',
    description: '聚焦 Python 编程逻辑提升，深化数据类型、循环判断、函数应用等知识，通过井字棋、迷宫寻径等实战项目，培养算法思维与程序调试能力，系统备考 GESP Python 二级。',
    syllabus: '数据类型/结构、循环/判断、井字棋开发、随机迷宫、自动寻径算法、等级考试真题',
    target_audience: '10-12 岁，有编程基础',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP Python 二级、白名单赛事',
    matching_events: 'CCF GESP 二级、全国白名单赛事、广东省青少年电子信息素养大赛',
    start_date: '2026-07-15',
  },
  {
    name: 'Python 编程：基础游戏开发（Level 3）',
    course_type: 'python',
    grade_range: '7-9',
    description: '基于 Pygame Zero 框架开展基础游戏开发教学，让孩子掌握游戏界面绘制、角色控制、碰撞检测、事件处理等核心技能，独立完成追逐游戏、迷宫地图等作品，体验游戏开发与基础算法结合的乐趣。',
    syllabus: 'Pygame Zero、图形绘制、角色控制、碰撞检测、追逐游戏、瓦片迷宫地图开发',
    target_audience: '12 岁及以上，有编程基础',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: '游戏开发、算法体验',
    matching_events: '全国白名单赛事、广东省青少年电子信息素养大赛',
    start_date: '2026-07-15',
  },
  {
    name: 'Python 编程：进阶游戏开发（Level 4）',
    course_type: 'python',
    grade_range: '7-9',
    description: '进阶 Python 游戏开发实战，深入讲解飞机大战、贪吃蛇、射击游戏等经典游戏的开发逻辑，引入面向对象编程思想，掌握游戏状态管理、关卡设计、音效整合等高级技能，打造完整游戏作品。',
    syllabus: '飞机大战、贪吃蛇、射击游戏、面向对象编程、游戏状态/关卡/得分管理',
    target_audience: '12 岁及以上，有编程基础',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: '游戏开发、算法体验',
    matching_events: '全国白名单赛事、广东省青少年电子信息素养大赛',
    start_date: '2026-07-15',
  },
  {
    name: '代码的序章：计算思维与结构之美（Level 1）',
    course_type: 'cpp',
    grade_range: '4-9',
    description: 'C++ 编程零基础入门课，从计算机工作原理讲起，带领孩子掌握变量、输入输出、三大程序结构，建立规范的代码编写习惯，初步形成计算思维，适配 GESP C++ 一级备考。',
    syllabus: '计算机原理、变量/输入输出、顺序/分支/循环三大程序结构',
    target_audience: '五年级～初中',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP 一级、白名单赛事',
    matching_events: 'CCF GESP 一级、粤港澳青少年信息学创新大赛、全国青少年信息素养大赛',
    start_date: '2026-07-15',
  },
  {
    name: '逻辑的织网：从循环到数组（Level 2）',
    course_type: 'cpp',
    grade_range: '4-9',
    description: '承接 C++ 一级课程，重点突破循环与分支综合应用、数组与字符串处理，解决批量数据处理问题，强化程序逻辑与代码复用能力，为算法学习筑牢基础，冲刺 GESP C++ 二级。',
    syllabus: '循环综合应用、一维/二维数组、字符数组、字符串处理',
    target_audience: '五年级～初中',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'GESP 二级、白名单赛事',
    matching_events: 'CCF GESP 二级、粤港澳信息学/科创大赛、全国信息素养大赛、USACO 铜级',
    start_date: '2026-07-15',
  },
  {
    name: '算法初探：从分治到纵深（Level 3）',
    course_type: 'cpp',
    grade_range: '4-9',
    description: '正式进入算法学习阶段，讲解函数、递归、排序、高精度计算、枚举、递推、DFS 与回溯等核心算法，培养算法设计与问题求解能力，适配 CSP-J 入门组与 GESP 中高级认证。',
    syllabus: '函数/递归、排序、结构体、高精度计算、枚举、递推、DFS/回溯',
    target_audience: '五年级～初中',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'CSP-J/S、GESP 6-7 级、白名单赛事',
    matching_events: 'CSP-J/S、CCF GESP6-7 级、粤港澳科创大赛、USACO 银级',
    start_date: '2026-07-15',
  },
  {
    name: '算法的精进：从回溯到择优（Level 4）',
    course_type: 'cpp',
    grade_range: '4-9',
    description: 'C++ 算法高阶课程，深化回溯、搜索、分治、二分、贪心等竞赛核心算法，提升程序调试与优化能力，针对性备战 CSP-J/S 复赛，冲击 GESP 最高级别认证。',
    syllabus: '回溯/DFS、记忆化搜索、队列、分治、二分法、快速排序、贪心算法',
    target_audience: '五年级～初中',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'CSP-J/S、GESP 7-8 级、白名单赛事',
    matching_events: 'CSP-J/S、CCF GESP7-8 级、粤港澳信息学大赛、USACO 银/金级',
    start_date: '2026-07-15',
  },
  {
    name: '未来艺术家 - AIGC 超能创作（Level 1）',
    course_type: 'aigc',
    grade_range: '1-9',
    description: 'AI 创作启蒙课程，带领孩子掌握 AI 绘画、提示词设计、风格生成、AI 视频制作等技能，结合语文、美术、历史等跨学科知识，完成海报、漫画、短视频等创意作品，培养 AI 素养与创新能力。',
    syllabus: 'AI 绘画、提示词技巧、风格设计、跨学科创作、AI 视频、结课作品展',
    target_audience: '中小学生',
    total_hours: 45,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: '白名单赛事',
    matching_events: '全国青少年人工智能辅助生成数字艺术大赛、全国青少年人工智能创新挑战赛、广东省白名单赛事',
    start_date: '2026-07-15',
  },
  {
    name: 'AI 智能体（基础班，Level 2）',
    course_type: 'aigc',
    grade_range: '1-9',
    description: 'AI 智能体入门实践课，以海芯平台为工具，让孩子认识 AI 智能体、掌握提示词编写、基础工作流搭建与多分支逻辑设计，开发学习、生活类智能体，建立 AI 应用实践能力。',
    syllabus: 'AI 生活地图、图灵测试、海芯平台操作、提示词智能体、工作流搭建、多分支逻辑、作品优化',
    target_audience: '中小学生',
    total_hours: 36,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: '掌握 AI 智能体搭建、提示词/工作流能力',
    matching_events: '全国青少年人工智能创新挑战赛（智能体开发专项）、全国青少年信息素养大赛、广东省白名单赛事',
    start_date: '2026-07-15',
  },
  {
    name: 'AI 智能体（竞赛班，Level 3）',
    course_type: 'aigc',
    grade_range: '1-9',
    description: '专为 AI 智能体竞赛打造的冲刺课程，同步赛事规则与考点，强化提示词优化、工作流进阶设计、智能体调试等竞赛核心技能，通过全真模拟赛，提升参赛实战能力与获奖概率。',
    syllabus: '赛规解读、提示词优化、工作流搭建、学习/生活类智能体开发、全真模拟赛',
    target_audience: '中小学生（备赛）',
    total_hours: 24,
    price: 10800,
    class_mode: 'offline',
    location: '',
    course_objectives: 'AI 智能体专项赛备赛、竞赛能力提升',
    matching_events: 'AI 智能体应用能力大赛、全国青少年人工智能创新挑战赛、全国青少年信息素养大赛、广东省白名单赛事',
    start_date: '2026-07-15',
  },
];

async function seedCoursesV14() {
  const db = await getDb();

  try {
    const courseCols = await db.all("PRAGMA table_info(courses)");
    const colNames = courseCols.map((c) => c.name);

    if (!colNames.includes('class_mode')) {
      await db.run("ALTER TABLE courses ADD COLUMN class_mode TEXT DEFAULT 'offline'");
      console.log('Added class_mode column to courses');
    }
    if (!colNames.includes('location')) {
      await db.run("ALTER TABLE courses ADD COLUMN location TEXT DEFAULT ''");
      console.log('Added location column to courses');
    }
    if (!colNames.includes('course_objectives')) {
      await db.run("ALTER TABLE courses ADD COLUMN course_objectives TEXT DEFAULT ''");
      console.log('Added course_objectives column to courses');
    }
    if (!colNames.includes('matching_events')) {
      await db.run("ALTER TABLE courses ADD COLUMN matching_events TEXT DEFAULT ''");
      console.log('Added matching_events column to courses');
    }
    if (!colNames.includes('start_date')) {
      await db.run("ALTER TABLE courses ADD COLUMN start_date TEXT DEFAULT ''");
      console.log('Added start_date column to courses');
    }
  } catch (e) {
    console.error('Failed to add columns to courses:', e.message);
  }

  try {
    const courseTable = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='courses'");
    if (courseTable && courseTable.sql && !courseTable.sql.includes("'scratch'")) {
      console.log('Migrating courses table course_type constraint...');
      await db.run('DROP TABLE IF EXISTS courses_backup_v14');
      await db.run('CREATE TABLE courses_backup_v14 AS SELECT * FROM courses');
      const backupCount = await db.get('SELECT COUNT(*) as count FROM courses_backup_v14');
      console.log(`Courses backup: ${backupCount.count} rows`);

      await db.run('DROP TABLE IF EXISTS courses_new_v14');
      await db.run(`
        CREATE TABLE courses_new_v14 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          course_type TEXT NOT NULL CHECK(course_type IN ('aigc', 'scratch', 'python', 'cpp')),
          grade_range TEXT NOT NULL,
          description TEXT,
          syllabus TEXT,
          target_audience TEXT,
          total_hours INTEGER DEFAULT 0,
          price INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
          class_mode TEXT DEFAULT 'offline',
          location TEXT DEFAULT '',
          course_objectives TEXT DEFAULT '',
          matching_events TEXT DEFAULT '',
          start_date TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.run(`
        INSERT INTO courses_new_v14 (
          id, name, course_type, grade_range, description, syllabus, target_audience,
          total_hours, price, status, class_mode, location, course_objectives, matching_events, start_date, created_at
        )
        SELECT
          id, name,
          CASE course_type
            WHEN 'programming' THEN 'python'
            WHEN 'logic' THEN 'cpp'
            ELSE course_type
          END,
          grade_range, description, syllabus, target_audience,
          total_hours, price, status,
          'offline', '', '', '', '', created_at
        FROM courses_backup_v14
      `);

      await db.run('DROP TABLE courses');
      await db.run('ALTER TABLE courses_new_v14 RENAME TO courses');
      console.log('Migrated courses table successfully');
    }
  } catch (e) {
    console.error('Failed to migrate courses table:', e.message);
  }

  try {
    const qTable = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='questions'");
    if (qTable && qTable.sql && !qTable.sql.includes("'scratch'")) {
      console.log('Migrating questions table course_type constraint...');
      await db.run('DROP TABLE IF EXISTS questions_backup_v14');
      await db.run('CREATE TABLE questions_backup_v14 AS SELECT * FROM questions');
      const backupCount = await db.get('SELECT COUNT(*) as count FROM questions_backup_v14');
      console.log(`Questions backup: ${backupCount.count} rows`);

      await db.run('DROP TABLE IF EXISTS questions_new_v14');
      await db.run(`
        CREATE TABLE questions_new_v14 (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_type TEXT NOT NULL CHECK(course_type IN ('aigc', 'scratch', 'python', 'cpp')),
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

      const backupCols = await db.all("PRAGMA table_info(questions_backup_v14)");
      const hasUsageCount = backupCols.some((c) => c.name === 'usage_count');

      if (hasUsageCount) {
        await db.run(`
          INSERT INTO questions_new_v14 (
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
            ai_generated, COALESCE(usage_count, 0), COALESCE(correct_rate, 0), created_at
          FROM questions_backup_v14
        `);
      } else {
        await db.run(`
          INSERT INTO questions_new_v14 (
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
            ai_generated, 0, 0, created_at
          FROM questions_backup_v14
        `);
      }

      const newCount = await db.get('SELECT COUNT(*) as count FROM questions_new_v14');
      console.log(`Questions migration verified: ${newCount.count} rows`);

      await db.run('DROP TABLE questions');
      await db.run('ALTER TABLE questions_new_v14 RENAME TO questions');
      console.log('Migrated questions table successfully');
    }
  } catch (e) {
    console.error('Failed to migrate questions table:', e.message);
  }

  try {
    const examTable = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='exams'");
    if (examTable) {
      const updated = await db.run(`
        UPDATE exams SET course_type = CASE course_type
          WHEN 'programming' THEN 'python'
          WHEN 'logic' THEN 'cpp'
          ELSE course_type
        END
        WHERE course_type IN ('programming', 'logic')
      `);
      console.log(`Updated ${updated.changes} exams course_type`);
    }
  } catch (e) {
    console.error('Failed to update exams:', e.message);
  }

  let insertedCount = 0;
  for (const course of coursesData) {
    try {
      const existing = await db.get('SELECT id FROM courses WHERE name = ?', [course.name]);
      if (existing) {
        console.log(`Course already exists: ${course.name}`);
        continue;
      }

      const result = await db.run(
        `INSERT INTO courses (
          name, course_type, grade_range, description, syllabus, target_audience,
          total_hours, price, status, class_mode, location, course_objectives, matching_events, start_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.name, course.course_type, course.grade_range,
          course.description, course.syllabus, course.target_audience,
          course.total_hours, course.price, 'active',
          course.class_mode, course.location, course.course_objectives,
          course.matching_events, course.start_date,
        ]
      );

      const courseId = result.lastID;
      insertedCount++;

      await db.run(
        `INSERT INTO course_schedules (
          course_id, name, teacher, start_date, end_date, schedule_time, location, capacity, enrolled, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          courseId,
          `${course.name} - 2026暑期班`,
          '待定',
          '2026-07-15',
          '2026-10-15',
          '每周六 9:00-12:00',
          '待定',
          20,
          0,
          'upcoming',
        ]
      );

      console.log(`Inserted course: ${course.name} (id=${courseId}) with default schedule`);
    } catch (e) {
      console.error(`Failed to insert course ${course.name}:`, e.message);
    }
  }

  console.log(`Seed courses V14 completed: ${insertedCount} courses inserted`);
  await db.close();
}

seedCoursesV14().catch(console.error);
