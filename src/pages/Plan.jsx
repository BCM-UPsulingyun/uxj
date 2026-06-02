import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Plan.css';

// --- 零依赖SVG图标库 ---
const Icon = ({ name, size = 18, className = '' }) => {
  const paths = {
    check: <polyline points="20 6 9 17 4 12" />,
    circle: <circle cx="12" cy="12" r="10" />,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
    flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.333.666.666 1.333.9 2.8z" />,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
    sun: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
  };
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

// --- 工具函数 ---
const getToday = () => new Date().toISOString().split('T')[0];
const getDaysDiff = (date) => Math.ceil((new Date(date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 864e5);
const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const PRIORITY_WEIGHT = { urgent: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_LABELS = { urgent: 'A级', high: 'B级', medium: 'C级', low: 'D级' };
const DEFAULT_CATEGORIES = ['学习', '工作', '生活', '健康', '社交'];
const STORAGE_KEYS = { tasks: 'ph_tasks_v4', habits: 'ph_habits_v4', categories: 'ph_cats_v4', schedule: 'ph_schedule_v4' };
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

const Plan = () => {
  // --- State ---
  const [tasks, setTasks] = useState(() => load(STORAGE_KEYS.tasks, []));
  const [habits, setHabits] = useState(() => load(STORAGE_KEYS.habits, []));
  const [categories, setCategories] = useState(() => load(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
  const [schedule, setSchedule] = useState(() => load(STORAGE_KEYS.schedule, {})); 
  
  const [view, setView] = useState('list'); 
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('全部');
  const [form, setForm] = useState({ text: '', priority: 'medium', category: '学习', dueDate: getToday() });
  const [subInputs, setSubInputs] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});

  const [activeHabitId, setActiveHabitId] = useState(null);
  const [habitRange, setHabitRange] = useState('周');
  const [habitBaseDate, setHabitBaseDate] = useState(getToday());
  
  const [scheduleDate, setScheduleDate] = useState(getToday());
  const [scheduleForm, setScheduleForm] = useState({ time: '09:00', text: '', type: 'focus' });

  const [modal, setModal] = useState(null);
  const [modalForm, setModalForm] = useState({});

  // --- Effects ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule)); }, [schedule]);
  
  useEffect(() => {
    if (!activeHabitId && habits.length > 0) setActiveHabitId(habits[0].id);
  }, [habits, activeHabitId]);

  const tags = useMemo(() => ['全部', ...new Set([...categories, ...tasks.flatMap(t => t.tags || [])])], [tasks, categories]);
  
  // --- 任务逻辑 ---
  const filtered = useMemo(() => {
    return tasks
      .filter(t => t.text.toLowerCase().includes(search.toLowerCase()) && (tagFilter === '全部' || t.tags?.includes(tagFilter)))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const pDiff = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
        if (pDiff !== 0) return pDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, search, tagFilter]);

  const addTask = (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setTasks(prev => [{ id: Date.now().toString(), ...form, completed: false, subtasks: [], tags: [form.category] }, ...prev]);
    setForm(f => ({ ...f, text: '', dueDate: getToday() }));
  };

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  
  const addSub = (taskId) => {
    const text = subInputs[taskId]?.trim();
    if (!text) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), { id: Date.now().toString(), text, done: false, priority: 'medium', dueDate: t.dueDate }] } : t));
    setSubInputs(p => ({ ...p, [taskId]: '' }));
  };

  const toggleSub = (tid, sid) => setTasks(prev => prev.map(t => t.id === tid ? { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) } : t));
  const updateSub = (tid, sid, updates) => setTasks(prev => prev.map(t => t.id === tid ? { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, ...updates } : s) } : t));

  // --- 习惯逻辑 ---
  const logHabit = (id, date, amount) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const hist = { ...h.history };
      hist[date] = Number(amount);
      return { ...h, history: hist };
    }));
    setModal(null);
  };

  const quickLog = (habit) => {
    const today = getToday();
    const current = habit.history[today] || 0;
    const increment = ['分钟', '小时'].includes(habit.unit) ? 30 : 1;
    logHabit(habit.id, today, current + increment);
  };

  const getChartData = (habit, range, baseDateStr) => {
    if (!habit) return [];
    const base = new Date(baseDateStr);
    const days = [];

    if (range === '周') {
      const dayOfWeek = base.getDay() || 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - dayOfWeek + 1);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = formatDate(d);
        days.push({
          label: ['周一','周二','周三','周四','周五','周六','周日'][i],
          value: habit.history[dateStr] || 0,
          date: dateStr
        });
      }
    } else if (range === '月') {
      const year = base.getFullYear();
      const month = base.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      
      for (let i = 1; i <= lastDay; i++) {
        const d = new Date(year, month, i);
        const dateStr = formatDate(d);
        days.push({
          label: `${i}日`,
          value: habit.history[dateStr] || 0,
          date: dateStr
        });
      }
    } else if (range === '年') {
      const year = base.getFullYear();
      for (let i = 0; i < 12; i++) {
        const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
        let total = 0;
        Object.entries(habit.history).forEach(([k, v]) => {
          if (k.startsWith(monthStr)) total += Number(v);
        });
        days.push({
          label: `${i + 1}月`,
          value: total,
          date: monthStr
        });
      }
    }
    return days;
  };

  // --- 行程逻辑 ---
  const addScheduleItem = (e) => {
    e.preventDefault();
    if(!scheduleForm.text.trim()) return;
    const newItem = { id: Date.now().toString(), ...scheduleForm };
    setSchedule(prev => {
      const dayList = prev[scheduleDate] || [];
      const newList = [...dayList, newItem].sort((a,b) => a.time.localeCompare(b.time));
      return { ...prev, [scheduleDate]: newList };
    });
    setScheduleForm(f => ({ ...f, text: '' }));
  };

  const removeScheduleItem = (itemId) => {
    setSchedule(prev => ({
      ...prev,
      [scheduleDate]: (prev[scheduleDate] || []).filter(i => i.id !== itemId)
    }));
  };

  // --- 通用操作 ---
  const handleDelete = () => {
    if (!modal?.payload) return;
    const { type, id } = modal.payload;
    if (type === 'task') setTasks(p => p.filter(t => t.id !== id));
    if (type === 'habit') {
      setHabits(p => p.filter(h => h.id !== id));
      if (activeHabitId === id) setActiveHabitId(null);
    }
    if (type === 'category') setCategories(p => p.filter(c => c !== id));
    setModal(null);
  };

  const handleCreate = () => {
    if (modal?.type === 'habit' && modalForm.name?.trim()) {
      const newHabit = { id: Date.now().toString(), name: modalForm.name, unit: modalForm.unit || '次', history: {} };
      setHabits(p => [...p, newHabit]);
      setActiveHabitId(newHabit.id);
    }
    if (modal?.type === 'category' && modalForm.name?.trim()) {
      if (!categories.includes(modalForm.name.trim())) setCategories(p => [...p, modalForm.name.trim()]);
    }
    if (modal?.type === 'habitLog') {
      logHabit(modal.payload.id, modal.payload.date, modalForm.amount);
      return;
    }
    if (modal?.type === 'subEdit') {
      updateSub(modal.payload.tid, modal.payload.sid, { priority: modalForm.priority, dueDate: modalForm.dueDate });
    }
    setModal(null);
    setModalForm({});
  };

  // --- 渲染：计划列表 ---
  const renderListView = () => (
    <>
      <div className="ph-controls">
        <div className="ph-search-wrap">
          <Icon name="search" />
          <input placeholder="搜索计划..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ph-tag-scroll">
          {tags.map(t => {
            const canDelete = t !== '全部' && !DEFAULT_CATEGORIES.includes(t);
            return (
              <button 
                key={t} 
                className={`ph-tag-item ${tagFilter === t ? 'active' : ''}`} 
                onClick={() => setTagFilter(t)}
              >
                <span>{t}</span>
                {canDelete && (
                  <span 
                    className="ph-tag-del-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ type: 'delete', payload: { type: 'category', id: t } });
                    }}
                  >
                    <Icon name="x" size={10} />
                  </span>
                )}
              </button>
            );
          })}
          <button className="ph-tag-add-btn" onClick={() => { setModalForm({}); setModal({ type: 'category' }); }}>
            <Icon name="plus" size={12} /> 分类
          </button>
        </div>
      </div>

      <form onSubmit={addTask} className="ph-add-form">
        <input placeholder="请输入计划的内容..." value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
          <option value="urgent">A级</option><option value="high">B级</option>
          <option value="medium">C级</option><option value="low">D级</option>
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit"><Icon name="plus" size={22} /></button>
      </form>

      <ul className="ph-task-list">
        {filtered.map(t => {
          const prog = t.subtasks?.length ? Math.round(t.subtasks.filter(s => s.done).length / t.subtasks.length * 100) : 0;
          const dl = getDaysDiff(t.dueDate);
          const urgent = !t.completed && dl >= 0 && dl <= 3;
          const isExpanded = expandedSubs[t.id];
          return (
            <li key={t.id} className={`ph-task-item ${t.completed ? 'completed' : ''} ${urgent ? 'urgent' : ''}`}>
              <div className="ph-task-row" onClick={() => toggleTask(t.id)}>
                <span className={`ph-ico ${t.completed ? 'checked' : ''}`}>
                  {t.completed ? <Icon name="check" /> : <Icon name="circle" />}
                </span>
                <div className="ph-task-body">
                  <span className="ph-task-text">{t.text}</span>
                  <div className="ph-task-tags">
                    <span className={`ph-pri ph-pri-${t.priority}`}>{PRIORITY_LABELS[t.priority]}</span>
                    <span className={`ph-due ${urgent ? 'urgent-txt' : ''}`}>
                      <Icon name="clock" size={12} />{t.dueDate} {dl >= 0 && !t.completed && `(${dl === 0 ? '今天' : dl + '天后'})`}
                    </span>
                    {t.tags?.map(tg => <span key={tg} className="ph-tag">{tg}</span>)}
                  </div>
                </div>
                <button className="ph-expand-btn" onClick={(e) => { e.stopPropagation(); setExpandedSubs(p => ({ ...p, [t.id]: !p[t.id] })); }}>
                  <Icon name="chevronDown" size={16} />
                  {t.subtasks?.length > 0 && <span className="ph-sub-count">{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length}</span>}
                </button>
                <button className="ph-del-btn" onClick={(e) => { e.stopPropagation(); setModal({ type: 'delete', payload: { type: 'task', id: t.id } }); }}>
                  <Icon name="trash" />
                </button>
              </div>
              
              <div className={`ph-sub-section ${isExpanded ? 'expanded' : ''}`}>
                {t.subtasks?.length > 0 && <>
                  <div className="ph-prog-bar"><div className="ph-prog-fill" style={{ width: `${prog}%` }} /></div>
                  {t.subtasks.map(s => (
                    <div key={s.id} className={`ph-sub-item ${s.done ? 'done' : ''}`}>
                      <span className="ph-sub-check" onClick={(e) => { e.stopPropagation(); toggleSub(t.id, s.id); }}>
                        {s.done ? <Icon name="check" size={14} /> : <Icon name="circle" size={14} />}
                      </span>
                      <span className={`ph-sub-text ${s.done ? 'ph-done-text' : ''}`} onClick={(e) => { e.stopPropagation(); toggleSub(t.id, s.id); }}>{s.text}</span>
                      <button className="ph-edit-sub-btn" onClick={(e) => {
                        e.stopPropagation();
                        setModalForm({ priority: s.priority, dueDate: s.dueDate });
                        setModal({ type: 'subEdit', payload: { tid: t.id, sid: s.id } });
                      }}><Icon name="edit" size={12} /></button>
                    </div>
                  ))}
                </>}
                <div className="ph-sub-add-row">
                  <input className="ph-sub-input" placeholder="+ 子任务 (Enter)" value={subInputs[t.id] || ''} onChange={e => setSubInputs(p => ({ ...p, [t.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addSub(t.id)} onClick={e => e.stopPropagation()} />
                </div>
              </div>
            </li>
          );
        })}
        {!filtered.length && <div className="ph-empty-hint-box"><Icon name="list" size={32} /><p>暂无计划</p></div>}
      </ul>
    </>
  );

  // --- 渲染：习惯追踪 ---
  const renderHabitsView = () => {
    const activeHabit = habits.find(h => h.id === activeHabitId);
    
    if (habits.length === 0) return (
      <div className="ph-empty-hint-box">
        <Icon name="flame" size={32} />
        <p>还没有任何习惯，开始创建一个吧</p>
        <button onClick={() => { setModalForm({ unit: '次' }); setModal({ type: 'habit' }); }}>创建习惯</button>
      </div>
    );

    const chartData = activeHabit ? getChartData(activeHabit, habitRange, habitBaseDate) : [];
    const maxVal = Math.max(...chartData.map(d => d.value), 1);
    const today = getToday();
    const todayLogged = activeHabit?.history[today] || 0;
    const yLabels = [maxVal, Math.round(maxVal*0.66), Math.round(maxVal*0.33), 0];

    return (
      <div className="ph-habits-wrapper">
        {/* 习惯选择器 */}
        <div className="ph-habit-selector">
          {habits.map(h => (
            <button 
              key={h.id} 
              className={`ph-habit-tab ${activeHabitId === h.id ? 'active' : ''}`}
              onClick={() => setActiveHabitId(h.id)}
            >
              {h.name}
            </button>
          ))}
          <button className="ph-habit-tab add" onClick={() => { setModalForm({ unit: '次' }); setModal({ type: 'habit' }); }}>
            <Icon name="plus" size={14} />
          </button>
        </div>

        {activeHabit && (
          <div className="ph-habit-card">
            <div className="ph-section-head">
              <div className="ph-habit-title-group">
                <h3>{activeHabit.name} · {habitRange}视图</h3>
                <span className="ph-habit-unit-badge">{activeHabit.unit}</span>
              </div>
              <div className="ph-habit-header-actions">
                <input 
                  type="date" 
                  value={habitBaseDate}
                  onChange={(e) => setHabitBaseDate(e.target.value)}
                  className="ph-habit-date-picker"
                />
                <div className="ph-view-switcher">
                  {['周','月','年'].map(tab => (
                    <button 
                      key={tab}
                      className={habitRange === tab ? 'active' : ''}
                      onClick={() => setHabitRange(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 今日快捷打卡区 */}
            <div className="ph-habit-today-bar">
              <div className="ph-today-info">
                <Icon name="target" size={16} />
                <span>今日已记录: <strong>{todayLogged}</strong> {activeHabit.unit}</span>
              </div>
              <div className="ph-today-actions">
                <button className="ph-btn-log" onClick={() => quickLog(activeHabit)}>
                  <Icon name="plus" size={14} /> 快捷打卡
                </button>
                <button className="ph-btn-log outline" onClick={() => {
                  setModalForm({ amount: '' });
                  setModal({ type: 'habitLog', payload: { id: activeHabit.id, date: today, unit: activeHabit.unit } });
                }}>
                  <Icon name="edit" size={14} /> 精确记录
                </button>
              </div>
            </div>

            {/* 图表区域 */}
            <div className="ph-chart">
              <div className="ph-chart-y-axis">
                {yLabels.map((val, i) => (
                  <div key={i} className="ph-y-label">{val}{activeHabit.unit === '分钟' ? 'm' : activeHabit.unit === '小时' ? 'h' : ''}</div>
                ))}
              </div>
              <div className="ph-chart-bars">
                {chartData.map((day, idx) => (
                  <div key={idx} className="ph-bar-item">
                    <div 
                      className={`ph-bar ${day.date === today ? 'today' : ''}`}
                      style={{ height: `${Math.max((day.value / maxVal) * 100, day.value > 0 ? 2 : 0)}%` }}
                      data-value={`${day.value}${activeHabit.unit}`}
                      onClick={() => {
                        setModalForm({ amount: day.value || '' });
                        setModal({ type: 'habitLog', payload: { id: activeHabit.id, date: day.date, unit: activeHabit.unit } });
                      }}
                    />
                    <div className="ph-bar-label">{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部操作 */}
            <div className="ph-habit-card-footer">
              <button className="ph-del-sm" onClick={() => setModal({ type: 'delete', payload: { type: 'habit', id: activeHabit.id } })}>
                <Icon name="trash" size={14} /> 删除此习惯
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- 渲染：每日行程 (时间轴) ---
  const renderScheduleView = () => {
    const items = schedule[scheduleDate] || [];
    
    return (
      <div className="ph-schedule-wrapper">
        <div className="ph-section-head">
          <h3>☀️ 每日行程</h3>
          <input 
            type="date" 
            value={scheduleDate} 
            onChange={e => setScheduleDate(e.target.value)} 
            className="ph-schedule-date-picker"
          />
        </div>

        <form onSubmit={addScheduleItem} className="ph-schedule-add-form">
          <input type="time" value={scheduleForm.time} onChange={e => setScheduleForm(f => ({...f, time: e.target.value}))} required />
          <select value={scheduleForm.type} onChange={e => setScheduleForm(f => ({...f, type: e.target.value}))}>
            <option value="focus">🎯专注</option>
            <option value="rest">☕休息</option>
            <option value="meeting">🤝会议</option>
            <option value="travel">🚗出行</option>
            <option value="other">📌其他</option>
          </select>
          <input placeholder="请输入行程内容..." value={scheduleForm.text} onChange={e => setScheduleForm(f => ({...f, text: e.target.value}))} />
          <button type="submit"><Icon name="plus" /></button>
        </form>

        <div className="ph-timeline">
          {items.length === 0 && <div className="ph-timeline-empty">当天暂无安排，享受空闲或添加计划吧 ✨</div>}
          {items.map((item) => (
            <div key={item.id} className={`ph-timeline-item type-${item.type}`}>
              <div className="ph-tl-time">{item.time}</div>
              <div className="ph-tl-dot" />
              <div className="ph-tl-content">
                <span className="ph-tl-type-badge">{
                  {focus:'专注', rest:'休息', meeting:'会议', travel:'出行', other:'其他'}[item.type]
                }</span>
                <span className="ph-tl-text">{item.text}</span>
              </div>
              <button className="ph-tl-del" onClick={() => removeScheduleItem(item.id)}><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="ph-container">
      <header className="ph-header">
        <h1>🌿计划</h1>
        <nav className="ph-nav-tabs">
          {[['list','计划'], ['schedule','行程'], ['habits','习惯']].map(([k, l]) => (
            <button key={k} className={view === k ? 'active' : ''} onClick={() => setView(k)}>
              <Icon name={k === 'habits' ? 'flame' : k === 'schedule' ? 'sun' : 'list'} />{l}
            </button>
          ))}
        </nav>
      </header>

      <main className="ph-main">
        {view === 'list' && renderListView()}
        {view === 'habits' && renderHabitsView()}
        {view === 'schedule' && renderScheduleView()}
      </main>

      {/* 统一弹窗 */}
      {modal && (
        <div className="ph-modal-overlay" onClick={() => setModal(null)}>
          <div className="ph-modal" onClick={e => e.stopPropagation()}>
            <div className="ph-modal-deco" />
            {modal.type === 'delete' ? (
              <>
                <h3>确认移除吗？</h3>
                <p>此操作不可撤销。</p>
                <div className="ph-modal-actions">
                  <button className="ph-btn-cancel" onClick={() => setModal(null)}>取消</button>
                  <button className="ph-btn-confirm ph-btn-danger" onClick={handleDelete}>确认删除</button>
                </div>
              </>
            ) : modal.type === 'habit' ? (
              <>
                <h3>新建习惯</h3>
                <input className="ph-modal-input" placeholder="习惯名称" autoFocus value={modalForm.name || ''} onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))} />
                <div className="ph-modal-field-group">
                  <label>计量单位</label>
                  <div className="ph-unit-picker">
                    {['次','分钟','小时','页','公里','组'].map(u => (
                      <button key={u} type="button" className={modalForm.unit === u ? 'active' : ''} onClick={() => setModalForm(f => ({ ...f, unit: u }))}>{u}</button>
                    ))}
                  </div>
                </div>
                <div className="ph-modal-actions">
                  <button className="ph-btn-cancel" onClick={() => setModal(null)}>取消</button>
                  <button className="ph-btn-confirm" onClick={handleCreate}>创建</button>
                </div>
              </>
            ) : modal.type === 'habitLog' ? (
              <>
                <h3>记录打卡</h3>
                <p className="ph-modal-subtitle">{modal.payload?.date} 完成了多少 <strong>{modal.payload?.unit}</strong>？</p>
                <input className="ph-modal-input" type="number" min="0" step="any" placeholder="数量" autoFocus value={modalForm.amount || ''} onChange={e => setModalForm(f => ({ ...f, amount: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                <div className="ph-modal-actions">
                  <button className="ph-btn-cancel" onClick={() => setModal(null)}>取消</button>
                  <button className="ph-btn-confirm" onClick={handleCreate}>保存</button>
                </div>
              </>
            ) : modal.type === 'category' ? (
              <>
                <h3>🏷️添加分类</h3>
                <input className="ph-modal-input" placeholder="新分类名称" autoFocus value={modalForm.name || ''} onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                <div className="ph-existing-cats">已有: {categories.join('、')}</div>
                <div className="ph-modal-actions">
                  <button className="ph-btn-cancel" onClick={() => setModal(null)}>取消</button>
                  <button className="ph-btn-confirm" onClick={handleCreate}>添加</button>
                </div>
              </>
            ) : modal.type === 'subEdit' ? (
              <>
                <h3>✏️编辑子任务</h3>
                <div className="ph-modal-field-group">
                  <label>优先级</label>
                  <select className="ph-modal-input" value={modalForm.priority || 'medium'} onChange={e => setModalForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="urgent">A级</option><option value="high">B级</option>
                    <option value="medium">C级</option><option value="low">D级</option>
                  </select>
                </div>
                <div className="ph-modal-field-group">
                  <label>截止日期</label>
                  <input className="ph-modal-input" type="date" value={modalForm.dueDate || ''} onChange={e => setModalForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="ph-modal-actions">
                  <button className="ph-btn-cancel" onClick={() => setModal(null)}>取消</button>
                  <button className="ph-btn-confirm" onClick={handleCreate}>保存</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Plan;