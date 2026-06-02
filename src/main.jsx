import React, { useState, createContext, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 将 BrowserRouter 改为 HashRouter
import { HashRouter } from 'react-router-dom'

// 全局样式引入
import './App.css'

// 创建主题上下文
export const ThemeContext = createContext()

export const ThemeContextProvider = ({ children }) => {
  // 辅助函数：获取当前用户的唯一标识（优先 username，其次 id）
  const getCurrentUserKey = () => {
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return null
    try {
      const user = JSON.parse(userStr)
      return user ? (user.username || user.id || userStr) : null
    } catch {
      return userStr
    }
  }

  // 初始化主题：从 LocalStorage 读取对应当前账号的主题
  const [theme, setThemeState] = useState(() => {
    const userKey = getCurrentUserKey()
    if (!userKey) return 'theme-qiacao'
    return localStorage.getItem(`app-theme-${userKey}`) || 'theme-qiacao'
  })

  // 切换主题：更新状态并绑定到当前账号存储
  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    const userKey = getCurrentUserKey()
    if (userKey) {
      localStorage.setItem(`app-theme-${userKey}`, newTheme)
    }
  }

  useEffect(() => {
    document.body.className = ''
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// 渲染根组件
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*  这里也要改成 HashRouter */}
    <HashRouter>
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    </HashRouter>
  </React.StrictMode>
)