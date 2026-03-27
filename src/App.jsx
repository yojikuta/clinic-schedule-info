import React, { useState, useEffect } from 'react';
import { 
  Calendar, Settings, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, 
  Copy, CheckCircle, AlertCircle, Users, RefreshCw, Link, X, Save,
  CalendarDays, CalendarPlus, Clock, Code, Lock, Megaphone, DownloadCloud
} from 'lucide-react';

// --- 初期データ ---
const initialDoctors = [
  { id: '1', name: '生田', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: '2', name: '宮奈', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: '3', name: '鈴木', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: '4', name: '佐久間', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const initialSchedule = {
  0: { am: { isOpen: false, doctors: [] }, pm: { isOpen: false, doctors: [] } },
  1: { am: { isOpen: true, doctors: ['1'] }, pm: { isOpen: true, doctors: ['1'] } },
  2: { am: { isOpen: true, doctors: ['2'] }, pm: { isOpen: true, doctors: ['2'] } },
  3: { am: { isOpen: true, doctors: ['3'] }, pm: { isOpen: false, doctors: [] } },
  4: { am: { isOpen: true, doctors: ['2'] }, pm: { isOpen: true, doctors: ['2'] } },
  5: { am: { isOpen: true, doctors: ['1'] }, pm: { isOpen: true, doctors: ['1'] } },
  6: { am: { isOpen: false, doctors: [] }, pm: { isOpen: false, doctors: [] } },
};

const initialClinicSettings = {
  amStart: '09:00',
  amEnd: '11:30',
  pmStart: '13:00',
  pmEnd: '17:30'
};

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

const colorOptions = [
  { label: 'ブルー', value: 'bg-blue-100 text-blue-800 border-blue-200' },
  { label: 'グリーン', value: 'bg-green-100 text-green-800 border-green-200' },
  { label: 'パープル', value: 'bg-purple-100 text-purple-800 border-purple-200' },
  { label: 'オレンジ', value: 'bg-orange-100 text-orange-800 border-orange-200' },
  { label: 'ピンク', value: 'bg-pink-100 text-pink-800 border-pink-200' },
  { label: 'グレー', value: 'bg-gray-100 text-gray-800 border-gray-200' },
];

export default function ClinicCalendarApp() {
  // 認証状態
  const [currentPassword, setCurrentPassword] = useState('202004');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('temp'); // 初期タブを臨時予定に変更
  
  // 状態管理
  const [clinicSettings, setClinicSettings] = useState(initialClinicSettings);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [weeklySchedule, setWeeklySchedule] = useState(initialSchedule);
  const [exceptions, setExceptions] = useState([]); // 臨時スケジュール
  const [announcement, setAnnouncement] = useState(''); // 次回配信お知らせ
  const [webhookUrl, setWebhookUrl] = useState('https://script.google.com/macros/s/AKfycbzYTqzyjTpLcYMDD65_iMAs_q-3aw2zhhBa3U2XjcYH7NOGwCAWQMswgGNjyRvUQITo/exec'); // スプレッドシート連携用URL
  const [holidays, setHolidays] = useState({}); // 祝日データ
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // 1. ローカルストレージからの復元（ブラウザを閉じても保存されるようにする）
  useEffect(() => {
    const savedData = localStorage.getItem('clinicCalendarData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.clinicSettings) setClinicSettings(parsed.clinicSettings);
        if (parsed.doctors) setDoctors(parsed.doctors);
        if (parsed.weeklySchedule) setWeeklySchedule(parsed.weeklySchedule);
        if (parsed.exceptions) setExceptions(parsed.exceptions);
        if (parsed.announcement !== undefined) setAnnouncement(parsed.announcement);
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
        if (parsed.currentPassword) setCurrentPassword(parsed.currentPassword);
      } catch (e) {
        console.error("ローカルデータの読み込みに失敗しました", e);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // 2. 状態が変わるたびにローカルストレージに自動保存
  useEffect(() => {
    if (isInitialLoad) return;
    const dataToSave = {
      clinicSettings, doctors, weeklySchedule, exceptions, announcement, webhookUrl, currentPassword
    };
    localStorage.setItem('clinicCalendarData', JSON.stringify(dataToSave));
  }, [clinicSettings, doctors, weeklySchedule, exceptions, announcement, webhookUrl, currentPassword, isInitialLoad]);

  // スプレッドシート（GAS）から最新データを読み込む関数
  const loadFromSpreadsheet = async () => {
    if (!webhookUrl) return;
    setIsFetchingData(true);
    try {
      const res = await fetch(webhookUrl);
      const data = await res.json();
      if (data && !data.error) {
        if (data.clinicSettings) setClinicSettings(data.clinicSettings);
        if (data.doctors) setDoctors(data.doctors);
        if (data.weeklySchedule) setWeeklySchedule(data.weeklySchedule);
        if (data.exceptions) setExceptions(data.exceptions);
        if (data.announcement !== undefined) setAnnouncement(data.announcement);
      }
    } catch (err) {
      console.error('スプレッドシートからのデータ取得に失敗しました', err);
    } finally {
      setIsFetchingData(false);
    }
  };

  // ブラウザのタブ設定 ＆ ライトモードの強制
  useEffect(() => {
    document.title = "外来診療予定＆お知らせ管理";
    
    // OSのダークモード設定に影響されず、常にライトモードのデザインを強制する
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#f9fafb'; // Tailwindの bg-gray-50 に相当
    document.body.style.color = '#1f2937'; // Tailwindの text-gray-800 に相当

    // faviconをカレンダーの絵文字に変更
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📅</text></svg>';
  }, []);

  // 祝日データの取得
  useEffect(() => {
    fetch('https://holidays-jp.github.io/api/v1/date.json')
      .then(res => res.json())
      .then(data => setHolidays(data))
      .catch(err => console.error('祝日データの取得に失敗しました', err));
  }, []);

  // モーダル管理（臨時予定追加・編集）
  const [tempModalConfig, setTempModalConfig] = useState(null);

  // ログイン処理
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === currentPassword) {
      setIsAuthenticated(true);
      setLoginError('');
      loadFromSpreadsheet(); // ログイン成功時にスプレッドシートから最新データを取得
    } else {
      setLoginError('パスワードが間違っています。');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full text-blue-600">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center leading-tight">
            東小金井小児神経・脳神経内科<br/>クリニック<br/>
            <span className="text-base text-gray-500 font-medium mt-2 block">外来診療予定＆お知らせ管理</span>
          </h2>
          
          {loginError && (
            <div className="mb-5 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {loginError}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">パスワード</label>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
              placeholder="パスワードを入力"
              autoFocus
            />
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-700 transition-colors shadow-md tracking-wider">
            ログイン
          </button>
        </form>
      </div>
    );
  }

  // 医師が削除された時、スケジュールからも該当医師のIDを削除する
  const removeDoctorFromSchedules = (doctorId) => {
    const newWeekly = { ...weeklySchedule };
    Object.keys(newWeekly).forEach(day => {
      newWeekly[day].am.doctors = newWeekly[day].am.doctors.filter(id => id !== doctorId);
      newWeekly[day].pm.doctors = newWeekly[day].pm.doctors.filter(id => id !== doctorId);
    });
    setWeeklySchedule(newWeekly);

    setExceptions(prev => prev.map(ex => ({
      ...ex,
      doctors: ex.doctors ? ex.doctors.filter(id => id !== doctorId) : []
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
          <h1 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            東小金井小児神経・脳神経内科クリニック 外来診療予定＆お知らせ管理
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto hide-scrollbar self-start">
            <button
              onClick={() => setActiveTab('temp')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'temp' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarPlus className="w-4 h-4" /> 臨時予定
            </button>
            <button
              onClick={() => setActiveTab('announcement')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'announcement' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Megaphone className="w-4 h-4" /> お知らせ管理
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'preview' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="w-4 h-4" /> プレビュー・連携
            </button>
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === 'basic' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" /> 基本設定
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'temp' && (
          <TempSchedulePanel 
            exceptions={exceptions} setExceptions={setExceptions}
            doctors={doctors} onOpenModal={setTempModalConfig}
          />
        )}
        {activeTab === 'announcement' && (
          <AnnouncementPanel 
            announcement={announcement} setAnnouncement={setAnnouncement}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewAndSyncPanel 
            weeklySchedule={weeklySchedule} exceptions={exceptions} doctors={doctors} clinicSettings={clinicSettings}
            announcement={announcement} holidays={holidays}
            currentDate={currentDate} setCurrentDate={setCurrentDate}
            webhookUrl={webhookUrl} setWebhookUrl={setWebhookUrl}
            onDateClick={(date, time) => setTempModalConfig({ initialDate: date, initialTime: time })}
            onLoadFromSpreadsheet={loadFromSpreadsheet}
          />
        )}
        {activeTab === 'basic' && (
          <BasicSchedulePanel 
            clinicSettings={clinicSettings} setClinicSettings={setClinicSettings}
            weeklySchedule={weeklySchedule} setWeeklySchedule={setWeeklySchedule}
            doctors={doctors} setDoctors={setDoctors} onDeleteDoctor={removeDoctorFromSchedules}
            currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
          />
        )}
      </main>

      {/* 臨時予定モーダル */}
      {tempModalConfig && (
        <TempScheduleModal 
          initialData={tempModalConfig.initialData}
          initialDate={tempModalConfig.initialDate}
          initialTime={tempModalConfig.initialTime}
          exceptions={exceptions} setExceptions={setExceptions}
          doctors={doctors} onClose={() => setTempModalConfig(null)}
        />
      )}

      {/* データ読み込み中オーバーレイ */}
      {isFetchingData && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="font-bold text-gray-700">最新データをスプレッドシートから読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// お知らせ管理パネル
// ==========================================
function AnnouncementPanel({ announcement, setAnnouncement }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" /> 次回配信お知らせ内容
        </h2>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          公式LINEやホームページなどで次回月次配信する際のお知らせ内容を入力してください。ここに入力された内容はスプレッドシートに同期され、自動配信のデータとして活用されます。
        </p>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="（例）〇日よりインフルエンザワクチンの予約を開始します。詳細については当院ホームページをご確認ください..."
          className="w-full h-64 border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 outline-none resize-y bg-white"
        />
      </section>
    </div>
  );
}

// ==========================================
// 1. 基本スケジュール設定パネル（診療時間＋曜日別＋担当医）
// ==========================================
function BasicSchedulePanel({ clinicSettings, setClinicSettings, weeklySchedule, setWeeklySchedule, doctors, setDoctors, onDeleteDoctor, currentPassword, setCurrentPassword }) {
  const [editingSlot, setEditingSlot] = useState(null);

  // パスワード変更用ステート
  const [pwdInput, setPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const handleTimeChange = (e) => {
    setClinicSettings({ ...clinicSettings, [e.target.name]: e.target.value });
  };

  const handleSaveSlot = (isOpen, selectedDoctors) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [editingSlot.day]: {
        ...prev[editingSlot.day],
        [editingSlot.time]: { isOpen, doctors: selectedDoctors }
      }
    }));
    setEditingSlot(null);
  };

  const handlePasswordChange = () => {
    if (pwdInput !== currentPassword) {
      setPwdMessage({ type: 'error', text: '現在のパスワードが間違っています。' });
      return;
    }
    if (!newPwdInput.trim()) {
      setPwdMessage({ type: 'error', text: '新しいパスワードを入力してください。' });
      return;
    }
    setCurrentPassword(newPwdInput);
    setPwdInput('');
    setNewPwdInput('');
    setPwdMessage({ type: 'success', text: 'パスワードを変更しました。' });
    setTimeout(() => setPwdMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 担当医管理セクション */}
      <DoctorsSection doctors={doctors} setDoctors={setDoctors} onDeleteDoctor={onDeleteDoctor} />

      {/* 診療時間設定 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" /> 診療時間の設定
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3">午前</h3>
            <div className="flex items-center gap-3">
              <input type="time" name="amStart" value={clinicSettings.amStart} onChange={handleTimeChange} className="border rounded p-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
              <span className="text-gray-500 font-bold">〜</span>
              <input type="time" name="amEnd" value={clinicSettings.amEnd} onChange={handleTimeChange} className="border rounded p-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3">午後</h3>
            <div className="flex items-center gap-3">
              <input type="time" name="pmStart" value={clinicSettings.pmStart} onChange={handleTimeChange} className="border rounded p-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
              <span className="text-gray-500 font-bold">〜</span>
              <input type="time" name="pmEnd" value={clinicSettings.pmEnd} onChange={handleTimeChange} className="border rounded p-2 flex-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
          </div>
        </div>
      </section>

      {/* 曜日別スケジュール設定 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-2 gap-2">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" /> 曜日別・基本診療スケジュール
          </h2>
          <span className="text-xs font-normal text-gray-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
            表の枠をクリックして担当医を編集
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 border text-gray-600 font-medium w-24">時間帯</th>
                {dayNames.map((day, i) => (
                  <th key={day} className={`p-3 border font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                    {day}曜
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['am', 'pm'].map(time => (
                <tr key={time}>
                  <td className="p-3 border font-medium text-gray-700 bg-gray-50 text-center leading-tight">
                    {time === 'am' ? '午前' : '午後'}
                    <div className="text-[10px] text-gray-500 font-normal mt-1">
                      {time === 'am' ? `${clinicSettings.amStart}-${clinicSettings.amEnd}` : `${clinicSettings.pmStart}-${clinicSettings.pmEnd}`}
                    </div>
                  </td>
                  {Object.keys(weeklySchedule).map(day => {
                    const slot = weeklySchedule[day][time];
                    return (
                      <td key={`${day}-${time}`} 
                          className={`p-2 border cursor-pointer transition-all hover:bg-blue-50 hover:shadow-inner ${slot.isOpen ? 'bg-white' : 'bg-gray-50/50'}`}
                          onClick={() => setEditingSlot({ day, time, isOpen: slot.isOpen, doctors: slot.doctors })}
                      >
                        <div className="flex flex-col items-center gap-2 min-h-[60px] justify-center">
                          <span className={`font-bold ${slot.isOpen ? 'text-blue-600' : 'text-gray-400'}`}>
                            {slot.isOpen ? '◯ 診療' : 'ー 休診'}
                          </span>
                          {slot.isOpen && slot.doctors.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1">
                              {slot.doctors.map(id => {
                                const d = doctors.find(doc => doc.id === id);
                                return d ? <span key={d.id} className={`text-[10px] px-1.5 py-0.5 rounded border ${d.color}`}>{d.name}</span> : null;
                              })}
                            </div>
                          )}
                          {slot.isOpen && slot.doctors.length === 0 && (
                            <span className="text-[10px] text-red-400 border border-red-200 bg-red-50 px-1 rounded">未設定</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* パスワード変更設定 */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" /> 管理画面パスワードの変更
        </h2>
        {pwdMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm border flex items-center gap-2 ${pwdMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
            {pwdMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {pwdMessage.text}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">現在のパスワード</label>
            <input type="password" value={pwdInput} onChange={e => setPwdInput(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">新しいパスワード</label>
            <input type="password" value={newPwdInput} onChange={e => setNewPwdInput(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handlePasswordChange} 
            className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
          >
            パスワードを変更
          </button>
        </div>
      </section>

      {editingSlot && (
        <SlotEditModal 
          slot={editingSlot} doctors={doctors}
          onClose={() => setEditingSlot(null)} onSave={handleSaveSlot}
        />
      )}
    </div>
  );
}

// ==========================================
// 2. 臨時スケジュール設定パネル
// ==========================================
function TempSchedulePanel({ exceptions, setExceptions, doctors, onOpenModal }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-blue-600" /> 臨時休診・担当医変更・臨時診療 の一覧
        </h2>
        
        {exceptions.length === 0 ? (
          <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed">設定されている臨時スケジュールはありません。</p>
        ) : (
          <div className="overflow-x-auto mb-6 border rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 font-medium text-gray-600">日付</th>
                  <th className="p-3 font-medium text-gray-600">種類</th>
                  <th className="p-3 font-medium text-gray-600">時間帯</th>
                  <th className="p-3 font-medium text-gray-600">対象の医師</th>
                  <th className="p-3 font-medium text-gray-600 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exceptions.map(ex => (
                  <tr key={ex.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-800 font-medium">{ex.date}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        ex.type === 'closed' ? 'bg-red-100 text-red-700' : 
                        ex.type === 'change' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {ex.type === 'closed' ? '臨時休診' : ex.type === 'change' ? '担当医変更' : '臨時診療'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {ex.time === 'ALL' ? '終日' : ex.time === 'AM' ? '午前のみ' : '午後のみ'}
                    </td>
                    <td className="p-3">
                      {ex.doctors && ex.doctors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ex.doctors.map(id => {
                            const d = doctors.find(doc => doc.id === id);
                            return d ? <span key={d.id} className={`text-[10px] px-1.5 py-0.5 rounded border ${d.color}`}>{d.name}</span> : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          {ex.type === 'closed' ? 'クリニック全体' : '指定なし'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => onOpenModal({ initialData: ex })} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded mr-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExceptions(prev => prev.filter(e => e.id !== ex.id))} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => onOpenModal({ initialDate: '', initialTime: 'ALL' })}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> 新しい臨時日程を追加
          </button>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// 臨時スケジュール追加・編集モーダル
// ==========================================
function TempScheduleModal({ initialData, initialDate, initialTime, exceptions, setExceptions, doctors, onClose }) {
  const [exFormData, setExFormData] = useState(initialData || {
    id: null, date: initialDate || '', type: 'open', time: initialTime || 'ALL', doctors: []
  });
  const [exFormError, setExFormError] = useState('');

  const handleSaveException = () => {
    setExFormError('');
    if (!exFormData.date) { setExFormError('日付を選択してください。'); return; }

    const isDuplicate = exceptions.some(ex => {
      if (exFormData.id && ex.id === exFormData.id) return false;
      if (ex.date !== exFormData.date) return false;
      if (ex.time === 'ALL' || exFormData.time === 'ALL' || ex.time === exFormData.time) return true;
      return false;
    });

    if (isDuplicate) { setExFormError('この日時の臨時スケジュールは既に設定されています。（二重設定エラー）'); return; }

    const payload = { ...exFormData };
    if (payload.type === 'closed') {
      payload.doctors = []; // 臨時休診の場合は強制的に全体休診（医師指定なし）とする
    }

    if (payload.id) {
      setExceptions(prev => prev.map(ex => ex.id === payload.id ? payload : ex));
    } else {
      setExceptions(prev => [...prev, { ...payload, id: Date.now().toString() }].sort((a, b) => a.date.localeCompare(b.date)));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-blue-600"/> 
            {exFormData.id ? '臨時スケジュールの編集' : '臨時スケジュールの追加'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {exFormError && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {exFormError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日にち</label>
              <input type="date" value={exFormData.date} onChange={e => setExFormData({...exFormData, date: e.target.value})}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">種類</label>
              <select value={exFormData.type} onChange={e => setExFormData({...exFormData, type: e.target.value})}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="open">臨時診療</option>
                <option value="closed">臨時休診</option>
                <option value="change">担当医変更</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">時間帯</label>
              <select value={exFormData.time} onChange={e => setExFormData({...exFormData, time: e.target.value})}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="ALL">終日</option>
                <option value="AM">午前のみ</option>
                <option value="PM">午後のみ</option>
              </select>
            </div>
          </div>

          {(exFormData.type === 'open' || exFormData.type === 'change') && (
            <div className={`p-4 border rounded-lg ${exFormData.type === 'change' ? 'bg-orange-50/50 border-orange-100' : 'bg-green-50/50 border-green-100'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {exFormData.type === 'change' ? '変更後の担当医を選択' : '追加で診療する担当医を選択'}
              </label>
              <p className="text-xs text-gray-500 mb-3">
                ※誰も選択しない場合、「医師指定なし」として扱われます。
              </p>
              <div className="flex flex-wrap gap-3">
                {doctors.map(doc => {
                  const isSelected = exFormData.doctors.includes(doc.id);
                  return (
                    <label key={doc.id} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors bg-white ${isSelected ? 'border-blue-400 ring-1 ring-blue-400' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={isSelected}
                        onChange={(e) => {
                          const newDocs = e.target.checked 
                            ? [...exFormData.doctors, doc.id] 
                            : exFormData.doctors.filter(id => id !== doc.id);
                          setExFormData({...exFormData, doctors: newDocs});
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm px-1.5 py-0.5 border rounded ${doc.color}`}>{doc.name}</span>
                    </label>
                  );
                })}
                {doctors.length === 0 && <span className="text-sm text-red-500">※先に「担当医管理」で医師を追加してください</span>}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border text-gray-700 rounded hover:bg-white text-sm font-medium">キャンセル</button>
          <button onClick={handleSaveException} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium shadow-sm">
            {exFormData.id ? '更新する' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 担当医管理セクション (基本設定パネル内で使用)
// ==========================================
function DoctorsSection({ doctors, setDoctors, onDeleteDoctor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', color: colorOptions[0].value });
  const [deletingId, setDeletingId] = useState(null);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (formData.id) {
      setDoctors(docs => docs.map(d => d.id === formData.id ? formData : d));
    } else {
      setDoctors(docs => [...docs, { ...formData, id: Date.now().toString() }]);
    }
    setFormData({ id: '', name: '', color: colorOptions[0].value });
    setIsEditing(false);
  };

  const handleEdit = (doc) => { setFormData(doc); setIsEditing(true); };
  
  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      setDoctors(docs => docs.filter(d => d.id !== deletingId));
      onDeleteDoctor(deletingId);
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> 担当医の管理</h2>
          <p className="text-gray-600 text-xs mt-1">カレンダーに表示する医師を追加・編集します。</p>
        </div>
        {!isEditing && (
          <button onClick={() => { setFormData({ id: '', name: '', color: colorOptions[0].value }); setIsEditing(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> 医師を追加
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-gray-50 p-5 rounded-lg border border-blue-100 mb-6">
          <h3 className="font-bold text-gray-700 mb-4">{formData.id ? '担当医の編集' : '担当医の追加'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">医師名</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例: 山田 太郎" className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カレンダー表示カラー</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorOptions.map(opt => (
                  <button key={opt.value} onClick={() => setFormData({...formData, color: opt.value})}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${opt.value} ${formData.color === opt.value ? 'ring-2 ring-offset-1 ring-blue-500 shadow-md transform scale-105' : 'opacity-70 hover:opacity-100'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border text-gray-700 rounded-md hover:bg-white text-sm bg-gray-100">キャンセル</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">保存する</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {doctors.map(doc => (
          <div key={doc.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center group hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border ${doc.color}`}>
                {doc.name.charAt(0)}
              </div>
              <span className="font-medium text-gray-800">{doc.name}</span>
            </div>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(doc)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDeleteClick(doc.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {doctors.length === 0 && <p className="text-gray-500 col-span-full">登録されている担当医はいません。</p>}
      </div>

      {/* 削除確認モーダル */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-2">担当医の削除</h3>
              <p className="text-sm text-gray-600">
                この担当医を削除しますか？<br />
                設定済みのスケジュールからも外れます。
              </p>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={cancelDelete} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">キャンセル</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors">削除する</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ==========================================
// 4. プレビュー・連携・埋め込みパネル
// ==========================================
function PreviewAndSyncPanel({ weeklySchedule, exceptions, doctors, clinicSettings, announcement, holidays, currentDate, setCurrentDate, webhookUrl, setWebhookUrl, onDateClick, onLoadFromSpreadsheet }) {
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncError, setSyncError] = useState('');

  // カレンダー計算ロジック
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 日付ステータス計算（特定の医師休診ロジック追加）
  const getDayStatus = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, day).getDay();
    
    // 基本設定をコピー
    let status = {
      am: { isOpen: weeklySchedule[dayOfWeek].am.isOpen, type: 'regular', docs: [...weeklySchedule[dayOfWeek].am.doctors] },
      pm: { isOpen: weeklySchedule[dayOfWeek].pm.isOpen, type: 'regular', docs: [...weeklySchedule[dayOfWeek].pm.doctors] }
    };

    // 祝日判定 (デフォルトで終日休診とする)
    if (holidays[dateStr]) {
      status.am = { isOpen: false, type: 'holiday', docs: [], holidayName: holidays[dateStr] };
      status.pm = { isOpen: false, type: 'holiday', docs: [], holidayName: holidays[dateStr] };
    }

    const dayExceptions = exceptions.filter(ex => ex.date === dateStr);
    
    dayExceptions.forEach(ex => {
      const isAm = ex.time === 'ALL' || ex.time === 'AM';
      const isPm = ex.time === 'ALL' || ex.time === 'PM';

      if (ex.type === 'closed') {
        // 休診処理
        const processClose = (period) => {
          if (ex.doctors && ex.doctors.length > 0) {
            // 特定の医師が休診 -> その枠の担当医から除外する
            status[period].docs = status[period].docs.filter(id => !ex.doctors.includes(id));
            if (status[period].docs.length === 0 && status[period].isOpen) {
              // 担当医が誰もいなくなったら休診扱い
              status[period].isOpen = false;
              status[period].type = 'temp_closed';
            }
          } else {
            // 医師指定なし -> 全体休診
            status[period] = { isOpen: false, type: 'temp_closed', docs: [] };
          }
        };
        if (isAm) processClose('am');
        if (isPm) processClose('pm');

      } else if (ex.type === 'open' || ex.type === 'change') {
        // 診療・担当医変更処理
        const processOpen = (period) => {
          status[period] = { isOpen: true, type: ex.type === 'change' ? 'temp_change' : 'temp_open', docs: ex.doctors || [] };
        };
        if (isAm) processOpen('am');
        if (isPm) processOpen('pm');
      }
    });

    return status;
  };

  const renderSlot = (slotInfo) => {
    if (!slotInfo.isOpen) {
      if (slotInfo.type === 'temp_closed') {
        return <div className="text-red-600 font-bold text-[10px] bg-red-100 px-1 py-0.5 rounded text-center">臨時休診</div>;
      }
      if (slotInfo.type === 'holiday') {
        return <div className="text-red-500 font-bold text-[10px] bg-red-50 px-1 py-0.5 rounded text-center">祝日休診</div>;
      }
      return <div className="text-gray-400 text-center font-bold">ー</div>;
    }

    let statusLabel = '';
    let textColor = 'text-blue-500';
    if (slotInfo.type === 'temp_open') {
      statusLabel = '(臨時)';
      textColor = 'text-green-600';
    } else if (slotInfo.type === 'temp_change') {
      statusLabel = '(変更)';
      textColor = 'text-orange-500';
    }

    return (
      <div className="flex flex-col gap-0.5 mt-0.5">
        <div className={`font-bold text-center leading-none ${textColor}`}>
          ◯ <span className="text-[10px] font-normal">{statusLabel}</span>
        </div>
        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
          {slotInfo.docs.map(id => {
            const d = doctors.find(doc => doc.id === id);
            return d ? <span key={d.id} className={`text-[9px] px-1 py-0.5 rounded border leading-none truncate max-w-full ${d.color}`}>{d.name}</span> : null;
          })}
        </div>
      </div>
    );
  };

  const embedCode = `<div id="clinic-calendar-widget" data-calendar-id="demo" data-limit-months="3"></div>\n<script src="${window.location.origin}/calendar-embed.js"></script>`;
  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(embedCode);
      setCopied(true); setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = embedCode; document.body.appendChild(textArea);
      textArea.select(); document.execCommand('copy'); document.body.removeChild(textArea);
      setCopied(true); setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSyncToSpreadsheet = async () => {
    if (!webhookUrl) {
      setSyncError('Webhook URLを入力してください。');
      setTimeout(() => setSyncError(''), 3000);
      return;
    }
    setSyncError('');
    setIsSyncing(true);

    // スプレッドシートに送信するカレンダーデータをひとまとめにする
    const payload = {
      clinicSettings,
      doctors,
      weeklySchedule,
      exceptions,
      announcement
    };

    try {
      // 実際にGASのWebhookURLへデータをPOST送信する
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          // GASのCORS（セキュリティ制限）を回避するために text/plain で送信
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      } else {
        setSyncError('同期エラー: ' + (result.message || '不明なエラー'));
      }
    } catch (error) {
      console.error(error);
      setSyncError('通信に失敗しました。設定を確認してください。');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      
      {/* カレンダープレビュー */}
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 bg-gray-50 px-4 py-2 rounded-lg border flex items-center gap-2">
              <Calendar className="w-5 h-5" /> {year}年 {month + 1}月
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 border rounded hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <button onClick={nextMonth} className="p-2 border rounded hover:bg-gray-100"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
          </div>
          <div className="text-xs text-blue-600 mb-4 font-medium bg-blue-50 p-2.5 rounded border border-blue-100 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 flex-shrink-0" />
            日付枠をクリックすると、その日の臨時休診や担当医変更を直接設定できます。
          </div>

          <div className="grid grid-cols-7 border-t border-l bg-white">
            {dayNames.map((day, i) => (
              <div key={day} className={`p-2 text-center border-b border-r font-bold text-sm ${i === 0 ? 'text-red-500 bg-red-50/50' : i === 6 ? 'text-blue-500 bg-blue-50/50' : 'text-gray-700 bg-gray-50'}`}>
                {day}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 border-b border-r bg-gray-50/30 min-h-[120px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              const dayOfWeek = new Date(year, month, day).getDay();
              const hasTemp = status.am.type.startsWith('temp') || status.pm.type.startsWith('temp');
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isHoliday = !!holidays[dateStr];
              
              return (
                <div 
                  key={day} 
                  className={`p-1 border-b border-r min-h-[120px] flex flex-col transition-colors ${hasTemp ? 'bg-yellow-50/30' : isHoliday ? 'bg-red-50/20' : ''}`}
                >
                  <div 
                    onClick={() => onDateClick(dateStr, 'ALL')}
                    className={`flex justify-between items-center text-xs mb-1 px-1 cursor-pointer hover:bg-blue-100 hover:text-blue-800 rounded transition-colors ${dayOfWeek === 0 || isHoliday ? 'text-red-500 font-bold' : dayOfWeek === 6 ? 'text-blue-500 font-bold' : 'text-gray-700 font-bold'}`}>
                    <span className="text-[9px] truncate max-w-[70%] text-red-400 font-normal">{isHoliday ? holidays[dateStr] : ''}</span>
                    <span>{day}</span>
                  </div>
                  <div className="flex-grow flex flex-col gap-0.5">
                    <div 
                      onClick={() => onDateClick(dateStr, 'AM')}
                      className="flex-1 bg-gray-50/80 rounded p-1 flex flex-col cursor-pointer hover:bg-blue-100 hover:shadow-inner transition-all">
                      <span className="text-[10px] text-gray-500 mb-0.5 font-medium flex justify-between">
                        <span>午前</span> <span className="text-[9px] text-gray-400">{clinicSettings.amStart}-{clinicSettings.amEnd}</span>
                      </span>
                      {renderSlot(status.am)}
                    </div>
                    <div 
                      onClick={() => onDateClick(dateStr, 'PM')}
                      className="flex-1 bg-gray-50/80 rounded p-1 flex flex-col cursor-pointer hover:bg-blue-100 hover:shadow-inner transition-all">
                      <span className="text-[10px] text-gray-500 mb-0.5 font-medium flex justify-between">
                        <span>午後</span> <span className="text-[9px] text-gray-400">{clinicSettings.pmStart}-{clinicSettings.pmEnd}</span>
                      </span>
                      {renderSlot(status.pm)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 右側: 連携と埋め込み */}
      <div className="space-y-6">
        {/* Googleスプレッドシート連携 */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-green-200 bg-gradient-to-br from-white to-green-50/30">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-green-100 pb-2 flex items-center gap-2">
            <Link className="w-5 h-5 text-green-600" /> スプレッドシート同期
          </h2>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            スケジュールをスプレッドシートに出力（保存）、または最新データを読み込みます。
          </p>
          {syncError && (
            <div className="mb-3 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded text-xs border border-red-200">
              <AlertCircle className="w-3.5 h-3.5" /> {syncError}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <input type="url" placeholder="https://script.google.com/macros/s/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white" />
            <div className="flex gap-2">
              <button onClick={handleSyncToSpreadsheet} disabled={isSyncing}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white text-sm font-medium transition-all ${syncSuccess ? 'bg-green-600' : isSyncing ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700 shadow-sm'}`}>
                {syncSuccess ? <><CheckCircle className="w-4 h-4"/> 保存完了！</> : isSyncing ? <><RefreshCw className="w-4 h-4 animate-spin"/> 送信中...</> : <><Save className="w-4 h-4"/> シートへ保存</>}
              </button>
              <button onClick={onLoadFromSpreadsheet} disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-green-600 text-green-700 bg-white rounded-lg text-sm font-medium hover:bg-green-50 transition-all shadow-sm">
                <DownloadCloud className="w-4 h-4"/> シートから読込
              </button>
            </div>
          </div>
        </section>

        {/* HP埋め込みコード */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Code className="w-5 h-5 text-gray-600" /> HP埋め込みコード
          </h2>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            このコードをコピーして、HP内の表示したい場所に貼り付けてください。設定内容は自動で反映されます。<br/>
            <span className="inline-block mt-2 px-2 py-1.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-medium">
              ※ <code className="font-mono bg-white px-1 rounded">data-limit-months="3"</code> の指定により、ホームページ上では「当月・来月・再来月」の3ヶ月間のみ閲覧可能になります。
            </span>
          </p>
          <div className="relative group">
            <pre className="bg-slate-800 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto break-all whitespace-pre-wrap font-mono leading-tight">
              {embedCode}
            </pre>
            <button onClick={handleCopyCode} className={`absolute top-2 right-2 px-2.5 py-1.5 rounded flex items-center gap-1 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {copied ? <><CheckCircle className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">完了</span></> : <><Copy className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">コピー</span></>}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// 基本スケジュールの枠設定モーダル (変更なし)
function SlotEditModal({ slot, doctors, onClose, onSave }) {
  const [isOpen, setIsOpen] = useState(slot.isOpen);
  const [selectedDocs, setSelectedDocs] = useState(slot.doctors || []);
  const toggleDoc = (id) => setSelectedDocs(prev => prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">{dayNames[slot.day]}曜 {slot.time === 'am' ? '午前' : '午後'} の設定</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">診療ステータス</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${isOpen ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                <input type="radio" checked={isOpen} onChange={() => setIsOpen(true)} className="hidden"/> <span className="font-bold text-lg">◯</span> 診療あり
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${!isOpen ? 'bg-gray-100 border-gray-400 text-gray-700' : 'hover:bg-gray-50'}`}>
                <input type="radio" checked={!isOpen} onChange={() => setIsOpen(false)} className="hidden"/> <span className="font-bold text-lg text-gray-400">ー</span> 休診
              </label>
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="block text-sm font-bold text-gray-700 mb-3">担当医の割り当て</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {doctors.map(doc => {
                const checked = selectedDocs.includes(doc.id);
                return (
                  <label key={doc.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${checked ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleDoc(doc.id)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                    <span className={`text-sm px-2 py-1 border rounded font-medium ${doc.color}`}>{doc.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">キャンセル</button>
          <button onClick={() => onSave(isOpen, isOpen ? selectedDocs : [])} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm">設定を保存</button>
        </div>
      </div>
    </div>
  );
}