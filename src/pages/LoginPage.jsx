import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/LoginPage.css'
import bgImage from '../assets/bg.png' 
import iconImage from '../assets/icon.png' 

const LoginPage = () => {
  const navigate = useNavigate()
  
  // 判断当前是登录模式还是注册模式
  const [isLoginMode, setIsLoginMode] = useState(true)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 处理登录和注册的统一逻辑
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入您的用户名和密码')
      return
    }

    setIsLoading(true)

    // 模拟网络请求延迟，提升交互体验
    setTimeout(() => {
      // 从 localStorage 获取已注册的用户列表（模拟数据库）
      const usersDB = JSON.parse(localStorage.getItem('usersDB')) || []

      if (isLoginMode) {
        // --- 登录逻辑 ---
        const user = usersDB.find(u => u.username === username && u.password === password)
        if (user) {
          // 登录成功，保存当前登录状态
          localStorage.setItem('isLogin', 'true')
          localStorage.setItem('currentUser', JSON.stringify(user))
          navigate('/app') 
        } else {
          setError('用户名或密码错误，请先注册！')
        }
      } else {
        // --- 注册逻辑 ---
        const userExists = usersDB.find(u => u.username === username)
        if (userExists) {
          setError('该用户名已被注册，请直接登录！')
        } else {
          // 将新用户存入数据库
          const newUser = { username, password }
          usersDB.push(newUser)
          localStorage.setItem('usersDB', JSON.stringify(usersDB))
          
          // 注册成功后自动登录
          localStorage.setItem('isLogin', 'true')
          localStorage.setItem('currentUser', JSON.stringify(newUser))
          navigate('/app') 
        }
      }
      setIsLoading(false)
    }, 500)
  }

  // 切换 登录/注册 模式
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setError('')
    setUsername('')
    setPassword('')
  }

  return (
    <div 
      className="login-page-wrapper" 
      style={{ 
        backgroundImage: `url(${bgImage})`,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#1a1a2e' 
      }}
    >
      
      {/* 核心内容区域：左右布局 */}
      <div className="login-main-layout">
        
        {/* --- 左侧：品牌展示区 --- */}
        <div className="login-left-panel">
          <div className="brand-content">
            <img src={iconImage} alt="Logo" className="brand-logo-large" />
            <h1 className="brand-title">unfold · 星境</h1>
            <p className="brand-subtitle">典藏流年光景，凌云问鼎星河</p>
          </div>
        </div>

        {/* --- 右侧：登录表单区 --- */}
        <div className="login-right-panel">
          <div className="login-card">
            <div className="form-header">
              <h2>{isLoginMode ? '欢迎回来' : '注册新账号'}</h2>
              <p>踏遍云途，星境相逢</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  placeholder="请输入您的用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? '处理中...' : (isLoginMode ? '立即登录' : '立即注册')}
              </button>
            </form>

            <div className="login-footer">
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>
                  {isLoginMode ? '还没有账号？' : '已有账号？'}
                </span>
                <button 
                  type="button" 
                  onClick={toggleMode}
                  className="toggle-mode-btn"
                >
                  {isLoginMode ? '去注册' : '去登录'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage