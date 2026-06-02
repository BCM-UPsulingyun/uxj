import React, { useState, useEffect, useMemo } from 'react';
import '../styles/Accounts.css';

// 预设分类配置
const CATEGORIES = {
  expense: [
    { id: 'study', name: '学习', color: '#5e9dc1' },
    { id: 'life', name: '生活', color: '#cba060' },
    { id: 'hobby', name: '兴趣', color: '#d473b3' },
    { id: 'food', name: '餐饮', color: '#8da47a' },
    { id: 'other', name: '其他', color: '#b080c7' },
  ],
  income: [
    { id: 'salary', name: '工资', color: '#c37373' },
    { id: 'parttime', name: '兼职', color: '#78bbc7' },
    { id: 'gift', name: '礼金', color: '#ce91af' },
    { id: 'other', name: '其他', color: '#8a73be' }
  ]
};

const Accounts = () => {
  // --- 状态管理 ---
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // 表单状态
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 支出/收入
  const [category, setCategory] = useState('life'); // 当前选中的分类
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // 默认今天

  // 筛选状态 (默认为当前月份)
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const [filterMonth, setFilterMonth] = useState(currentMonth);

  // --- 自定义弹窗/提示框 状态 ---
  const [toast, setToast] = useState({ show: false, message: '' }); // 自动消失的提示
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: () => {} }); // 确认弹窗

  // --- 数据持久化 ---
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // 根据筛选的月份过滤数据
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date && t.date.startsWith(filterMonth)) // 兼容旧数据
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterMonth]);

  // 计算总览数据
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  //  计算分类统计数据（用于画统计图）
  const categoryStats = useMemo(() => {
    const data = {};
    // 初始化当前类型的所有分类
    CATEGORIES[type].forEach(cat => { data[cat.id] = { ...cat, value: 0 }; });

    // 累加金额
    filteredTransactions
      .filter(t => t.type === type)
      .forEach(t => {
        if (data[t.category]) data[t.category].value += t.amount;
      });

    // 转为数组并过滤掉没数据的分类
    return Object.values(data).filter(item => item.value > 0);
  }, [filteredTransactions, type]);

  // 找出最大值，用来计算统计条的宽度百分比
  const maxCategoryValue = Math.max(...categoryStats.map(item => item.value), 1);

  // --- 事件处理 ---
  
  // 显示自动消失的提示框
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2500); // 2.5秒后自动消失
  };

  // 显示确认弹窗
  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const addTransaction = (e) => {
    e.preventDefault();
    if (!text.trim() || !amount || Number(amount) <= 0) {
      showToast('请输入正确的金额！');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      text,
      amount: Number(amount),
      type,
      category, // 新增分类字段
      date      // 新增日期字段
    };

    setTransactions([newTransaction, ...transactions]);
    setText('');
    setAmount('');
    showToast('记账成功！');
  };

  const deleteTransaction = (id) => {
    showConfirm("确定要删除这条记录吗？", () => {
      setTransactions(transactions.filter(t => t.id !== id));
      showToast('记录已删除');
    });
  };

  return (
    <div className="accounts-container">
      {/* 自定义 Toast 提示框 */}
      {toast.show && (
        <div className="custom-toast">
          {toast.message}
        </div>
      )}

      {/* 自定义 确认弹窗 */}
      {confirmModal.show && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="modal-content">{confirmModal.message}</div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel" 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              >
                取消
              </button>
              <button 
                className="modal-btn confirm" 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <h2>账本</h2>
        {/* 月份筛选器 */}
        <div className="month-selector">
          <label>查看月份：</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </header>

      {/* 统计概览卡片 */}
      <div className="stats-grid">
        <div className="stat-card balance">
          <h4>本月结余</h4>
          <h2 className={stats.balance >= 0 ? 'text-green' : 'text-red'}>
            {stats.balance >= 0 ? '+' : '-'}¥{Math.abs(stats.balance).toFixed(2)}
          </h2>
        </div>
        <div className="stat-card income">
          <h4>总收入</h4>
          <p className="text-green">¥{stats.income.toFixed(2)}</p>
        </div>
        <div className="stat-card expense">
          <h4>总支出</h4>
          <p className="text-red">¥{stats.expense.toFixed(2)}</p>
        </div>
      </div>

      <div className="main-content">
        {/* 左侧：记账表单 */}
        <section className="form-section">
          <h3>记账</h3>
          <form onSubmit={addTransaction}>
            {/* 收支类型切换 */}
            <div className="toggle-group">
              <button type="button" className={type === 'expense' ? 'active' : ''}
                onClick={() => { setType('expense'); setCategory('life'); }}>支出</button>
              <button type="button" className={type === 'income' ? 'active' : ''}
                onClick={() => { setType('income'); setCategory('salary'); }}>收入</button>
            </div>

            <div className="form-group">
              <label>金额 (¥)</label>
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>分类标签</label>
              <div className="category-grid">
                {CATEGORIES[type].map(cat => (
                  <button key={cat.id} type="button"
                    className={category === cat.id ? 'selected' : ''}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      borderColor: category === cat.id ? cat.color : '#ddd',
                      color: category === cat.id ? cat.color : '#666'
                    }}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>备注说明</label>
              <input type="text" placeholder="例如：买书、发工资..." value={text} onChange={(e) => setText(e.target.value)} required />
            </div>

            <button type="submit" className="btn-submit">确认记账</button>
          </form>
        </section>

        {/* 右侧：统计图表 + 列表 */}
        <section className="data-section">
          {/* 纯 CSS 实现的分类统计图 */}
          <div className="card chart-card">
            <h3>{type === 'income' ? '收入' : '支出'}构成分析</h3>
            {categoryStats.length === 0 ? (
              <div className="empty-chart">本月暂无{type === 'income' ? '收入' : '支出'}数据</div>
            ) : (
              <div className="css-bar-chart">
                {categoryStats.map((item) => (
                  <div key={item.id} className="bar-row">
                    <span className="bar-label">{item.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${(item.value / maxCategoryValue) * 100}%`,
                          backgroundColor: item.color
                        }}
                      >
                        <span className="bar-value">¥{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 交易记录列表 */}
          <div className="card list-card">
            <h3>交易明细</h3>
            <ul className="transaction-list">
              {filteredTransactions.length === 0 ? (
                <li className="empty-state">本月暂无记录</li>
              ) : (
                filteredTransactions.map(t => (
                  <li key={t.id} className="list-item">
                    <div className="item-info">
                      <span className="item-date">{t.date}</span>
                      <div className="item-details">
                        <span className="item-text">{t.text}</span>
                        <span className="item-cat" style={{ color: CATEGORIES[t.type].find(c => c.id === t.category)?.color }}>
                          {CATEGORIES[t.type].find(c => c.id === t.category)?.name}
                        </span>
                      </div>
                    </div>
                    <div className="item-action">
                      <span className={t.type === 'income' ? 'amount-plus' : 'amount-minus'}>
                        {t.type === 'income' ? '+' : '-'}{t.amount}
                      </span>
                      <button onClick={() => deleteTransaction(t.id)} className="del-btn">×</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Accounts;