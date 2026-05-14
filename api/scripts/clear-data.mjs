import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clearData() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'data.sqlite');
  console.log('Opening database:', dbPath);
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  await db.run('PRAGMA foreign_keys = ON');

  console.log('\n========== 开始清空数据 ==========');

  // 1. 删除测评记录
  const r1 = await db.run('DELETE FROM exam_records');
  console.log(`[1/12] 删除 exam_records: ${r1.changes} 条`);

  // 2. 删除试卷-题目关联
  const r2 = await db.run('DELETE FROM exam_questions');
  console.log(`[2/12] 删除 exam_questions: ${r2.changes} 条`);

  // 3. 删除通知
  const r3 = await db.run('DELETE FROM notices');
  console.log(`[3/12] 删除 notices: ${r3.changes} 条`);

  // 4. 删除班级-学生关联
  const r4 = await db.run('DELETE FROM class_students');
  console.log(`[4/12] 删除 class_students: ${r4.changes} 条`);

  // 5. 删除学生信息
  const r5 = await db.run("DELETE FROM students_info WHERE user_id IN (SELECT id FROM users WHERE role = 'student')");
  console.log(`[5/12] 删除 students_info: ${r5.changes} 条`);

  // 6. 删除学生用户
  const r6 = await db.run("DELETE FROM users WHERE role = 'student'");
  console.log(`[6/12] 删除 users (student): ${r6.changes} 条`);

  // 7. 删除试卷
  const r7 = await db.run('DELETE FROM exams');
  console.log(`[7/12] 删除 exams: ${r7.changes} 条`);

  // 8. 删除题目
  const r8 = await db.run('DELETE FROM questions');
  console.log(`[8/12] 删除 questions: ${r8.changes} 条`);

  // 9. 删除班级
  const r9 = await db.run('DELETE FROM classes');
  console.log(`[9/12] 删除 classes: ${r9.changes} 条`);

  // 10. 删除课程安排
  const r10 = await db.run('DELETE FROM course_schedules');
  console.log(`[10/12] 删除 course_schedules: ${r10.changes} 条`);

  // 11. 删除课程
  const r11 = await db.run('DELETE FROM courses');
  console.log(`[11/12] 删除 courses: ${r11.changes} 条`);

  // 12. 删除AI日志
  const r12 = await db.run('DELETE FROM ai_usage_logs');
  console.log(`[12/12] 删除 ai_usage_logs: ${r12.changes} 条`);

  // 验证保留的账号
  const adminCount = await db.get("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'");
  const teacherCount = await db.get("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'");
  console.log(`\n保留账号: admin=${adminCount.cnt}, teacher=${teacherCount.cnt}`);

  await db.close();
  console.log('\n========== 数据清空完成 ==========');
}

clearData().catch(err => {
  console.error('清空数据失败:', err);
  process.exit(1);
});
