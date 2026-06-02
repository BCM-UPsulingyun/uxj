import React, { useState, useContext } from 'react'
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { 
  Home as HomeIcon, BookOpen, Shirt, 
  Calendar, PieChart, Settings, LogOut, GraduationCap, Heart,
  ChevronLeft, ChevronRight  
} from 'lucide-react'

// 引入 ThemeContext
import { ThemeContext } from './main'

// 导入所有页面组件
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import Curriculum from './pages/Curriculum' 
import Diary from './pages/Diary'          
import Hobby from './pages/Hobby'           
import Outfit from './pages/Outfit'        
import Plan from './pages/Plan'            
import SettingsPage from './pages/Settings'
import Accounts from './pages/Accounts'    

import './App.css'

// 路由守卫组件 
const ProtectedRoute = ({ children }) => {
  const isLogin = localStorage.getItem('isLogin') === 'true'
  if (!isLogin) {
    return <Navigate to="/login" replace />
  }
  return children
}

//  侧边栏组件 
const Sidebar = ({ isCollapsed, toggleSidebar }) => { 
  const location = useLocation()
  const navigate = useNavigate()
  
  // 在侧边栏中也使用 Context (用于退出登录重置主题)
  const { setTheme } = useContext(ThemeContext)
  
  // 导航菜单配置
  const navItems = [
    { path: '/app/', label: '首页', icon: <HomeIcon size={20} /> },
    { path: '/app/curriculum', label: '课程表', icon: <GraduationCap size={20} /> },
    { path: '/app/diary', label: '日记', icon: <BookOpen size={20} /> },
    { path: '/app/hobby', label: '爱好', icon: <Heart size={20} /> },
    { path: '/app/outfit', label: '穿搭', icon: <Shirt size={20} /> },
    { path: '/app/plan', label: '计划', icon: <Calendar size={20} /> },
    { path: '/app/accounts', label: '账本', icon: <PieChart size={20} /> },
    { path: '/app/settings', label: '设置', icon: <Settings size={20} /> },
  ]

  const handleLogout = () => {
    localStorage.removeItem('isLogin')
    localStorage.removeItem('currentUser')
    setTheme('theme-qiacao') // 退出重置为默认
    navigate('/login')
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2>unfold·星境</h2>}
        <button onClick={toggleSidebar} className="collapse-btn">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
         <button className="nav-link logout-link" onClick={handleLogout}>
          <LogOut size={20} />
          {!isCollapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  )
}

// 核心应用布局与路由 
function App() {
  //  订阅 ThemeContext 以获取当前主题类名
  const { theme } = useContext(ThemeContext)
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed)

  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  return (
    //  将 theme 变量作为 className 绑定到最外层
    // 这样背景图样式会应用在这里，而 LoginPage 会通过 fixed 定位覆盖它
    <div className={`app-wrapper ${theme}`}>
      
      {!isLoginPage && (
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      )}

      <main className={`page-container ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route 
            path="/" 
            element={
              localStorage.getItem('isLogin') === 'true' 
                ? <Navigate to="/app/" replace /> 
                : <Navigate to="/login" replace />
            } 
          />
          
          <Route path="/app/*" element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="curriculum" element={<Curriculum />} />
                <Route path="diary" element={<Diary />} />
                <Route path="hobby" element={<Hobby />} />
                <Route path="outfit" element={<Outfit />} />
                <Route path="plan" element={<Plan />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="accounts" element={<Accounts />} />
              </Routes>
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App