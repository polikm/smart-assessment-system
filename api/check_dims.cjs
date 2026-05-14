const { Database } = require('../node_modules/better-sqlite3/lib/index.js');
const db = new Database('database.sqlite');

console.log('=== dimension_code 分布 ===');
const codes = db.prepare("SELECT DISTINCT dimension_code, COUNT(*) as cnt FROM questions WHERE status='approved' GROUP BY dimension_code ORDER BY cnt DESC").all();
for (const row of codes) {
  console.log('  ' + row.dimension_code + ': ' + row.cnt + '题');
}

const courses = db.prepare("SELECT DISTINCT course_type FROM questions WHERE status='approved'").all();
console.log('\n=== 课程类型: ' + courses.map(c => c.course_type).join(', ') + ' ===');

const latestExam = db.prepare('SELECT id FROM exams ORDER BY created_at DESC LIMIT 1').get();
if (latestExam) {
  console.log('\n=== 最新试卷 exam_id=' + latestExam.id + ' ===');
  const dims = db.prepare('SELECT q.dimension_code, COUNT(*) as cnt FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = ? GROUP BY q.dimension_code').all(latestExam.id);
  for (const row of dims) {
    console.log('  ' + row.dimension_code + ': ' + row.cnt + '题');
  }
}

// 检查 student_growth_history 最新记录
console.log('\n=== 最新成长历史记录 ===');
const history = db.prepare('SELECT * FROM student_growth_history ORDER BY created_at DESC LIMIT 3').all();
for (const h of history) {
  console.log('  record_id=' + h.id + ', exam_record_id=' + h.exam_record_id + ', scores=' + h.scores);
}

db.close();
