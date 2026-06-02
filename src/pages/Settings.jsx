import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../main';
import '../styles/Settings.css';

const Settings = () => {
  const { theme: currentTheme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const themes = [
    { id: 'theme-qiacao', name: '浅草物语', desc: '清爽治愈绿' },
    { id: 'theme-yunluo', name: '云落深汀', desc: '深邃静谧蓝' },
    { id: 'theme-yingchui', name: '樱吹雪时', desc: '浪漫樱花粉' },
    { id: 'theme-yuebai', name: '月白无尘', desc: '极简淡雅白' },
    { id: 'theme-yepo', name: '夜泊星野', desc: '暗夜星空紫' },
    { id: 'theme-juse', name: '橘色黄昏', desc: '温暖治愈橙' },
  ];

  const handleLogoutClick = () => setShowConfirm(true);

  const handleConfirmLogout = () => {
    try {
      // 获取当前登录的用户名
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);

        // 从 usersDB 中永久删除该用户
        const usersDBStr = localStorage.getItem('usersDB');
        if (usersDBStr) {
          const usersDB = JSON.parse(usersDBStr);
          const updatedUsersDB = usersDB.filter(
            (user) => user.username !== currentUser.username
          );
          localStorage.setItem('usersDB', JSON.stringify(updatedUsersDB));
          console.log(`账户 "${currentUser.username}" 已从数据库中永久删除`);
        }
      }

      // 清除当前登录状态
      localStorage.removeItem('isLogin');
      localStorage.removeItem('currentUser');

      console.log('账户已注销，本地登录数据已清除');
      setShowConfirm(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  const handleCancelLogout = () => setShowConfirm(false);

  return (
    <div className="settings-page">
      {/* 主题选择区域 - 无卡片包裹 */}
      <section className="settings-section">
        <h3 className="section-title">更换主题</h3>
        <div className="theme-list">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-item ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => setTheme(theme.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setTheme(theme.id)}
              aria-pressed={currentTheme === theme.id}
            >
              {/* 纯CSS绘制：主题预览球体 */}
              <div className="css-theme-preview">
                <span className="preview-dot" />
                <span className="preview-ring" />
              </div>

              <div className="theme-text">
                <span className="theme-name">{theme.name}</span>
                <span className="theme-desc">{theme.desc}</span>
              </div>

              <div 
                className="css-checkmark"
                role="img"
                aria-label="已选中"
                tabIndex={-1}
              >
                <span />
                <span />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 账户管理区域 */}
      <section className="settings-section danger-zone">
        <h3 className="section-title">账户管理</h3>
        <p className="logout-warning">
          注销后将永久删除当前账户及所有关联数据，删除后无法恢复，需重新注册才能使用。
        </p>
        <button className="css-logout-btn" onClick={handleLogoutClick} type="button">
          {/* 纯CSS绘制：退出图标 */}
          <span className="icon-door">
            <span className="door-frame" />
            <span className="door-arrow" />
          </span>
          <span className="btn-text">注销账户</span>
        </button>
      </section>

      {/* 纯CSS绘制：自定义确认弹窗 */}
      <div className={`confirm-overlay ${showConfirm ? 'show' : ''}`} onClick={handleCancelLogout}>
        <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="confirm-header">
            <h4 className="confirm-title">确定要永久删除当前账户吗？</h4>
            <button className="confirm-close-btn" onClick={handleCancelLogout} aria-label="关闭">
              <span className="close-x" />
            </button>
          </div>
          <p className="confirm-content">
            这将永久删除当前账户及所有关联数据，删除后无法恢复。确认删除后将返回登录页，需重新注册才能使用。
          </p>
          <div className="confirm-actions">
            <button className="btn-confirm-cancel" onClick={handleCancelLogout}>取消</button>
            <button className="btn-confirm-ok" onClick={handleConfirmLogout}>确定删除</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;