import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../styles/Diary.css';

// --- 零依赖 SVG 图标系统 ---
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    trash: <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>,
    image: <><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>,
    bold: <path d="M14 12a4 4 0 0 0 0-8H6v8M15 20a4 4 0 0 0 0-8H6v8Z" />,
    italic: <><line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" /></>,
    underline: <><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" x2="20" y1="21" y2="21" /></>,
    strikethrough: <><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" x2="20" y1="12" y2="12" /></>,
    list: <><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></>,
    listOrdered: <><line x1="10" x2="21" y1="6" y2="6" /><line x1="10" x2="21" y1="12" y2="12" /><line x1="10" x2="21" y1="18" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></>,
    mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
    cloud: <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" />,
    rain: <><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" /><path d="M8 23v-2M12 23v-2M16 23v-2" /></>,
    snow: <><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" /><path d="M8 23l2-2M12 23v-2M16 23l-2-2" /></>,
    palette: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    heading: <path d="M6 4v16M18 4v16M6 12h12" />,
    x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name] || null}
    </svg>
  );
};

// --- 工具函数与常量 ---
const formatDate = (d) => new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const MOODS = ['😊开心', '😌平静', '😢难过', '😡愤怒', '😫疲惫', '🤔思考'];
const WEATHERS = ['晴天', '多云', '雨天', '雪天'];
const COLORS = ['#2c3e50', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
const MAX_IMG_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const Diary = () => {
  const [diaries, setDiaries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('app_diaries_v2')) || []; } catch { return []; }
  });
  
  const [activeId, setActiveId] = useState(null);
  const [title, setTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [meta, setMeta] = useState({ mood: '😊开心', weather: '晴天', location: '' });
  
  const [viewMode, setViewMode] = useState('list'); 
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null); 
  
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, title: '' });
  
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const prevActiveIdRef = useRef(null);

  // 持久化存储
  useEffect(() => { 
    localStorage.setItem('app_diaries_v2', JSON.stringify(diaries)); 
  }, [diaries]);

  //  加载日记 + 切换前自动保存 HTML
  useEffect(() => {
    const prevId = prevActiveIdRef.current;
    
    // 切换时静默保存上一篇的 HTML（防止丢失）
    if (prevId && prevId !== activeId) {
      const prevHtml = editorRef.current?.innerHTML || '';
      if (prevHtml) {
        setDiaries(prev => prev.map(d => 
          d.id === prevId ? { ...d, content: prevHtml, updatedAt: new Date().toISOString() } : d
        ));
      }
    }

    // 加载新日记或清空编辑器
    if (activeId) {
      const d = diaries.find(x => x.id === activeId);
      if (d) {
        setTitle(d.title);
        setMeta({ mood: d.mood, weather: d.weather, location: d.location || '' });
        if (editorRef.current && editorRef.current.innerHTML !== d.content) {
          editorRef.current.innerHTML = d.content;
        }
        setIsDirty(false);
      }
    } else {
      //   activeId 变为 null 时，确保 DOM 也被清空
      setTitle('');
      setMeta({ mood: '😊开心', weather: '晴天', location: '' });
      if (editorRef.current) editorRef.current.innerHTML = '';
      setIsDirty(false);
    }

    prevActiveIdRef.current = activeId;
  }, [activeId, diaries]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0);
    }
  };

  const execCmd = (cmd, val = null) => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    setIsDirty(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_IMG_TYPES.includes(file.type)) {
      alert('仅支持 JPG/PNG/GIF/WebP 格式的图片');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMG_SIZE) {
      alert('图片大小不能超过 5MB');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      execCmd('insertHTML', `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:10px 0;display:block;" />`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  //  恢复新建功能
  const createNewEntry = () => {
    // 如果当前有未保存的内容，先提示或自动保存（这里选择直接切换到新建态）
    setActiveId(null);
    // 强制聚焦到标题栏，提升新建体验
    setTimeout(() => {
      document.querySelector('.ed-title')?.focus();
    }, 50);
  };

  //  保存后自动清除残留，进入新建状态
  const handleSave = () => {
    const html = editorRef.current?.innerHTML || '';
    if (!title.trim() && !html.replace(/<[^>]*>/g, '').trim()) return;
    
    const now = new Date().toISOString();
    const entry = {
      id: activeId || Date.now().toString(),
      title: title || '无题日记',
      content: html,
      date: activeId ? diaries.find(d => d.id === activeId)?.date || now : now,
      updatedAt: now,
      ...meta
    };

    setDiaries(prev => activeId ? prev.map(d => d.id === activeId ? entry : d) : [entry, ...prev]);
    setActiveId(null);
    setIsDirty(false);
  };

  const requestDelete = (id, e) => {
    if (e) e.stopPropagation();
    const target = diaries.find(d => d.id === id);
    setConfirmModal({ show: true, id, title: target?.title || '这篇日记' });
  };

  const confirmDelete = () => {
    if (confirmModal.id) {
      setDiaries(prev => prev.filter(d => d.id !== confirmModal.id));
      if (activeId === confirmModal.id) setActiveId(null);
    }
    setConfirmModal({ show: false, id: null, title: '' });
  };

  const filtered = useMemo(() => {
    let res = diaries;
    if (selectedDate) {
      res = res.filter(d => d.date.startsWith(selectedDate));
    } 
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.content.toLowerCase().includes(q) ||
        d.date.includes(q)
      );
    }
    return res.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [diaries, search, selectedDate]);

  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return diaries
      .filter(d => d.date.startsWith(selectedDate))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [diaries, selectedDate]);

  const calendarDays = useMemo(() => {
    const y = dateFilter.getFullYear(), m = dateFilter.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const entries = diaries.filter(d => d.date.startsWith(dateStr));
      days.push({ day: i, dateStr, entries });
    }
    return days;
  }, [dateFilter, diaries]);

  const changeMonth = (delta) => {
    setDateFilter(prev => {
      const next = new Date(prev.getTime());
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const renderToolbar = () => (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('bold')} title="加粗"><Icon name="bold" size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('italic')} title="斜体"><Icon name="italic" size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('underline')} title="下划线"><Icon name="underline" size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('strikeThrough')} title="删除线"><Icon name="strikethrough" size={16} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="toolbar-group">
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('formatBlock', 'H2')} title="标题"><Icon name="heading" size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('insertUnorderedList')} title="无序列表"><Icon name="list" size={16} /></button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('insertOrderedList')} title="有序列表"><Icon name="listOrdered" size={16} /></button>
      </div>
      <div className="toolbar-sep" />
      <div className="color-picker-group">
        <Icon name="palette" size={16} />
        <div className="color-dots">
          {COLORS.map(c => (
            <span 
              key={c} 
              style={{background: c}} 
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('foreColor', c)} 
              title={c} 
            />
          ))}
        </div>
      </div>
      <div className="toolbar-sep" />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} title="插入图片" className="btn-img-upload"><Icon name="image" size={16} /> 图片</button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
    </div>
  );

  const renderDiaryItem = (d) => (
    <div key={d.id} className={`diary-item ${activeId === d.id ? 'active' : ''}`} onClick={() => setActiveId(d.id)}>
      <div className="di-item-head">
        <span className="di-date">{formatDate(d.date)}</span>
        <span className="di-mood">{d.mood}</span>
      </div>
      <div className="di-title">{d.title || '无题日记'}</div>
      <div className="di-preview">{d.content.replace(/<[^>]*>/g, '').slice(0, 60)}</div>
      <div className="di-footer">
        <button className="di-del-btn" onClick={(e) => requestDelete(d.id, e)} title="删除此日记"><Icon name="trash" size={14} /></button>
      </div>
    </div>
  );

  const renderViews = () => {
    if (viewMode === 'calendar') {
      return (
        <div className="view-calendar">
          <div className="cal-nav">
            <button onClick={() => changeMonth(-1)}><Icon name="chevronLeft" /></button>
            <span>{dateFilter.getFullYear()}年{dateFilter.getMonth()+1}月</span>
            <button onClick={() => changeMonth(1)}><Icon name="chevronRight" /></button>
          </div>
          {selectedDate && (
            <div className="cal-filter-hint" onClick={() => setSelectedDate(null)}>
              <Icon name="filter" size={12} /> 已筛选: {selectedDate} <Icon name="x" size={12} />
            </div>
          )}
          <div className="cal-grid">
            {['日','一','二','三','四','五','六'].map(d => <div key={d} className="cal-head">{d}</div>)}
            {calendarDays.map((d, i) => (
              <div 
                key={i} 
                className={`cal-cell ${d?.entries.length ? 'has-entry' : ''} ${selectedDate === d?.dateStr ? 'selected-date' : ''}`}
                onClick={() => d && setSelectedDate(prev => prev === d.dateStr ? null : d.dateStr)}
              >
                {d && (
                  <>
                    <span className="cal-day-num">{d.day}</span>
                    {d.entries.length > 0 && (
                      <div className="cal-dots">
                        {d.entries.slice(0,3).map(e => <span key={e.id} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="cal-tip">点击日期可筛选当天日记</div>

          {selectedDate && (
            <div className="cal-date-entries">
              <div className="cal-entries-header">
                <span>{selectedDate} 的日记</span>
                <span className="cal-entries-count">{selectedDateEntries.length} 篇</span>
              </div>
              {selectedDateEntries.length > 0 ? (
                <div className="cal-entries-list">
                  {selectedDateEntries.map(renderDiaryItem)}
                </div>
              ) : (
                <div className="empty-view">这一天还没有写日记哦</div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="empty-view-wrapper">
          <div className="empty-view">{selectedDate ? '暂无日记' : '暂无日记，写一个吧'}</div>
        </div>
      );
    }
    
    return filtered.map(renderDiaryItem);
  };

  return (
    <div className="diary-container">
      <aside className="diary-sidebar">
        {/*恢复新建按钮 */}
        <div className="sb-header">
          <h2>日记本</h2>
          <button className="sb-new-btn" onClick={createNewEntry} title="新建日记">
            <Icon name="plus" size={18} />
          </button>
        </div>
        
        <div className="sb-search">
          <Icon name="search" size={14} />
          <input placeholder="点击进行搜索" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="sb-views">
          {[['list','列表'], ['calendar','日历']].map(([k,l]) => (
            <button key={k} className={viewMode===k?'active':''} onClick={() => { setViewMode(k); setSelectedDate(null); }}>{l}</button>
          ))}
        </div>

        <div className="sb-list">{renderViews()}</div>
      </aside>

      <main className="diary-editor">
        <div className="ed-meta-bar">
          <div className="meta-left">
            <div className="meta-label-group">
              <span className="meta-label">心情</span>
              <select value={meta.mood} onChange={e => setMeta(p=>({...p, mood:e.target.value}))}>
                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="meta-label-group">
              <span className="meta-label">天气</span>
              <select 
                value={meta.weather} 
                onChange={e => setMeta(p=>({...p, weather:e.target.value}))}
                className="weather-select-inline"
              >
                {WEATHERS.map(w => (
                  <option key={w} value={w}>
                    {{ '晴天':'☀️', '多云':'⛅', '雨天':'🌧️', '雪天':'❄️' }[w]} {w}
                  </option>
                ))}
              </select>
            </div>
            <div className="meta-label-group">
              <span className="meta-label">位置</span>
              <div className="loc-input">
                <Icon name="mapPin" size={14} />
                <input placeholder="记录位置..." value={meta.location} onChange={e => setMeta(p=>({...p, location:e.target.value}))} />
              </div>
            </div>
          </div>
          <div className="meta-right">
            <span className="auto-save-hint">{isDirty ? '未保存' : (activeId ? '已保存' : '新建')}</span>
            {activeId && <button className="btn-del" onClick={(e) => requestDelete(activeId, e)} title="删除"><Icon name="trash" size={16} /></button>}
            <button className="btn-save" onClick={handleSave}>保存</button>
          </div>
        </div>

        <input className="ed-title" placeholder="标题" value={title} onChange={e => { setTitle(e.target.value); setIsDirty(true); }} />

        {renderToolbar()}
        
        <div 
          ref={editorRef}
          className="ed-content" 
          contentEditable 
          suppressContentEditableWarning
          onInput={() => setIsDirty(true)}
          onSelect={saveSelection}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          placeholder="请点击进行编辑..."
        />
      </main>

      {confirmModal.show && (
        <div className="css-modal-overlay" onClick={() => setConfirmModal({ show: false, id: null, title: '' })}>
          <div className="css-modal-box" onClick={e => e.stopPropagation()}>
            <h3>删除</h3>
            <p>确定要删除「{confirmModal.title}」吗？<br/>此操作无法撤销。</p>
            <div className="css-modal-actions">
              <button className="css-btn-cancel" onClick={() => setConfirmModal({ show: false, id: null, title: '' })}>取消</button>
              <button className="css-btn-confirm" onClick={confirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diary;