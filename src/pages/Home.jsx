import React, { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import defaultAvatar from '../assets/touxiang.png' 
import '../styles/Home.css'
import { Toaster, toast } from 'react-hot-toast' 

const Home = () => {
  // --- 状态管理 ---
  const [avatar, setAvatar] = useState(defaultAvatar)
  const [userInfo, setUserInfo] = useState({
    name: '',
    bio: '',
    hobby: '', 
    habit: ''  
  })

  // --- 初始化数据 ---
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        const user = JSON.parse(savedUser)
        setUserInfo({
          name: user.name ?? '',
          bio: user.bio ?? '',
          hobby: user.hobby ?? '',
          habit: user.habit ?? ''
        })
        setAvatar(user.avatar || defaultAvatar)
      }
    } catch (e) {
      console.error("读取用户信息失败:", e)
      toast.error('读取本地数据异常，已重置')
    }
  }, [])

  // --- 处理输入框变化 ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setUserInfo(prev => ({ ...prev, [name]: value }))
  }

  // --- 处理头像上传 ---
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 增加文件大小校验，防止 Base64 撑爆 localStorage (5MB限制)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB，请压缩后上传')
      e.target.value = '' // 清空 input 值
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const newAvatarBase64 = reader.result
      setAvatar(newAvatarBase64)
      
      // 统一数据保存逻辑，避免多处重复写入导致数据不一致
      try {
        const savedUserStr = localStorage.getItem('currentUser')
        const currentUser = savedUserStr ? JSON.parse(savedUserStr) : {}
        const updatedUser = { ...currentUser, avatar: newAvatarBase64 }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      } catch (err) {
        // 捕获 QUOTA_EXCEEDED_ERR
        if (err.name === 'QuotaExceededError') {
          toast.error('存储空间不足，头像保存失败')
          setAvatar(avatar) // 回滚预览
        } else {
          console.error("头像保存失败:", err)
        }
      }
    }
    reader.readAsDataURL(file)
    
    //  读取完成后立即清空 input，确保同一张图片可以重复选择触发 change
    e.target.value = ''
  }

  // --- 保存用户信息 ---
  const handleSave = () => {
    if (!userInfo.name.trim()) {
      toast.error('昵称不能为空')
      return
    }

    const dataToSave = { ...userInfo, avatar }
    
    try {
      //  更新当前登录用户信息
      localStorage.setItem('currentUser', JSON.stringify(dataToSave))
      
      // 使用唯一ID匹配代替 name 匹配，防止改名时丢失数据或误改他人数据
      const allUsersStr = localStorage.getItem('users')
      if (allUsersStr) {
        const allUsers = JSON.parse(allUsersStr)
        // 优先用 id 匹配，兼容旧版无 id 的情况降级为 name 匹配
        const updatedUsers = allUsers.map(u => 
          (u.id && u.id === dataToSave.id) || (!u.id && u.name === userInfo.name) 
            ? dataToSave 
            : u
        )
        localStorage.setItem('users', JSON.stringify(updatedUsers))
      }
      
      toast.success('保存成功！')
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        toast.error('存储空间已满，请清理部分数据后再试')
      } else {
        toast.error('保存失败，请重试')
      }
      console.error("保存用户信息失败:", err)
    }
  }

  return (
    <div className="profile-page">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* 顶部：头像与用户名区域 */}
      <div className="profile-top-section">
        <div className="avatar-container">
          <img src={avatar} alt="头像" className="main-avatar" />
          
          {/* 修改头像按钮 */}
          <label htmlFor="avatar-upload" className="change-avatar-btn">
            <Camera size={16} />
            <span>更换头像</span>
          </label>
          
          {/*  移除 value=""，改用 onChange 中手动清空，消除 React 警告并保证功能正常 */}
          <input 
            id="avatar-upload" 
            type="file" 
            accept="image/*" 
            onChange={handleAvatarChange} 
            style={{ display: 'none' }}
          />
        </div>

        {/* 用户名显示 */}
        <div className="username-display">
          <input 
            type="text" 
            name="name" 
            value={userInfo.name} 
            onChange={handleInputChange} 
            className="name-input"
            placeholder="点击此处修改昵称"
          />
        </div>
      </div>

      {/* 底部：表单区域 */}
      <div className="profile-form-section">
        <div className="form-row">
          <label>个性签名</label>
          <input 
            type="text" 
            name="bio" 
            value={userInfo.bio} 
            onChange={handleInputChange} 
            placeholder="请输入个性签名"
          />
        </div>

        <div className="form-row">
          <label>兴趣爱好</label>
          <input 
            type="text" 
            name="hobby" 
            value={userInfo.hobby} 
            onChange={handleInputChange} 
            placeholder="请输入兴趣爱好"
          />
        </div>

        <div className="form-row">
          <label>目标</label>
          <input 
            type="text" 
            name="habit" 
            value={userInfo.habit} 
            onChange={handleInputChange} 
            placeholder="请输入想要达成的目标"
          />
        </div>
      </div>

      {/* 悬浮保存按钮 */}
      <button className="floating-save-btn" onClick={handleSave}>
        保存修改
      </button>
    </div>
  )
}

export default Home