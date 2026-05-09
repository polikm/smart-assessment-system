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
      filename: path.join(__dirname, '..', 'data.sqlite'),
      driver: sqlite3.Database,
    });
    await db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

export async function initDb() {
  const database = await getDb();

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
  `);

  // 迁移：检查并添加缺失的列
  try {
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
  } catch (migrationError: any) {
    console.error('[DB Migration] Error:', migrationError.message);
  }

  return database;
}
