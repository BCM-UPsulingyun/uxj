import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, MapPin, User, Plus, X, Settings
} from 'lucide-react';
import '../styles/Curriculum.css';

// --- 工具函数：计算当前是第几周---
const calculateCurrentWeek = (startDateStr) => {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = now - start;
  if (diffTime < 0) return 1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.min(Math.floor(diffDays / 7) + 1, 30);
};

// --- 安全解析本地存储 ---
const getSavedData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

// --- 安全解析自定义周次字符串---
const parseCustomWeeks = (customWeeksStr) => {
  if (!customWeeksStr) return [];
  return customWeeksStr
    .split(',')
    .map(w => parseInt(w.trim(), 10))
    .filter(n => !isNaN(n));
};

const Curriculum = () => {
  const [courses, setCourses] = useState(() =>
    getSavedData('curriculum_courses', [])
  );

  const [semesterStart, setSemesterStart] = useState(() =>
    localStorage.getItem('semesterStart') || '2026-02-23'
  );

  const [totalWeeks, setTotalWeeks] = useState(() =>
    parseInt(localStorage.getItem('totalWeeks') || '20', 10) || 20
  );

  const [currentWeek, setCurrentWeek] = useState(() =>
    calculateCurrentWeek(localStorage.getItem('semesterStart') || '2026-02-23')
  );

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [nameError, setNameError] = useState(false);

  const touchStartX = useRef(0);

  // --- 数据持久化监听 ---
  useEffect(() => {
    localStorage.setItem('curriculum_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('semesterStart', semesterStart);
    setCurrentWeek(calculateCurrentWeek(semesterStart));
  }, [semesterStart]);

  useEffect(() => {
    localStorage.setItem('totalWeeks', String(totalWeeks));
  }, [totalWeeks]);

  // --- 逻辑判断---
  const isCourseInWeek = (course, week) => {
    if (course.weeksType === 'all') return true;
    if (course.weeksType === 'odd') return week % 2 !== 0;
    if (course.weeksType === 'even') return week % 2 === 0;
    if (course.weeksType === 'custom') {
      const weeks = parseCustomWeeks(course.customWeeks);
      return weeks.includes(week);
    }
    return false;
  };

  // 滑动切换周次
  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0
        ? setCurrentWeek(prev => Math.min(prev + 1, totalWeeks))
        : setCurrentWeek(prev => Math.max(prev - 1, 1));
    }
  };

  // 课程编辑操作
  const openCourseModal = (course = null) => {
    setNameError(false);
    setEditingCourse(course ? { ...course } : {
      id: Date.now(), name: '', day: 1, start: 1, duration: 2,
      room: '', teacher: '', color: '#acc0d7', weeksType: 'all', customWeeks: ''
    });
    setIsCourseModalOpen(true);
  };

  const saveCourse = () => {
    if (!editingCourse?.name || !editingCourse.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setCourses(prev => {
      const exists = prev.find(c => c.id === editingCourse.id);
      return exists
        ? prev.map(c => c.id === editingCourse.id ? editingCourse : c)
        : [...prev, editingCourse];
    });
    setIsCourseModalOpen(false);
  };

  const deleteCourse = () => {
    setCourses(prev => prev.filter(c => c.id !== editingCourse?.id));
    setIsCourseModalOpen(false);
  };

  // 渲染准备
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 1);
  const todayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay();

  // 用 useMemo 缓存今日课程计算
  const todayCourses = useMemo(() => {
    return courses
      .filter(c => c.day === todayIndex && isCourseInWeek(c, currentWeek))
      .sort((a, b) => a.start - b.start);
  }, [courses, currentWeek, todayIndex]);

  return (
    <div className="curriculum-container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* 顶部导航 */}
      <div className="curriculum-header">
        <div className="header-left">
          {/* 补全 curr- 前缀以匹配 CSS */}
          <button 
            className="curr-nav-btn" 
            onClick={(e) => { e.stopPropagation(); setCurrentWeek(p => Math.max(p - 1, 1)); }} 
            onTouchEnd={(e) => e.stopPropagation()}
            disabled={currentWeek <= 1}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="week-selector">
            <span className="current-week">第 {currentWeek} 周</span>
            <span className="total-weeks">/ 共 {totalWeeks} 周</span>
          </div>
          <button 
            className="curr-nav-btn" 
            onClick={(e) => { e.stopPropagation(); setCurrentWeek(p => Math.min(p + 1, totalWeeks)); }} 
            onTouchEnd={(e) => e.stopPropagation()}
            disabled={currentWeek >= totalWeeks}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="header-right">
          <button 
            className="curr-icon-btn" 
            onClick={(e) => { e.stopPropagation(); setIsSettingsModalOpen(true); }} 
            onTouchEnd={(e) => e.stopPropagation()}
            aria-label="学期设置"
          >
            <Settings size={18} />
          </button>
          <button 
            className="curr-icon-btn" 
            onClick={(e) => { e.stopPropagation(); openCourseModal(); }} 
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="curriculum-content">
        <div className="timetable-wrapper">
          <div className="timetable-grid">
            <div className="corner-header">节次</div>
            {weekDays.map((day, index) => (
              <div key={day} className={`day-header ${index + 1 === todayIndex ? 'today' : ''}`}>
                {day}
                {index + 1 === todayIndex && <span className="today-dot"></span>}
              </div>
            ))}

            {timeSlots.map(slot => (
              <React.Fragment key={slot}>
                <div className="time-slot">{slot}</div>
                {weekDays.map((_, dayIdx) => {
                  const day = dayIdx + 1;
                  const course = courses.find(c => c.day === day && c.start === slot && isCourseInWeek(c, currentWeek));

                  // 精确的区间重叠判断，排除自身起始格
                  const isOccupied = !course && courses.some(c =>
                    c.day === day &&
                    c.start !== slot &&
                    c.start <= slot &&
                    (c.start + c.duration - 1) >= slot &&
                    isCourseInWeek(c, currentWeek)
                  );

                  if (isOccupied) return null;

                  return course ? (
                    <div key={`${day}-${slot}`} className="cell" style={{ gridRow: `span ${course.duration}` }} onClick={() => openCourseModal(course)}>
                      <div className="course-card" style={{ backgroundColor: course.color }}>
                        <div className="course-name">{course.name}</div>
                        <div className="course-info"><MapPin size={10} />{course.room}</div>
                        <div className="course-info"><User size={10} />{course.teacher}</div>
                      </div>
                    </div>
                  ) : <div key={`${day}-${slot}`} className="cell empty"></div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 侧边栏类名补全 curr- 前缀 */}
        <div className="curr-sidebar">
          <div className="schedule-card">
            <h3><Calendar size={18} /> 今日课程</h3>
            {todayCourses.length === 0 ? (
              <div className="empty-state">暂时没课</div>
            ) : (
              <div className="schedule-list">
                {todayCourses.map(course => (
                  <div key={course.id} className="schedule-item" onClick={() => openCourseModal(course)}>
                    <div className="time-badge">{course.start}-{course.start + course.duration - 1}节</div>
                    <div className="schedule-details">
                      <div className="name">{course.name}</div>
                      <div className="meta">{course.room} | {course.teacher}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/*  学期设置弹窗 (始终渲染，通过 active 控制显隐与双向动画) */}
      <div 
        className={`curr-modal-overlay ${isSettingsModalOpen ? 'active' : ''}`} 
        onClick={() => setIsSettingsModalOpen(false)}
      >
        <div className="curr-modal-content settings-modal" onClick={e => e.stopPropagation()}>
          <div className="curr-modal-header">
            <h2>学期设置</h2>
            <button 
              className="curr-modal-close-btn" 
              onClick={(e) => { e.stopPropagation(); setIsSettingsModalOpen(false); }}
              onTouchEnd={(e) => e.stopPropagation()}
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>
          <div className="curr-modal-body">
            <div className="curr-form-group">
              <label>开学日期</label>
              <input type="date" value={semesterStart} onChange={(e) => setSemesterStart(e.target.value)} />
            </div>
            <div className="curr-form-group">
              <label>总周数</label>
              <input type="number" min="1" max="30" value={totalWeeks} onChange={(e) => setTotalWeeks(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="curr-modal-footer">
            <div style={{ flex: 1 }}></div>
            <button 
              className="curr-btn-save" 
              onClick={(e) => { e.stopPropagation(); setIsSettingsModalOpen(false); }}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {/* 课程编辑弹窗 (始终渲染，通过 active 控制显隐与双向动画) */}
      <div 
        className={`curr-modal-overlay ${isCourseModalOpen ? 'active' : ''}`} 
        onClick={() => setIsCourseModalOpen(false)}
      >
        <div className="curr-modal-content" onClick={e => e.stopPropagation()}>
          <div className="curr-modal-header">
            <h2>{editingCourse?.id ? '编辑课程' : '新增课程'}</h2>
            <button 
              className="curr-modal-close-btn" 
              onClick={(e) => { e.stopPropagation(); setIsCourseModalOpen(false); }}
              onTouchEnd={(e) => e.stopPropagation()}
              aria-label="关闭"
            >
              <X size={20} />
            </button>
          </div>
          <div className="curr-modal-body">
            <div className="curr-form-group">
              <label>课程名称</label>
              <input
                type="text"
                className={nameError ? 'input-error' : ''}
                value={editingCourse?.name || ''}
                onChange={e => {
                  setEditingCourse(prev => prev ? { ...prev, name: e.target.value } : prev);
                  if (nameError) setNameError(false);
                }}
                placeholder="例如：高等数学"
              />
              {nameError && <span className="error-tip">请输入课程名称</span>}
            </div>

            <div className="curr-form-row">
              <div className="curr-form-group">
                <label>星期</label>
                <select value={editingCourse?.day ?? 1} onChange={e => setEditingCourse(prev => prev ? { ...prev, day: parseInt(e.target.value) || 1 } : prev)}>
                  {weekDays.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div className="curr-form-group">
                <label>开始节次</label>
                <input type="number" min="1" max="12" value={editingCourse?.start ?? 1} onChange={e => setEditingCourse(prev => prev ? { ...prev, start: parseInt(e.target.value) || 1 } : prev)} />
              </div>
              <div className="curr-form-group">
                <label>时长(节)</label>
                <input type="number" min="1" max="5" value={editingCourse?.duration ?? 2} onChange={e => setEditingCourse(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 1 } : prev)} />
              </div>
            </div>

            <div className="curr-form-row">
              <div className="curr-form-group">
                <label>教室</label>
                <input type="text" value={editingCourse?.room || ''} onChange={e => setEditingCourse(prev => prev ? { ...prev, room: e.target.value } : prev)} />
              </div>
              <div className="curr-form-group">
                <label>授课教师</label>
                <input type="text" value={editingCourse?.teacher || ''} onChange={e => setEditingCourse(prev => prev ? { ...prev, teacher: e.target.value } : prev)} />
              </div>
            </div>

            <div className="curr-form-group">
              <label>周次设置</label>
              <div className="radio-group">
                <label><input type="radio" name="weeks" checked={editingCourse?.weeksType === 'all'} onChange={() => setEditingCourse(prev => prev ? { ...prev, weeksType: 'all' } : prev)} /> 每周</label>
                <label><input type="radio" name="weeks" checked={editingCourse?.weeksType === 'odd'} onChange={() => setEditingCourse(prev => prev ? { ...prev, weeksType: 'odd' } : prev)} /> 单周</label>
                <label><input type="radio" name="weeks" checked={editingCourse?.weeksType === 'even'} onChange={() => setEditingCourse(prev => prev ? { ...prev, weeksType: 'even' } : prev)} /> 双周</label>
                <label><input type="radio" name="weeks" checked={editingCourse?.weeksType === 'custom'} onChange={() => setEditingCourse(prev => prev ? { ...prev, weeksType: 'custom' } : prev)} /> 自定义</label>
              </div>
              {editingCourse?.weeksType === 'custom' && (
                <input type="text" className="custom-week-input" value={editingCourse?.customWeeks || ''} onChange={e => setEditingCourse(prev => prev ? { ...prev, customWeeks: e.target.value } : prev)} placeholder="用逗号分隔，如: 1,3,5" />
              )}
            </div>

            <div className="curr-form-group">
              <label>卡片颜色</label>
              <div className="color-picker">
                {['#acc0d7', '#b1d89a', '#dbc2b8', '#cab6d2', '#b8a19e', '#c5bd9d'].map(color => (
                  <div key={color} className={`color-option ${editingCourse?.color === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => setEditingCourse(prev => prev ? { ...prev, color } : prev)} />
                ))}
              </div>
            </div>
          </div>
          <div className="curr-modal-footer">
            {editingCourse?.id && (
              <button 
                className="curr-btn-delete" 
                onClick={(e) => { e.stopPropagation(); deleteCourse(); }}
                onTouchEnd={(e) => e.stopPropagation()}
              >
                删除
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button 
              className="curr-btn-cancel" 
              onClick={(e) => { e.stopPropagation(); setIsCourseModalOpen(false); }}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              取消
            </button>
            <button 
              className="curr-btn-save" 
              onClick={(e) => { e.stopPropagation(); saveCourse(); }}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Curriculum;