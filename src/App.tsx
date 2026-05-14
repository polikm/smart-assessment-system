import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentHome from './pages/student/StudentHome';
import StudentInfo from './pages/student/StudentInfo';
import StudentProfile from './pages/student/StudentProfile';
import StudentBaseInfo from './pages/student/StudentBaseInfo';
import StudentExam from './pages/student/StudentExam';
import StudentExamTaking from './pages/student/StudentExamTaking';
import StudentReport from './pages/student/StudentReport';
import StudentNotices from './pages/student/StudentNotices';
import ExamLoading from './pages/student/ExamLoading';
import AnalysisLoading from './pages/student/AnalysisLoading';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherClass from './pages/teacher/TeacherClass';
import TeacherReport from './pages/teacher/TeacherReport';
import TeacherNotice from './pages/teacher/TeacherNotice';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherExam from './pages/teacher/TeacherExam';
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminConfig from './pages/admin/AdminConfig';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminStudents from './pages/admin/AdminStudents';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAIConfig from './pages/admin/AdminAIConfig';
import AdminExams from './pages/admin/AdminExams';
import AdminExamConfig from './pages/admin/AdminExamConfig';
import AdminExamRecords from './pages/admin/AdminExamRecords';
import AdminClasses from './pages/admin/AdminClasses';
import AdminNotices from './pages/admin/AdminNotices';
import AdminClassDetail from './pages/admin/AdminClassDetail';
import AdminCertificates from './pages/admin/AdminCertificates';
// import AdminKnowledgeBase from './pages/admin/AdminKnowledgeBase'; // 已合并到智能体管理
import StudentGrowth from './pages/student/StudentGrowth';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated, isLoading, initAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    initAuth().then(() => {
      if (mounted) setInitialized(true);
    });
    return () => { mounted = false; };
  }, []);

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/info"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/base-info"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentBaseInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam-loading"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamLoading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam-taking"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentExamTaking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/analysis-loading"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AnalysisLoading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/report"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentNotices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/growth"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentGrowth />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/class"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/report"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/notice"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherNotice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/exam"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherExam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ai-config"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAIConfig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminExams />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/exam-config" element={<Navigate to="/admin/exams" replace />} />
        <Route path="/admin/exam-records" element={<Navigate to="/admin/exams" replace />} />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminClassDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminNotices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/certificates"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminCertificates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/knowledge-base"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Navigate to="/admin/ai-config" replace />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
