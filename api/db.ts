import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, '..', 'data', 'data.sqlite'),
      driver: sqlite3.Database,
    });
    await db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

export async function initDb() {
  const database = await getDb();

  // 数据库迁移：添加新字段
  try {
    await database.run('ALTER TABLE questions ADD COLUMN image_svg TEXT');
  } catch (e) { /* 字段可能已存在 */ }
  try {
    await database.run('ALTER TABLE questions ADD COLUMN dimension_code TEXT');
  } catch (e) { /* 字段可能已存在 */ }
  try {
    await database.run('ALTER TABLE ai_usage_logs ADD COLUMN input_full TEXT');
  } catch (e) { /* 字段可能已存在 */ }
  try {
    await database.run('ALTER TABLE ai_usage_logs ADD COLUMN output_full TEXT');
  } catch (e) { /* 字段可能已存在 */ }
  try {
    await database.run('ALTER TABLE ai_usage_logs ADD COLUMN context_data TEXT');
  } catch (e) { /* 字段可能已存在 */ }

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')),
      birth_date DATE,
      school TEXT,
      grade INTEGER CHECK(grade BETWEEN 1 AND 9),
      math_score TEXT,
      ai_base TEXT,
      programming_base TEXT,
      awards TEXT,
      interest_aigc INTEGER DEFAULT 0,
      interest_programming INTEGER DEFAULT 0,
      has_computer TEXT,
      parent_support TEXT,
      learning_time TEXT,
      prior_courses TEXT,
      logical_ability TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_type TEXT NOT NULL CHECK(course_type IN ('aigc', 'scratch', 'python', 'cpp', 'math')),
      grade_range TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK(question_type IN ('single', 'multiple', 'judge')),
      content TEXT NOT NULL,
      image_svg TEXT,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT,
      knowledge_point TEXT,
      dimension_code TEXT,
      score INTEGER DEFAULT 1,
      difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
      status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
      ai_generated BOOLEAN DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      correct_rate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course_type TEXT NOT NULL,
      grade INTEGER NOT NULL,
      question_count INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      time_limit INTEGER DEFAULT 60,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      score INTEGER NOT NULL,
      UNIQUE(exam_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS exam_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      level TEXT CHECK(level IN ('A', 'B', 'C', 'D')),
      answers TEXT,
      duration INTEGER,
      recommendations TEXT,
      cheat_flags TEXT,
      tab_switch_count INTEGER DEFAULT 0,
      question_times TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature TEXT NOT NULL,
      status TEXT NOT NULL,
      input_summary TEXT,
      output_summary TEXT,
      duration_ms INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
      grade INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS class_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
      UNIQUE(class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS notice_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      variables TEXT,
      design_config TEXT,
      preview_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES notice_templates(id) ON DELETE SET NULL,
      student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      notice_data TEXT,
      status TEXT DEFAULT 'sent',
      is_read INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
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
      class_mode TEXT DEFAULT 'offline' CHECK(class_mode IN ('online', 'offline')),
      location TEXT DEFAULT '',
      course_objectives TEXT DEFAULT '',
      matching_events TEXT DEFAULT '',
      start_date TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      teacher TEXT,
      start_date TEXT,
      end_date TEXT,
      schedule_time TEXT,
      location TEXT,
      capacity INTEGER DEFAULT 20,
      enrolled INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed', 'full')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('cognitive', 'skill', 'quality', 'innovation', 'collaboration', 'ethics')),
      description TEXT,
      scoring_method TEXT DEFAULT 'auto',
      scoring_criteria TEXT,
      applicable_courses TEXT NOT NULL,
      applicable_grades TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      is_system INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_dimension_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_type TEXT NOT NULL,
      grade_range TEXT NOT NULL,
      dimension_code TEXT NOT NULL,
      weight DECIMAL(5,2) NOT NULL,
      is_required INTEGER DEFAULT 1,
      UNIQUE(course_type, grade_range, dimension_code)
    );

    CREATE TABLE IF NOT EXISTS dimension_question_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dimension_code TEXT NOT NULL,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      relevance INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(dimension_code, question_id)
    );

    CREATE TABLE IF NOT EXISTS dimension_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_record_id INTEGER REFERENCES exam_records(id) ON DELETE CASCADE,
      course_type TEXT NOT NULL,
      dimension_code TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      percentage DECIMAL(5,2),
      UNIQUE(exam_record_id, dimension_code)
    );

    CREATE TABLE IF NOT EXISTS student_ability_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
      course_type TEXT NOT NULL,
      cognitive_score INTEGER DEFAULT 0,
      skill_score INTEGER DEFAULT 0,
      quality_score INTEGER DEFAULT 0,
      innovation_score INTEGER DEFAULT 0,
      collaboration_score INTEGER DEFAULT 0,
      ethics_score INTEGER DEFAULT 0,
      overall_level TEXT,
      trend TEXT CHECK(trend IN ('rising', 'stable', 'declining')),
      trend_change_rate DECIMAL(5,2),
      confidence DECIMAL(5,2) DEFAULT 1.0,
      data_count INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_type)
    );

    CREATE TABLE IF NOT EXISTS student_growth_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
      course_type TEXT NOT NULL,
      exam_record_id INTEGER REFERENCES exam_records(id) ON DELETE CASCADE,
      scores TEXT NOT NULL,
      comparison TEXT,
      ai_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_type TEXT NOT NULL,
      grade_range TEXT NOT NULL,
      knowledge_points TEXT NOT NULL,
      learning_objectives TEXT NOT NULL,
      prerequisites TEXT NOT NULL,
      learning_path TEXT NOT NULL,
      common_mistakes TEXT,
      ai_learning_log TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_type, grade_range)
    );
  `);

  // 迁移：检查并添加缺失的列
  try {
    // questions 表 - 添加 dimension_ids 字段
    const questionColumns = await database.all(`PRAGMA table_info(questions)`);
    const questionColumnNames = questionColumns.map((c: any) => c.name);

    if (!questionColumnNames.includes('dimension_ids')) {
      await database.run(`ALTER TABLE questions ADD COLUMN dimension_ids TEXT`);
      console.log('[DB Migration] Added dimension_ids column to questions');
    }

    // exam_records 表
    const examColumns = await database.all(`PRAGMA table_info(exam_records)`);
    const examColumnNames = examColumns.map((c: any) => c.name);

    if (!examColumnNames.includes('cheat_flags')) {
      await database.run(`ALTER TABLE exam_records ADD COLUMN cheat_flags TEXT`);
      console.log('[DB Migration] Added cheat_flags column to exam_records');
    }
    if (!examColumnNames.includes('tab_switch_count')) {
      await database.run(`ALTER TABLE exam_records ADD COLUMN tab_switch_count INTEGER DEFAULT 0`);
      console.log('[DB Migration] Added tab_switch_count column to exam_records');
    }
    if (!examColumnNames.includes('question_times')) {
      await database.run(`ALTER TABLE exam_records ADD COLUMN question_times TEXT`);
      console.log('[DB Migration] Added question_times column to exam_records');
    }

    // notice_templates 表
    const templateColumns = await database.all(`PRAGMA table_info(notice_templates)`);
    const templateColumnNames = templateColumns.map((c: any) => c.name);

    if (!templateColumnNames.includes('design_config')) {
      await database.run(`ALTER TABLE notice_templates ADD COLUMN design_config TEXT`);
      console.log('[DB Migration] Added design_config column to notice_templates');
    }
    if (!templateColumnNames.includes('preview_image')) {
      await database.run(`ALTER TABLE notice_templates ADD COLUMN preview_image TEXT`);
      console.log('[DB Migration] Added preview_image column to notice_templates');
    }

    // exam_questions 表：添加唯一约束（exam_id, question_id）
    const indexes = await database.all(`PRAGMA index_list(exam_questions)`);
    const hasUniqueConstraint = indexes.some((idx: any) => idx.unique === 1 && idx.name.includes('exam_id'));
    if (!hasUniqueConstraint) {
      try {
        await database.run(`CREATE UNIQUE INDEX idx_exam_question_unique ON exam_questions(exam_id, question_id)`);
        console.log('[DB Migration] Added unique index on exam_questions(exam_id, question_id)');
      } catch (idxErr: any) {
        if (idxErr.message.includes('duplicate')) {
          console.warn('[DB Migration] Duplicate data found in exam_questions, cleaning up...');
          await database.run(`
            DELETE FROM exam_questions
            WHERE id NOT IN (
              SELECT MIN(id)
              FROM exam_questions
              GROUP BY exam_id, question_id
            )
          `);
          await database.run(`CREATE UNIQUE INDEX idx_exam_question_unique ON exam_questions(exam_id, question_id)`);
          console.log('[DB Migration] Cleaned duplicates and added unique index');
        } else if (idxErr.message.includes('already exists')) {
          console.log('[DB Migration] Unique index already exists');
        } else {
          throw idxErr;
        }
      }
    }

    // 迁移：修改 courses 表支持 math 类型
    try {
      const courseColumns = await database.all(`PRAGMA table_info(courses)`);
      const courseTypeCol = courseColumns.find((c: any) => c.name === 'course_type');
      if (courseTypeCol && courseTypeCol.type === 'TEXT') {
        // 检查当前约束是否包含 math
        const currentSql = await database.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='courses'`);
        if (currentSql?.sql && !currentSql.sql.includes("'math'")) {
          console.log('[DB Migration] Rebuilding courses table to support math course_type...');
          await database.exec(`
            BEGIN TRANSACTION;
            ALTER TABLE courses RENAME TO courses_old;
            CREATE TABLE courses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              course_type TEXT NOT NULL CHECK(course_type IN ('aigc', 'scratch', 'python', 'cpp', 'math')),
              grade_range TEXT NOT NULL,
              description TEXT,
              syllabus TEXT,
              target_audience TEXT,
              total_hours INTEGER DEFAULT 0,
              price INTEGER DEFAULT 0,
              status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
              class_mode TEXT DEFAULT 'offline' CHECK(class_mode IN ('online', 'offline')),
              location TEXT DEFAULT '',
              course_objectives TEXT DEFAULT '',
              matching_events TEXT DEFAULT '',
              start_date TEXT DEFAULT '',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO courses SELECT * FROM courses_old;
            DROP TABLE courses_old;
            COMMIT;
          `);
          console.log('[DB Migration] Rebuilt courses table with math support');
        }
      }
    } catch (courseMigrationErr: any) {
      console.error('[DB Migration] Failed to migrate courses table:', courseMigrationErr.message);
    }

    // 迁移：创建默认课程数据（如果课程库为空）
    try {
      const courseCount = await database.get('SELECT COUNT(*) as count FROM courses');
      if (courseCount.count === 0) {
        console.log('[DB Migration] Creating default courses...');
        const defaultCourses = [
          { name: 'Scratch图形化编程入门班', course_type: 'scratch', grade_range: '1-3', description: '通过积木式编程培养编程兴趣和逻辑思维能力', total_hours: 32, price: 2999 },
          { name: 'Scratch图形化编程进阶班', course_type: 'scratch', grade_range: '4-6', description: '深入学习Scratch进阶内容，过渡到代码编程', total_hours: 40, price: 3599 },
          { name: 'Python编程基础班', course_type: 'python', grade_range: '4-6', description: '系统学习Python基础语法和编程思维', total_hours: 48, price: 3999 },
          { name: 'Python编程进阶班', course_type: 'python', grade_range: '7-9', description: '深入学习算法和数据结构，为竞赛打基础', total_hours: 64, price: 4999 },
          { name: 'AIGC素养启蒙班', course_type: 'aigc', grade_range: '1-3', description: '了解AI基本概念，培养AI时代素养', total_hours: 24, price: 2499 },
          { name: 'AIGC素养进阶班', course_type: 'aigc', grade_range: '4-6', description: '掌握提示词技巧，能创作AI作品', total_hours: 40, price: 3599 },
          { name: 'C++算法入门班', course_type: 'cpp', grade_range: '7-9', description: '掌握C++语法基础，理解算法与数据结构', total_hours: 64, price: 4999 },
          { name: '数理逻辑启蒙班', course_type: 'math', grade_range: '1-3', description: '培养数理逻辑思维，为编程学习打基础', total_hours: 32, price: 2999 },
          { name: '数理逻辑进阶班', course_type: 'math', grade_range: '4-6', description: '提升逻辑推理能力，强化数学思维', total_hours: 40, price: 3599 },
        ];
        for (const course of defaultCourses) {
          await database.run(
            `INSERT INTO courses (name, course_type, grade_range, description, total_hours, price, status)
             VALUES (?, ?, ?, ?, ?, ?, 'active')`,
            [course.name, course.course_type, course.grade_range, course.description, course.total_hours, course.price]
          );
        }
        console.log('[DB Migration] Created', defaultCourses.length, 'default courses');
      }
    } catch (courseSeedErr: any) {
      console.error('[DB Migration] Failed to seed default courses:', courseSeedErr.message);
    }

  // 新增表：badges（徽章）
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        category TEXT,
        condition_type TEXT,
        condition_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* 表可能已存在 */ }

  // 新增表：student_badges（学生徽章关联）
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS student_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
        badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, badge_id)
      )
    `);
  } catch (e) { /* 表可能已存在 */ }

  // 新增表：certificates（证书）
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES students_info(id) ON DELETE CASCADE,
        exam_record_id INTEGER REFERENCES exam_records(id) ON DELETE CASCADE,
        course_type TEXT NOT NULL,
        level TEXT NOT NULL,
        issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        certificate_no TEXT UNIQUE,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* 表可能已存在 */ }

  // 新增表：faq_knowledge（问答知识库）
  try {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS faq_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* 表可能已存在 */ }

  // 配置AI API Key到数据库
  try {
    await database.run(
      `INSERT INTO config (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?`,
      ['ai_api_key', 'ak_2oa31m4xU9dg6Yw0Tn8e29QH8uQ5l',
       'ak_2oa31m4xU9dg6Yw0Tn8e29QH8uQ5l']
    );
    console.log('[DB Migration] AI API Key configured in database');
  } catch (aiKeyErr: any) {
    console.error('[DB Migration] Failed to configure AI API Key:', aiKeyErr.message);
  }

  } catch (migrationError: any) {
    console.error('[DB Migration] Error:', migrationError.message);
  }

  return database;
}
