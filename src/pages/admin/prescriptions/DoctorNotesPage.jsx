import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-toastify'

export default function DoctorNotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ title: '', content: '' })
  
  const storageKey = `doctor_advice_notes_${user?.id}`

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          setNotes(JSON.parse(saved))
        } catch(e) {}
      }
    }
  }, [user])

  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes)
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    if (editingId) {
      saveNotes(notes.map(n => n.id === editingId ? { ...n, ...formData } : n))
      toast.success('Note updated')
    } else {
      saveNotes([...notes, { id: Date.now().toString(), ...formData }])
      toast.success('Note added')
    }
    
    setEditingId(null)
    setFormData({ title: '', content: '' })
  }

  const handleEdit = (note) => {
    setEditingId(note.id)
    setFormData({ title: note.title, content: note.content })
  }

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this note?')) {
      saveNotes(notes.filter(n => n.id !== id))
      toast.success('Note deleted')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">📝 My Advice Notes</h2>
          <p className="admin-page-subtitle">Create and manage your reusable prescription advices</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Saved Advice Notes</h3>
          </div>
          {notes.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📝</div>
              <h4>No notes yet</h4>
              <p>Add some reusable advices to quickly select them in prescriptions.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Content</th>
                    <th style={{ width: 150 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(note => (
                    <tr key={note.id}>
                      <td style={{ fontWeight: 600 }}>{note.title}</td>
                      <td>
                        <div style={{ 
                          maxWidth: 300, 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#64748B'
                        }}>
                          {note.content}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button onClick={() => handleEdit(note)} className="admin-btn admin-btn-outline admin-btn-sm">✏️ Edit</button>
                          <button onClick={() => handleDelete(note.id)} className="admin-btn admin-btn-danger admin-btn-sm">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-card" style={{ alignSelf: 'start' }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">{editingId ? 'Edit Note' : 'Add New Note'}</h3>
          </div>
          <div className="admin-card-body" style={{ padding: 20 }}>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Note Title (Internal reference)</label>
                <input 
                  className="admin-form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Diet Plan, Rest..." 
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Prescription Advice Content</label>
                <textarea 
                  className="admin-form-textarea" 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={6}
                  placeholder="The actual advice text to print on prescription..." 
                />
              </div>
              <div className="admin-form-actions" style={{ gap: 10 }}>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFormData({title: '', content: ''}); }} className="admin-btn admin-btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Update' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
