import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Image as ImageIcon, Video, Calendar,
  Clock, X, Trophy, Flame, Camera, Edit3, CheckCircle2
} from 'lucide-react';
import '../styles/Hobby.css';

const STORAGE_KEY = 'hobby-tracker-data-v2';

// ========== 工具函数 ==========
const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id !== 'undefined' && Array.isArray(item.records)
    );
  } catch (e) {
    console.error('数据解析失败，已保护原始数据:', e);
    return [];
  }
};
const compressImage = (file, maxWidth = 600) =>
  new Promise((resolve) => {
    if (file.type.startsWith('video')) {
      alert('本地存储不支持视频文件，请仅上传图片');
      resolve('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });

const Hobby = () => {
  // 使用 ref 标记初始化状态，防止首次空状态覆盖 localStorage
  const isInitialized = useRef(false);

  const [hobbies, setHobbies] = useState(() => {
    const data = loadData();
    if (data.length > 0 || localStorage.getItem(STORAGE_KEY) !== null) {
      isInitialized.current = true;
    }
    return data;
  });

  const [activeHobbyId, setActiveHobbyId] = useState(null);

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // 创建爱好表单
  const [createForm, setCreateForm] = useState({ title: '', startDate: '', cover: '' });
  const createCoverRef = useRef(null);

  // 打卡表单
  const [recordText, setRecordText] = useState('');
  const [recordFiles, setRecordFiles] = useState([]);
  const recordFileRef = useRef(null);

  // 更换封面
  const coverUploadRef = useRef(null);

  //  安全持久化，带写入前容量预检
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    try {
      const serialized = JSON.stringify(hobbies);
      if (serialized.length > 4 * 1024 * 1024) {
        console.warn('数据量过大，跳过本次保存以防止损坏');
        alert('打卡数据量已接近浏览器存储上限，请删除部分旧记录或媒体文件');
        return;
      }
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.error('存储失败:', e);
      alert('存储空间不足，本次修改未保存！请删除部分记录后重试');
    }
  }, [hobbies]);

  const activeHobby = useMemo(
    () => hobbies.find((h) => h.id === activeHobbyId) || null,
    [hobbies, activeHobbyId]
  );

  const getDaysCount = useCallback((startDate) => {
    if (!startDate) return 0;
    const diff = Date.now() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  }, []);

  // ========== 创建爱好 ==========
  const handleCreateCoverSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setCreateForm((prev) => ({ ...prev, cover: compressed }));
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    const newHobby = {
      id: Date.now(),
      title: createForm.title.trim(),
      startDate: createForm.startDate || new Date().toISOString().split('T')[0],
      cover: createForm.cover || '',
      records: [],
    };
    setHobbies((prev) => [...prev, newHobby]);
    setActiveHobbyId(newHobby.id);
    setCreateForm({ title: '', startDate: '', cover: '' });
    setShowCreateModal(false);
  };

  // ========== 删除爱好 ==========
  const confirmDelete = () => {
    if (deleteConfirmId === null) return;
    setHobbies((prev) => prev.filter((h) => h.id !== deleteConfirmId));
    if (activeHobbyId === deleteConfirmId) setActiveHobbyId(null);
    setDeleteConfirmId(null);
  };

  // ========== 更换封面 ==========
  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeHobbyId) return;
    const compressed = await compressImage(file);
    setHobbies((prev) =>
      prev.map((h) => (h.id === activeHobbyId ? { ...h, cover: compressed } : h))
    );
    setShowCoverModal(false);
  };

  // ========== 打卡记录 ==========
  const handleRecordFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const results = await Promise.all(
      files.map(async (file) => {
        const base64 = await compressImage(file);
        return {
          base64,
          type: file.type.startsWith('video') ? 'video' : 'image',
        };
      })
    );
    const validResults = results.filter((r) => r.base64);
    setRecordFiles((prev) => [...prev, ...validResults]);
    if (recordFileRef.current) recordFileRef.current.value = '';
  };

  const removeRecordFile = (index) => {
    setRecordFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRecord = (e) => {
    e.preventDefault();
    if (!recordText.trim() && recordFiles.length === 0) return;
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      content: recordText.trim(),
      media: recordFiles.map((f) => ({ url: f.base64, type: f.type })),
    };
    setHobbies((prev) =>
      prev.map((h) =>
        h.id === activeHobbyId
          ? { ...h, records: [newRecord, ...h.records] }
          : h
      )
    );
    setRecordText('');
    setRecordFiles([]);
    setShowRecordModal(false);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultCover = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div className="hb-layout">
      {/* ====== 左侧侧边栏 ====== */}
      <aside className="hb-sidebar">
        <div className="hb-sidebar-header">
          <h2>爱好</h2>
          <button className="hb-icon-btn" onClick={() => setShowCreateModal(true)} title="新增爱好">
            <Plus size={20} />
          </button>
        </div>

        <nav className="hb-nav">
          {hobbies.map((hobby) => (
            <div
              key={hobby.id}
              className={`hb-nav-item ${activeHobbyId === hobby.id ? 'active' : ''}`}
              onClick={() => setActiveHobbyId(hobby.id)}
            >
              <div
                className="hb-nav-cover"
                style={{
                  backgroundImage: hobby.cover ? `url(${hobby.cover})` : defaultCover,
                }}
              />
              <div className="hb-nav-info">
                <span className="hb-nav-title">{hobby.title}</span>
                <span className="hb-nav-days">
                  <Flame size={12} className="hb-flame-icon" />
                  {getDaysCount(hobby.startDate)}天
                </span>
              </div>
              <button
                className="hb-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(hobby.id);
                }}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
              {activeHobbyId === hobby.id && <div className="hb-active-bar" />}
            </div>
          ))}

          {hobbies.length === 0 && (
            <div className="hb-empty-sidebar">
              <p>暂时没有任何爱好</p>
              <button onClick={() => setShowCreateModal(true)}>+ 创建第一个</button>
            </div>
          )}
        </nav>
      </aside>

      {/* ====== 右侧主内容区 ====== */}
      <main className="hb-main">
        {activeHobby ? (
          <>
            <header className="hb-detail-header">
              <div
                className="hb-header-bg"
                style={{
                  backgroundImage: activeHobby.cover ? `url(${activeHobby.cover})` : defaultCover,
                }}
              />
              <div className="hb-header-content">
                <div className="hb-header-top-row">
                  <div className="hb-header-title-group">
                    <h1>{activeHobby.title}</h1>
                    <button className="hb-edit-cover-btn" onClick={() => setShowCoverModal(true)} title="更换封面">
                      <Camera size={14} />
                      <span>换封面</span>
                    </button>
                  </div>
                  <button className="hb-checkin-btn" onClick={() => setShowRecordModal(true)}>
                    <CheckCircle2 size={18} />
                    <span>立即打卡</span>
                  </button>
                </div>
                <div className="hb-stats-row">
                  <div className="hb-stat-badge">
                    <Calendar size={14} />
                    <span>始于 {activeHobby.startDate}</span>
                  </div>
                  <div className="hb-stat-badge highlight">
                    <Trophy size={14} />
                    <span>已坚持 {getDaysCount(activeHobby.startDate)} 天</span>
                  </div>
                  <div className="hb-stat-badge">
                    <Clock size={14} />
                    <span>{activeHobby.records.length} 次打卡</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="hb-feed-container">
              <div className="hb-timeline-feed">
                {activeHobby.records.length === 0 ? (
                  <div className="hb-empty-feed">
                    <Edit3 size={48} strokeWidth={1} />
                    <p>还没有打卡记录</p>
                    <p className="hb-empty-sub">点击右上角立即打卡开启你的第一天吧！</p>
                  </div>
                ) : (
                  activeHobby.records.map((record, idx) => (
                    <article key={record.id} className="hb-feed-card">
                      <div className="hb-timeline-node">
                        <div className="hb-timeline-dot" />
                        {idx < activeHobby.records.length - 1 && <div className="hb-timeline-line" />}
                      </div>
                      <div className="hb-feed-card-inner">
                        <div className="hb-feed-header">
                          <div className="hb-avatar">{activeHobby.title[0]}</div>
                          <div className="hb-feed-meta">
                            <strong>{activeHobby.title}</strong>
                            <time>{formatDate(record.date)}</time>
                          </div>
                        </div>
                        {record.content && <p className="hb-feed-text">{record.content}</p>}
                        {record.media.length > 0 && (
                          <div className={`hb-media-grid hb-grid-${Math.min(record.media.length, 3)}`}>
                            {record.media.map((m, i) => (
                              <div key={i} className="hb-media-wrapper">
                                {m.type === 'video' ? (
                                  <video controls src={m.url} preload="metadata" />
                                ) : (
                                  <img src={m.url} alt="record" loading="lazy" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="hb-no-selection">
            <div className="hb-no-selection-icon"></div>
            <h3>请选择或创建一个爱好</h3>
          </div>
        )}
      </main>

      {/* ====== 模态框：创建爱好 ====== */}
      <div className={`hb-modal-overlay ${showCreateModal ? 'visible' : ''}`} onClick={() => setShowCreateModal(false)}>
        <div className="hb-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="hb-modal-header">
            <h3>新建爱好</h3>
            <button className="hb-modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmitCreate}>
            <label className="hb-modal-label">名称</label>
            <input
              className="hb-modal-input"
              placeholder="例如：吉他"
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              autoFocus
            />
            <label className="hb-modal-label">开始日期</label>
            <input
              className="hb-modal-input"
              type="date"
              value={createForm.startDate}
              onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <label className="hb-modal-label">封面照片</label>
            <div className="hb-cover-upload" onClick={() => createCoverRef.current?.click()}>
              {createForm.cover ? (
                <img src={createForm.cover} alt="cover-preview" className="hb-cover-preview" />
              ) : (
                <div className="hb-cover-placeholder"><Camera size={24} /><span>点击上传封面</span></div>
              )}
              <input ref={createCoverRef} type="file" accept="image/*" hidden onChange={handleCreateCoverSelect} />
            </div>
            <button type="submit" className="hb-modal-submit" disabled={!createForm.title.trim()}>创建爱好</button>
          </form>
        </div>
      </div>

      {/* ====== 模态框：打卡记录 ====== */}
      <div className={`hb-modal-overlay ${showRecordModal ? 'visible' : ''}`} onClick={() => setShowRecordModal(false)}>
        <div className="hb-modal-box hb-modal-box-lg" onClick={(e) => e.stopPropagation()}>
          <div className="hb-modal-header">
            <h3>打卡记录</h3>
            <button className="hb-modal-close" onClick={() => setShowRecordModal(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmitRecord}>
            <textarea
              className="hb-modal-textarea"
              placeholder={`点击记录今天关于${activeHobby?.title}的收获...`}
              rows={4}
              value={recordText}
              onChange={(e) => setRecordText(e.target.value)}
              autoFocus
            />
            {recordFiles.length > 0 && (
              <div className="hb-preview-grid">
                {recordFiles.map((item, idx) => (
                  <div key={idx} className="hb-preview-item">
                    {item.type === 'video' ? (
                      <div className="hb-video-placeholder"><Video size={24} /></div>
                    ) : (
                      <img src={item.base64} alt="preview" />
                    )}
                    <button type="button" className="hb-remove-preview" onClick={() => removeRecordFile(idx)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="hb-compose-footer">
              <label className="hb-attach-btn">
                <ImageIcon size={18} />
                <span>添加图片</span>
                <input ref={recordFileRef} type="file" multiple accept="image/*" hidden onChange={handleRecordFileSelect} />
              </label>
              <button type="submit" className="hb-modal-submit hb-modal-submit-inline" disabled={!recordText.trim() && recordFiles.length === 0}>
                发布打卡
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ====== 模态框：更换封面 ====== */}
      <div className={`hb-modal-overlay ${showCoverModal ? 'visible' : ''}`} onClick={() => setShowCoverModal(false)}>
        <div className="hb-modal-box hb-modal-box-sm" onClick={(e) => e.stopPropagation()}>
          <div className="hb-modal-header">
            <h3>更换封面</h3>
            <button className="hb-modal-close" onClick={() => setShowCoverModal(false)}><X size={18} /></button>
          </div>
          <div className="hb-cover-upload hb-cover-upload-lg" onClick={() => coverUploadRef.current?.click()}>
            {activeHobby?.cover ? (
              <img src={activeHobby.cover} alt="current-cover" className="hb-cover-preview" />
            ) : (
              <div className="hb-cover-placeholder"><Camera size={32} /><span>点击上传新封面</span></div>
            )}
            <input ref={coverUploadRef} type="file" accept="image/*" hidden onChange={handleCoverChange} />
          </div>
          <p className="hb-modal-hint">建议选择 16:9 比例的横图以获得最佳效果</p>
        </div>
      </div>

      {/* ====== 删除确认框 ====== */}
      <div className={`hb-modal-overlay ${deleteConfirmId !== null ? 'visible' : ''}`} onClick={() => setDeleteConfirmId(null)}>
        <div className="hb-modal-box hb-modal-box-sm hb-modal-confirm" onClick={(e) => e.stopPropagation()}>
          <h3>确认删除</h3>
          <p>删除后该爱好及其所有打卡记录将无法恢复，确定要继续吗？</p>
          <div className="hb-confirm-actions">
            <button className="hb-confirm-cancel" onClick={() => setDeleteConfirmId(null)}>取消</button>
            <button className="hb-confirm-danger" onClick={confirmDelete}>确认删除</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hobby;