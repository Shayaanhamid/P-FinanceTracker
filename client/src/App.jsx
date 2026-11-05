import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import './App.css'

const API_URL = 'http://localhost:5000/api/transactions'
const BUDGET_API_URL = 'http://localhost:5000/api/budgets'
const AUTH_API_URL = 'http://localhost:5000/api/users'

const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Bills', 'Other']

function App() {
  const [transactions, setTransactions] = useState([])

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [category, setCategory] = useState('Food')

  const [token, setToken] = useState(localStorage.getItem('token') || '')

  // Login and Register states
  const [authMode, setAuthMode] = useState('login')
  const [authName, setAuthName] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState(null)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Date filter states
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Budget states
  const [budgets, setBudgets] = useState([])
  const [budgetCategory, setBudgetCategory] = useState('Food')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetLoading, setBudgetLoading] = useState(false)

  const [budgetMonth, setBudgetMonth] = useState(
    new Date().getMonth() + 1
  )

  const [budgetYear, setBudgetYear] = useState(
    new Date().getFullYear()
  )

  // Login and Register function
  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')

    if (!authUsername.trim() || !authPassword) {
      setAuthError('Please enter username and password.')
      return
    }

    if (authMode === 'register') {
      if (!authName.trim() || !authEmail.trim()) {
        setAuthError('Please fill in all fields.')
        return
      }

      if (authPassword.length < 8) {
        setAuthError('Password must be at least 8 characters.')
        return
      }
    }

    try {
      setAuthLoading(true)

      const endpoint =
        authMode === 'login' ? '/login' : '/register'

      const body =
        authMode === 'login'
          ? {
              username: authUsername.trim(),
              password: authPassword,
            }
          : {
              name: authName.trim(),
              username: authUsername.trim(),
              email: authEmail.trim(),
              password: authPassword,
            }

      const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.')
      }

      localStorage.setItem('token', data.token)
      setToken(data.token)

      setAuthName('')
      setAuthUsername('')
      setAuthEmail('')
      setAuthPassword('')
      setAuthError('')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Fetch transactions
  async function fetchTransactions() {
    if (!token) return

    try {
      setLoading(true)

      const response = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Session expired. Please login again.')
        }

        throw new Error(data.message || 'Failed to fetch transactions')
      }

      setTransactions(data)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch budgets
  async function fetchBudgets() {
    if (!token) return

    try {
      setBudgetLoading(true)

      const response = await fetch(
        `${BUDGET_API_URL}?month=${budgetMonth}&year=${budgetYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          throw new Error('Session expired. Please login again.')
        }

        throw new Error(data.message || 'Failed to fetch budgets')
      }

      setBudgets(data)
    } catch (error) {
      alert(error.message)
    } finally {
      setBudgetLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchTransactions()
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchBudgets()
    }
  }, [token, budgetMonth, budgetYear])

  // Dashboard totals
  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const totalExpense = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const totalBalance = totalIncome - totalExpense

  // Search, type and date filter
  const filteredTransactions = transactions.filter((item) => {
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      item.title.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)

    const matchesType =
      filterType === 'all' || item.type === filterType

    const itemDate = new Date(item.date)
    const now = new Date()

    let matchesDate = true

    if (dateFilter === 'today') {
      matchesDate =
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
    } else if (dateFilter === 'month') {
      matchesDate =
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
    } else if (dateFilter === 'year') {
      matchesDate = itemDate.getFullYear() === now.getFullYear()
    } else if (dateFilter === 'custom') {
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`)
        matchesDate = matchesDate && itemDate >= start
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`)
        matchesDate = matchesDate && itemDate <= end
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  // Pie chart data
  const pieData = [
    { name: 'Income', value: totalIncome },
    { name: 'Expense', value: totalExpense },
  ].filter((item) => item.value > 0)

  // Monthly bar chart data
  const monthlyMap = {}

  transactions.forEach((item) => {
    const date = new Date(item.date)

    const month = date.toLocaleString('en-IN', {
      month: 'short',
      year: 'numeric',
    })

    if (!monthlyMap[month]) {
      monthlyMap[month] = {
        month,
        income: 0,
        expense: 0,
      }
    }

    if (item.type === 'income') {
      monthlyMap[month].income += Number(item.amount)
    } else {
      monthlyMap[month].expense += Number(item.amount)
    }
  })

  const monthlyData = Object.values(monthlyMap).reverse()

  // Reset transaction form
  function cancelEdit() {
    setEditId(null)
    setTitle('')
    setAmount('')
    setType('expense')
    setCategory('Food')
  }

  // Add or update transaction
  async function addTransaction(e) {
    e.preventDefault()

    if (!title.trim() || !amount || Number(amount) <= 0) {
      alert('Please enter a title and valid amount')
      return
    }

    try {
      const isEditing = Boolean(editId)

      const response = await fetch(
        isEditing ? `${API_URL}/${editId}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            amount: Number(amount),
            type,
            category,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save transaction')
      }

      if (isEditing) {
        setTransactions((previous) =>
          previous.map((item) =>
            item._id === editId ? data.transaction : item
          )
        )

        alert('Transaction updated successfully!')
      } else {
        setTransactions((previous) => [data, ...previous])
        alert('Transaction added successfully!')
      }

      cancelEdit()
      fetchBudgets()
    } catch (error) {
      alert(error.message)
    }
  }

  // Edit transaction
  function startEdit(item) {
    setEditId(item._id)
    setTitle(item.title)
    setAmount(item.amount)
    setType(item.type)
    setCategory(item.category)

    document.getElementById('add-transaction')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  // Delete transaction
  async function deleteTransaction(id) {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete transaction')
      }

      setTransactions((previous) =>
        previous.filter((item) => item._id !== id)
      )

      if (editId === id) {
        cancelEdit()
      }

      fetchBudgets()
      alert('Transaction deleted successfully!')
    } catch (error) {
      alert(error.message)
    }
  }

  // Save or update budget
  async function saveBudget(e) {
    e.preventDefault()

    if (!budgetAmount || Number(budgetAmount) <= 0) {
      alert('Please enter a valid budget amount')
      return
    }

    try {
      const response = await fetch(BUDGET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: budgetCategory,
          amount: Number(budgetAmount),
          month: budgetMonth,
          year: budgetYear,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save budget')
      }

      setBudgetAmount('')
      await fetchBudgets()

      alert('Budget saved successfully!')
    } catch (error) {
      alert(error.message)
    }
  }

  // Delete budget
  async function deleteBudget(id) {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return
    }

    try {
      const response = await fetch(`${BUDGET_API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete budget')
      }

      await fetchBudgets()
      alert('Budget deleted successfully!')
    } catch (error) {
      alert(error.message)
    }
  }

  // Budget totals
  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  )

  const budgetSpent = budgets.reduce(
    (sum, item) => sum + Number(item.spent || 0),
    0
  )

  const budgetRemaining = totalBudget - budgetSpent

  // Logout
  function logout() {
    localStorage.removeItem('token')
    setToken('')
    setTransactions([])
    setBudgets([])
    setSearchTerm('')
    setFilterType('all')
    setDateFilter('all')
    setStartDate('')
    setEndDate('')
    cancelEdit()
  }

  // Sidebar filter helper
  function applyTypeFilter(selectedType) {
    setFilterType(selectedType)

    document.getElementById('transactions')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="app">
      {/* Professional Navbar */}
      <header className="navbar">
        <div className="brand">
          <h2>💰 Finance Tracker</h2>
        </div>

        <div className="navbar-right">
          {token && <span>My Dashboard</span>}

          {token && (
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Login and Register Page */}
      {!token ? (
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-logo">💰</div>

            <h1>Finance Tracker</h1>

            <p className="subtitle">
              Manage your money smartly and securely.
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('login')
                  setAuthError('')
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthMode('register')
                  setAuthError('')
                }}
              >
                Create Account
              </button>
            </div>

            <h2>
              {authMode === 'login'
                ? 'Welcome Back!'
                : 'Create Your Account'}
            </h2>

            <p>
              {authMode === 'login'
                ? 'Login to access your dashboard.'
                : 'Register to start managing your finances.'}
            </p>

            <form onSubmit={handleAuth} className="auth-form">
              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    autoComplete="name"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </>
              )}

              <input
                type="text"
                placeholder="Username"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoComplete={
                  authMode === 'login'
                    ? 'current-password'
                    : 'new-password'
                }
                required
              />

              {authError && (
                <p className="auth-error">{authError}</p>
              )}

              <button type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Login'
                    : 'Create Account'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    authMode === 'login' ? 'register' : 'login'
                  )
                  setAuthError('')
                }}
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </section>
        </main>
      ) : (
        <>
          <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
              <h3>MY WORKSPACE</h3>

              <a href="#dashboard">🏠 Dashboard</a>
              <a href="#analytics">📊 Analytics</a>
              <a href="#transactions">💳 Transactions</a>

              <a
                href="#transactions"
                onClick={() => applyTypeFilter('income')}
              >
                💚 Income
              </a>

              <a
                href="#transactions"
                onClick={() => applyTypeFilter('expense')}
              >
                🔴 Expenses
              </a>

              <a href="#budgets">🎯 Budgets</a>

              <a
                href="#transactions"
                onClick={() => {
                  setFilterType('all')
                  setDateFilter('all')
                  setStartDate('')
                  setEndDate('')
                  setSearchTerm('')
                }}
              >
                📋 All Records
              </a>
            </aside>

            {/* Main Dashboard */}
            <div className="dashboard-content">
              <main className="container">
                {/* Dashboard */}
                <section id="dashboard">
                  <h1>Dashboard</h1>

                  <p className="subtitle">
                    Manage your money smartly.
                  </p>

                  <section className="cards">
                    <div className="card balance">
                      <p>Total Balance</p>
                      <h2>
                        ₹{totalBalance.toLocaleString('en-IN')}
                      </h2>
                    </div>

                    <div className="card">
                      <p>Total Income</p>
                      <h2>
                        ₹{totalIncome.toLocaleString('en-IN')}
                      </h2>
                    </div>

                    <div className="card">
                      <p>Total Expenses</p>
                      <h2>
                        ₹{totalExpense.toLocaleString('en-IN')}
                      </h2>
                    </div>
                  </section>
                </section>

                {/* Financial Analytics */}
                <section className="panel" id="analytics">
                  <h2>Financial Analytics</h2>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                      gap: '24px',
                      width: '100%',
                    }}
                  >
                    {/* Pie Chart */}
                    <div
                      style={{
                        minWidth: 0,
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Income vs Expense</h3>

                      {pieData.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>No income or expense data available yet.</p>
                      ) : (
                        <div style={{ width: '100%', height: '280px', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                stroke="none"
                              >
                                {pieData.map((entry) => (
                                  <Cell
                                    key={entry.name}
                                    fill={entry.name === 'Income' ? '#10B981' : '#EF4444'}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="square" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Bar Chart */}
                    <div
                      style={{
                        minWidth: 0,
                        padding: '20px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Monthly Financial Overview</h3>

                      {monthlyData.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6b7280' }}>No monthly data available yet.</p>
                      ) : (
                        <div style={{ width: '100%', height: '280px', minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyData}
                              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 12 }} 
                                tickFormatter={(value) => `₹${value}`} 
                              />
                              <Tooltip
                                cursor={{ fill: '#f5f5f5' }}
                                formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="square" />

                              <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Budget Management */}
                <section className="panel" id="budgets">
                  <h2>💰 Budget Management</h2>

                  <p>
                    Set monthly budgets and track your spending.
                  </p>

                  {/* Budget Month and Year */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    <select
                      value={budgetMonth}
                      onChange={(e) =>
                        setBudgetMonth(Number(e.target.value))
                      }
                      style={{ padding: '10px' }}
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {new Date(2000, index).toLocaleString('en-IN', {
                            month: 'long',
                          })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={budgetYear}
                      onChange={(e) =>
                        setBudgetYear(Number(e.target.value))
                      }
                      style={{ padding: '10px' }}
                    >
                      {Array.from(
                        { length: 6 },
                        (_, index) => new Date().getFullYear() - 2 + index
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Budget Summary */}
                  <div className="cards">
                    <div className="card">
                      <p>Total Budget</p>
                      <h2>
                        ₹{totalBudget.toLocaleString('en-IN')}
                      </h2>
                    </div>

                    <div className="card">
                      <p>Total Budget Spent</p>
                      <h2>
                        ₹{budgetSpent.toLocaleString('en-IN')}
                      </h2>
                    </div>

                    <div className="card">
                      <p>Remaining Budget</p>
                      <h2
                        style={{
                          color: budgetRemaining < 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        ₹{budgetRemaining.toLocaleString('en-IN')}
                      </h2>
                    </div>
                  </div>

                  {/* Add Budget Form */}
                  <h3>Set Category Budget</h3>

                  <form
                    onSubmit={saveBudget}
                    className="transaction-form"
                  >
                    <select
                      value={budgetCategory}
                      onChange={(e) =>
                        setBudgetCategory(e.target.value)
                      }
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Enter budget amount (₹)"
                      min="1"
                      step="0.01"
                      value={budgetAmount}
                      onChange={(e) =>
                        setBudgetAmount(e.target.value)
                      }
                      required
                    />

                    <button type="submit">+ Save Budget</button>
                  </form>

                  {/* Budget List */}
                  <h3 style={{ marginTop: '25px' }}>
                    Category-wise Budget Overview
                  </h3>

                  {budgetLoading ? (
                    <p>Loading budgets...</p>
                  ) : budgets.length === 0 ? (
                    <p>
                      No budgets set for this month. Add your first budget!
                    </p>
                  ) : (
                    budgets.map((item) => {
                      const spent = Number(item.spent || 0)
                      const budget = Number(item.amount)
                      const remaining = budget - spent
                      const percentage =
                        budget > 0 ? (spent / budget) * 100 : 0

                      return (
                        <div
                          key={item._id}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: '12px',
                            padding: '18px',
                            marginBottom: '15px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px',
                            }}
                          >
                            <div>
                              <h3 style={{ margin: '0 0 8px' }}>
                                {item.category}
                              </h3>

                              <p>
                                Budget: ₹{budget.toLocaleString('en-IN')}
                              </p>

                              <p>
                                Spent: ₹{spent.toLocaleString('en-IN')}
                              </p>

                              <p
                                style={{
                                  color:
                                    remaining < 0 ? '#dc2626' : '#16a34a',
                                  fontWeight: 'bold',
                                }}
                              >
                                {remaining < 0
                                  ? `Exceeded by ₹${Math.abs(remaining).toLocaleString('en-IN')}`
                                  : `Remaining: ₹${remaining.toLocaleString('en-IN')}`}
                              </p>
                            </div>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() => deleteBudget(item._id)}
                            >
                              Delete Budget
                            </button>
                          </div>

                          {/* Progress Bar */}
                          <div
                            style={{
                              height: '12px',
                              background: '#e5e7eb',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              marginTop: '12px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(percentage, 100)}%`,
                                background:
                                  percentage > 100 ? '#dc2626' : '#16a34a',
                                borderRadius: '20px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>

                          <p style={{ marginTop: '8px' }}>
                            {percentage.toFixed(1)}% used
                          </p>

                          {item.exceeded && (
                            <p
                              style={{
                                color: '#dc2626',
                                fontWeight: 'bold',
                              }}
                            >
                              ⚠️ Budget Exceeded! You have spent more than your budget.
                            </p>
                          )}
                        </div>
                      )
                    })
                  )}
                </section>

                {/* Add and Edit Transaction */}
                <section className="panel" id="add-transaction">
                  <h2>
                    {editId ? 'Edit Transaction' : 'Add Transaction'}
                  </h2>

                  <form
                    onSubmit={addTransaction}
                    className="transaction-form"
                  >
                    <input
                      type="text"
                      placeholder="Transaction name"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />

                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />

                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>

                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Food">Food</option>
                      <option value="Salary">Salary</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Travel">Travel</option>
                      <option value="Bills">Bills</option>
                      <option value="Other">Other</option>
                    </select>

                    <button type="submit">
                      {editId
                        ? 'Update Transaction'
                        : '+ Add Transaction'}
                    </button>

                    {editId && (
                      <button type="button" onClick={cancelEdit}>
                        Cancel Edit
                      </button>
                    )}
                  </form>
                </section>

                {/* Recent Transactions */}
                <section className="panel" id="transactions">
                  <h2>Recent Transactions</h2>

                  {/* Search and Type Filter */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '20px',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: '1',
                        minWidth: '200px',
                        padding: '10px',
                      }}
                    />

                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        minWidth: '150px',
                        padding: '10px',
                      }}
                    >
                      <option value="all">All Transactions</option>
                      <option value="income">Income Only</option>
                      <option value="expense">Expense Only</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '20px',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{
                        minWidth: '180px',
                        padding: '10px',
                      }}
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                      <option value="custom">Custom Date Range</option>
                    </select>

                    {dateFilter === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          aria-label="Start date"
                        />

                        <input
                          type="date"
                          value={endDate}
                          min={startDate || undefined}
                          onChange={(e) => setEndDate(e.target.value)}
                          aria-label="End date"
                        />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter('all')
                        setStartDate('')
                        setEndDate('')
                        setSearchTerm('')
                        setFilterType('all')
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>

                  {loading ? (
                    <p>Loading transactions...</p>
                  ) : transactions.length === 0 ? (
                    <p className="empty">
                      No transactions yet. Add your first one!
                    </p>
                  ) : filteredTransactions.length === 0 ? (
                    <p className="empty">
                      No transactions match your selected filters.
                    </p>
                  ) : (
                    filteredTransactions.map((item) => (
                      <div className="transaction" key={item._id}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.category} · {item.type}</p>
                          <small>
                            {new Date(item.date).toLocaleDateString('en-IN')}
                          </small>
                        </div>

                        <div className="transaction-right">
                          <strong
                            className={
                              item.type === 'income' ? 'green' : 'red'
                            }
                          >
                            {item.type === 'income' ? '+' : '-'}₹
                            {Number(item.amount).toLocaleString('en-IN')}
                          </strong>

                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => deleteTransaction(item._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </main>
            </div>
          </div>

          {/* Professional Footer */}
          <footer className="dashboard-footer">
            <p>
              © {new Date().getFullYear()} Personal Finance Tracker.
              All rights reserved.
            </p>

            <p>Manage your money. Plan your future.</p>

            <p>
              <a href="#dashboard">Home</a>
              <a href="#analytics">Analytics</a>
              <a href="#budgets">Budgets</a>
              <a href="#transactions">Transactions</a>
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

export default App