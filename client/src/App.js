import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchNotes();
    }
  }, []);

  const login = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/login', credentials);
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      setLoginError('');
      fetchNotes();
    } catch (error) {
      setLoginError('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setNotes([]);
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/items', 
        { content: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes([...notes, response.data]);
      setNewNote('');
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (id, content) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/items/${id}`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(notes.map(note => note.id === id ? response.data : note));
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const deleteNote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>Notes App</h1>
          <form onSubmit={login} data-testid="login-form">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                data-testid="username-input"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                data-testid="password-input"
                required
              />
            </div>
            <button type="submit" data-testid="login-button">Login</button>
            {loginError && <div className="error" data-testid="login-error">{loginError}</div>}
          </form>
          <div className="demo-credentials">
            <p><strong>Demo credentials:</strong></p>
            <p>Username: admin | Password: password</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header>
        <h1>My Notes</h1>
        <button onClick={logout} data-testid="logout-button">Logout</button>
      </header>

      <div className="notes-container">
        <form onSubmit={createNote} className="note-form">
          <input
            type="text"
            placeholder="Add a new note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            data-testid="new-note-input"
          />
          <button type="submit" data-testid="add-note-button">Add Note</button>
        </form>

        <div className="notes-list" data-testid="notes-list">
          {notes.length === 0 ? (
            <p data-testid="no-notes">No notes yet. Add your first note above!</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="note-item" data-testid={`note-${note.id}`}>
                {editingNote === note.id ? (
                  <EditNoteForm
                    note={note}
                    onSave={(content) => updateNote(note.id, content)}
                    onCancel={() => setEditingNote(null)}
                  />
                ) : (
                  <>
                    <span className="note-content">{note.content}</span>
                    <div className="note-actions">
                      <button 
                        onClick={() => setEditingNote(note.id)}
                        data-testid={`edit-note-${note.id}`}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteNote(note.id)}
                        data-testid={`delete-note-${note.id}`}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <div className="notes-count" data-testid="notes-count">
          Total notes: {notes.length}
        </div>
      </div>
    </div>
  );
}

function EditNoteForm({ note, onSave, onCancel }) {
  const [content, setContent] = useState(note.content);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        data-testid={`edit-input-${note.id}`}
        autoFocus
      />
      <div className="edit-actions">
        <button type="submit" data-testid={`save-note-${note.id}`}>Save</button>
        <button type="button" onClick={onCancel} data-testid={`cancel-edit-${note.id}`}>Cancel</button>
      </div>
    </form>
  );
}

export default App;