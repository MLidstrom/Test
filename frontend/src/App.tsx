import { useState, useEffect } from 'react'
import './App.css'

interface Submission {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

function App() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [apiHealthy, setApiHealthy] = useState(false)

  const API_URL = 'http://localhost:5298/api'

  // Check API health on mount
  useEffect(() => {
    checkHealth()
    loadSubmissions()
  }, [])

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`)
      setApiHealthy(response.ok)
    } catch {
      setApiHealthy(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`${API_URL}/submissions`)
      if (!response.ok) throw new Error('Failed to load submissions')
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage({ type: 'error', text: 'Name and email are required' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Submission failed')
      }

      setMessage({ type: 'success', text: '✓ Submission successful!' })
      setFormData({ name: '', email: '', message: '' })
      await loadSubmissions()

      // Clear message after 3s
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: `✗ ${error instanceof Error ? error.message : 'Submission failed'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Test App</h1>
      <p className="subtitle">Submit your information below</p>

      {!apiHealthy && (
        <div className="message error">
          ✗ API is not available. Make sure the backend is running.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!apiHealthy}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!apiHealthy}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            placeholder="Tell us something..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            disabled={!apiHealthy}
          />
        </div>

        <button type="submit" disabled={loading || !apiHealthy}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </form>

      {submissions.length > 0 && (
        <div className="submissions">
          <h2>Recent Submissions</h2>
          <div className="submissions-list">
            {submissions.map((sub) => (
              <div key={sub.id} className="submission-item">
                <div className="submission-name">{sub.name}</div>
                <div className="submission-email">{sub.email}</div>
                {sub.message && <div className="submission-message">{sub.message}</div>}
                <div className="submission-date">
                  {new Date(sub.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
