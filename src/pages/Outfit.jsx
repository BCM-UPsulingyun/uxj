import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/Outfit.css';

// 纯 CSS 图标组件
const CssIcon = ({ name, size = 18, className = '' }) => (
  <i className={`css-icon css-icon-${name} ${className}`} style={{ '--icon-size': `${size}px` }} />
);

const DEFAULT_CATEGORIES = ['上衣', '下装', '外套', '鞋子', '配饰'];

// wttr.in 天气代码映射到纯CSS图标
const getWttrIcon = (code) => {
  const c = parseInt(code, 10);
  if (c === 113) return 'sun';
  if ([116, 119, 122].includes(c)) return 'cloud';
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 311, 314, 317, 353, 356, 359].includes(c)) return 'rain';
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(c)) return 'snow';
  return 'sun';
};

// 安全读取 localStorage 的工具函数
const safeGetStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const Outfit = () => {
  const [viewMode, setViewMode] = useState('closet');
  const [activeTab, setActiveTab] = useState('全部');

  // 初始值使用安全默认值，避免 SSR/ hydration 不一致
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [clothes, setClothes] = useState([]);
  const [outfits, setOutfits] = useState([]);

  // 客户端挂载后再从 localStorage 恢复数据，保证刷新/切换页面后数据一致
  useEffect(() => {
    setCategories(safeGetStorage('outfit_cats', DEFAULT_CATEGORIES));
    setClothes(safeGetStorage('outfit_clothes', []));
    setOutfits(safeGetStorage('outfit_outfits', []));
  }, []);

  // 监听 storage 事件，支持多标签页数据同步
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'outfit_cats') setCategories(safeGetStorage('outfit_cats', DEFAULT_CATEGORIES));
      if (e.key === 'outfit_clothes') setClothes(safeGetStorage('outfit_clothes', []));
      if (e.key === 'outfit_outfits') setOutfits(safeGetStorage('outfit_outfits', []));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [weather, setWeather] = useState({
    temp: '--', desc: '加载中...', city: '定位中...', icon: 'sun', loading: true
  });
  const [forecast, setForecast] = useState([]);
  const [showForecast, setShowForecast] = useState(false);

  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const fileInputRef = useRef(null);

  const [confirmState, setConfirmState] = useState(null);

  // 持久化写入
  useEffect(() => {
    try { localStorage.setItem('outfit_cats', JSON.stringify(categories)); } catch (e) { console.warn('localStorage cats save failed', e); }
  }, [categories]);
  useEffect(() => {
    try { localStorage.setItem('outfit_clothes', JSON.stringify(clothes)); } catch (e) { console.warn('localStorage clothes save failed', e); }
  }, [clothes]);
  useEffect(() => {
    try { localStorage.setItem('outfit_outfits', JSON.stringify(outfits)); } catch (e) { console.warn('localStorage outfits save failed', e); }
  }, [outfits]);

  // 天气获取
  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async (lat, lon) => {
      try {
        const url = (lat && lon)
          ? `https://wttr.in/${lat},${lon}?format=j1&lang=zh`
          : 'https://wttr.in/?format=j1&lang=zh';
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];
        if (!current || !area) throw new Error('数据格式异常');

        const cityName = area.areaName?.[0]?.value || '';
        const region = area.region?.[0]?.value || '';
        const displayName = /^\d+$/.test(cityName) ? region : cityName;

        setWeather({
          temp: current.temp_C,
          desc: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知',
          city: displayName || '未知地区',
          icon: getWttrIcon(current.weatherCode),
          loading: false
        });

        const forecastList = (data.weather || []).slice(0, 3).map((day, i) => {
          const date = new Date(day.date);
          const isToday = i === 0;
          const hourly = day.hourly?.[4] || day.hourly?.[0] || {};
          return {
            date: isToday ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`,
            weekday: isToday ? '' : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
            tempMax: day.maxtempC,
            tempMin: day.mintempC,
            icon: getWttrIcon(hourly.weatherCode || '113'),
            desc: hourly.lang_zh?.[0]?.value || hourly.weatherDesc?.[0]?.value || '未知'
          };
        });
        setForecast(forecastList);
      } catch (err) {
        console.error('天气获取失败:', err);
        if (!cancelled) {
          setWeather({ temp: '24', desc: '晴', city: '北京', icon: 'sun', loading: false });
          setForecast([]);
        }
      }
    };

    const abortController = new AbortController();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(),
        { timeout: 8000, enableHighAccuracy: false, signal: abortController.signal }
      );
    } else {
      fetchWeather();
    }
    return () => { cancelled = true; abortController.abort(); };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formData.image?.startsWith('blob:')) URL.revokeObjectURL(formData.image);
    if (!file.type.startsWith('image/')) { alert('请上传图片文件（jpg/png/webp）'); return; }
    const url = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, image: url, _file: file }));
  };

  const resetForm = useCallback(() => {
    if (formData.image?.startsWith('blob:')) URL.revokeObjectURL(formData.image);
    setFormData({});
    setModalType(null);
  }, [formData.image]);

  const saveCloth = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    const processAndSave = (imageData) => {
      setClothes(prev => [{
        id: Date.now(), name: formData.name.trim(), brand: formData.brand || '',
        category: formData.category || categories[0], desc: formData.desc || '',
        image: imageData || '', createdAt: new Date().toISOString()
      }, ...prev]);
      resetForm();
    };
    if (formData._file) {
      const reader = new FileReader();
      reader.onload = (ev) => processAndSave(ev.target.result);
      reader.readAsDataURL(formData._file);
    } else {
      processAndSave(formData.image || '');
    }
  };

  const deleteCloth = (id) => {
    setConfirmState({
      title: '确定删除这件衣物吗？',
      content: '',
      confirmText: '删除',
      onConfirm: () => {
        setClothes(prev => prev.filter(c => c.id !== id));
        setConfirmState(null);
      }
    });
  };

  const addCategory = (e) => {
    e.preventDefault();
    const name = formData.name?.trim();
    if (name && !categories.includes(name)) { setCategories(prev => [...prev, name]); resetForm(); }
  };

  const deleteCategory = (cat) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return;
    setConfirmState({
      title: '删除分类',
      content: `确定删除${cat}分类？`,
      confirmText: '删除',
      onConfirm: () => {
        setCategories(prev => prev.filter(c => c !== cat));
        if (activeTab === cat) setActiveTab('全部');
        setConfirmState(null);
      }
    });
  };

  const toggleOutfitItem = (clothId) => {
    const selected = formData.items || [];
    setFormData(prev => ({ ...prev, items: selected.includes(clothId) ? selected.filter(id => id !== clothId) : [...selected, clothId] }));
  };

  const saveOutfit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.items?.length) return;
    const outfit = { id: formData.id || Date.now(), name: formData.name.trim(), items: formData.items, note: formData.note || '', updatedAt: new Date().toISOString() };
    setOutfits(prev => formData.id ? prev.map(o => o.id === formData.id ? outfit : o) : [outfit, ...prev]);
    resetForm();
  };

  const filteredClothes = activeTab === '全部' ? clothes : clothes.filter(c => c.category === activeTab);

  return (
    <div className="of-container">
      <div className="of-glass-card">
        {/* ===== 头部 ===== */}
        <header className="of-header">
          <div className="of-header-left">
            <h1>衣橱</h1>
            <div className="of-view-switcher">
              <button className={viewMode === 'closet' ? 'active' : ''} onClick={() => setViewMode('closet')}>
                单品
              </button>
              <button className={viewMode === 'outfit' ? 'active' : ''} onClick={() => setViewMode('outfit')}>
                搭配
              </button>
            </div>
          </div>

          <div className="of-weather-widget" onClick={() => !weather.loading && setShowForecast(!showForecast)}>
            {weather.loading ? (
              <span className="of-weather-loading">定位中...</span>
            ) : (
              <>
                <CssIcon name={weather.icon} size={24} className="of-weather-icon" />
                <div className="of-weather-info">
                  <span className="of-weather-temp">{weather.temp}°C</span>
                  <span className="of-weather-desc">{weather.city} · {weather.desc}</span>
                </div>
                {forecast.length > 0 && (
                  <CssIcon name={showForecast ? 'chevron-up' : 'chevron-down'} size={12} className="of-weather-toggle" />
                )}
              </>
            )}
            {showForecast && forecast.length > 0 && (
              <div className="of-forecast-panel" onClick={e => e.stopPropagation()}>
                <div className="of-forecast-title">未来{forecast.length}天天气预报</div>
                <div className="of-forecast-list">
                  {forecast.map((day, i) => (
                    <div key={i} className="of-forecast-item">
                      <span className="of-fc-date">{day.date}{day.weekday && ` ${day.weekday}`}</span>
                      <CssIcon name={day.icon} size={16} className="of-fc-icon" />
                      <span className="of-fc-desc">{day.desc}</span>
                      <span className="of-fc-temp">{day.tempMin}° / {day.tempMax}°</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ===== 主内容 ===== */}
        {viewMode === 'closet' ? (
          <>
            <div className="of-filter-bar">
              <div className="of-filter-tabs">
                <button className={`of-tab ${activeTab === '全部' ? 'active' : ''}`} onClick={() => setActiveTab('全部')}>
                  全部 ({clothes.length})
                </button>
                {categories.map(cat => (
                  <button key={cat} className={`of-tab ${activeTab === cat ? 'active' : ''}`} onClick={() => setActiveTab(cat)}>
                    {cat}
                    {!DEFAULT_CATEGORIES.includes(cat) && activeTab === cat && (
                      <span className="of-tab-del" onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }} />
                    )}
                  </button>
                ))}
                <button className="of-tab of-tab-add" onClick={() => { setFormData({}); setModalType('addCat'); }}>
                  <CssIcon name="plus" size={12} /> 新分类
                </button>
              </div>
              <button className="of-btn-primary-sm" onClick={() => {
                setFormData({ category: activeTab !== '全部' ? activeTab : categories[0] });
                setModalType('addCloth');
              }}>
                <CssIcon name="upload" size={14} /> 添加衣物
              </button>
            </div>

            <div className="of-closet-grid">
              {filteredClothes.length > 0 ? filteredClothes.map(item => (
                <div key={item.id} className="of-cloth-card">
                  <div className="of-cloth-img-wrap">
                    {item.image ? (
                      <img src={item.image} alt={item.name} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="of-cloth-placeholder"><CssIcon name="image" size={32} /></div>
                    )}
                    <button className="of-cloth-del" onClick={() => deleteCloth(item.id)} aria-label="删除衣物">
                    </button>
                  </div>
                  <div className="of-cloth-info">
                    <span className="of-cloth-cat">{item.category}</span>
                    <div className="of-cloth-name">{item.name}</div>
                    <div className="of-cloth-meta">{item.brand}{item.brand && item.desc && ' · '}{item.desc}</div>
                  </div>
                </div>
              )) : (
                <div className="of-empty-state">
                  <p>暂无{activeTab === '全部' ? '' : `「${activeTab}」`}单品</p>
                  <button onClick={() => {
                    setFormData({ category: activeTab !== '全部' ? activeTab : categories[0] });
                    setModalType('addCloth');
                  }}>去添加</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="of-outfit-view">
            <div className="of-outfit-list">
              {outfits.map(o => (
                <div key={o.id} className="of-outfit-card">
                  <div className="of-outfit-preview">
                    {o.items.slice(0, 4).map(itemId => {
                      const c = clothes.find(x => x.id === itemId);
                      return c?.image ? <img key={itemId} src={c.image} alt="" loading="lazy" /> : <div key={itemId} className="of-outfit-preview-empty"></div>;
                    })}
                    {o.items.length === 0 && <span className="of-outfit-empty-hint">无单品</span>}
                  </div>
                  <div className="of-outfit-detail">
                    <h3>{o.name}</h3>
                    <p>{o.note || '暂无备注'}</p>
                    <span className="of-outfit-count">{o.items.length} 件单品</span>
                  </div>
                  <div className="of-outfit-actions">
                    <button onClick={() => { setFormData(o); setModalType('editOutfit'); }} aria-label="编辑搭配">编辑搭配</button>
                    <button onClick={() => setOutfits(prev => prev.filter(x => x.id !== o.id))} aria-label="删除搭配">删除搭配</button>
                  </div>
                </div>
              ))}
              <button className="of-outfit-add-card" onClick={() => { setFormData({ items: [] }); setModalType('addOutfit'); }} aria-label="创建新搭配">
                <CssIcon name="plus" size={24} />
                <span>创建新搭配</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {modalType && (
        <div className="of-modal-overlay" onClick={resetForm}>
          <div className="of-modal" onClick={e => e.stopPropagation()}>
            <div className="of-modal-head">
              <h2>
                {modalType === 'addCloth' && '添加衣物'}
                {modalType === 'addCat' && '新建分类'}
                {modalType === 'addOutfit' && '创建搭配'}
                {modalType === 'editOutfit' && '编辑搭配'}
              </h2>
              <button className="of-modal-close" onClick={resetForm} aria-label="关闭"><CssIcon name="x" size={14} /></button>
            </div>

            {modalType === 'addCloth' && (
              <form onSubmit={saveCloth}>
                <div className="of-img-upload-area" onClick={() => fileInputRef.current?.click()}>
                  {formData.image ? <img src={formData.image} alt="preview" /> : <><CssIcon name="upload" size={32} /><span>点击上传照片</span></>}
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </div>
                <input required placeholder="名称" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                <div className="of-form-row">
                  <input placeholder="品牌" value={formData.brand || ''} onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
                  <select value={formData.category || categories[0]} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea placeholder="描述" rows={2} value={formData.desc || ''} onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))} />
                <button type="submit" className="of-btn-submit">保存衣物</button>
              </form>
            )}

            {modalType === 'addCat' && (
              <form onSubmit={addCategory}>
                <input required placeholder="分类名称" autoFocus value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                <button type="submit" className="of-btn-submit">创建分类</button>
              </form>
            )}

            {(modalType === 'addOutfit' || modalType === 'editOutfit') && (
              <form onSubmit={saveOutfit}>
                <input required placeholder="搭配名称" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                <textarea placeholder="穿搭备注/适用场合" rows={2} value={formData.note || ''} onChange={e => setFormData(p => ({ ...p, note: e.target.value }))} />
                <label className="of-picker-label">选择单品 ({(formData.items || []).length})</label>
                <div className="of-cloth-picker">
                  {clothes.map(c => (
                    <div key={c.id} className={`of-picker-item ${(formData.items || []).includes(c.id) ? 'selected' : ''}`} onClick={() => toggleOutfitItem(c.id)}>
                      {c.image ? <img src={c.image} alt="" /> : <CssIcon name="image" size={16} />}
                      {(formData.items || []).includes(c.id) && <div className="of-picker-check"><CssIcon name="check" size={12} /></div>}
                    </div>
                  ))}
                  {clothes.length === 0 && <p className="of-picker-empty">请先添加衣物</p>}
                </div>
                <button type="submit" className="of-btn-submit">保存搭配</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      {confirmState && (
        <div className="of-confirm-overlay" onClick={() => setConfirmState(null)}>
          <div className="of-confirm-dialog" onClick={e => e.stopPropagation()}>
            <button
              className="of-confirm-close-btn"
              onClick={() => setConfirmState(null)}
              aria-label="关闭"
            >
              <span className="of-close-x"></span>
            </button>

            <h3 className="of-confirm-title">{confirmState.title}</h3>

            {confirmState.content && (
              <p className="of-confirm-content">{confirmState.content}</p>
            )}

            <button
              className="of-btn-confirm-full"
              onClick={confirmState.onConfirm}
            >
              {confirmState.confirmText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outfit;