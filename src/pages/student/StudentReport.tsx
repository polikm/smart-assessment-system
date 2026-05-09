import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { studentApi } from '../../api/client';
import ReportDetail from '../../components/ReportDetail';
import InfoRequiredModal from '../../components/InfoRequiredModal';

export default function StudentReport() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [infoComplete, setInfoComplete] = useState(false);

  useEffect(() => {
    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
    try {
      const currentStudent = await studentApi.me();
      const complete = !!(currentStudent?.name && currentStudent?.gender && currentStudent?.grade && currentStudent?.school);
      setInfoComplete(complete);

      if (complete && currentStudent) {
        const recordsData = await studentApi.records(currentStudent.id);
        setRecords(recordsData);
        if (recordsData.length > 0) {
          setSelectedRecord(recordsData[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!infoComplete) {
    return <InfoRequiredModal />;
  }

  if (records.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="mx-auto text-slate-300 mb-4 text-5xl">📚</div>
        <h2 className="text-xl font-bold text-slate-700">暂无测评记录</h2>
        <p className="text-slate-500 mt-2">请先完成一次测评，即可查看详细报告</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-800">测评报告</h1>
        <select
          value={selectedRecord?.id || ''}
          onChange={(e) => {
            const record = records.find((r) => r.id === parseInt(e.target.value));
            setSelectedRecord(record);
          }}
          className="input-field w-auto"
        >
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              {record.exam_name} - {record.score}分
            </option>
          ))}
        </select>
      </div>

      {selectedRecord && (
        <ReportDetail record={selectedRecord} showShareActions={true} />
      )}
    </div>
  );
}
