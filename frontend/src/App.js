import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // For browsing all posts
  const [applications, setApplications] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-posts');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // User info - in a real app, this would come from authentication
  const [userInfo, setUserInfo] = useState({
    user_id: '001',
    name: 'John Doe',
    role: 'elderly',
    location: 'Sham Shui Po'
  });

  // Toggle between elderly and youth roles for demo
  const toggleRole = () => {
    if (userInfo.role === 'elderly') {
      setUserInfo({
        user_id: '002',
        name: 'Jane Smith',
        role: 'youth',
        location: 'Mong Kok'
      });
    } else {
      setUserInfo({
        user_id: '001',
        name: 'John Doe',
        role: 'elderly',
        location: 'Sham Shui Po'
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'my-posts') {
      fetchMyPosts();
    } else if (activeTab === 'browse') {
      fetchAllPosts();
    } else if (activeTab === 'applications') {
      fetchMyApplications();
    }
  }, [activeTab, userInfo.user_id]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/posts/${userInfo.user_id}`);
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      alert('Failed to fetch posts. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/posts/browse/${userInfo.user_id}`);
      if (response.data.success) {
        setAllPosts(response.data.posts || []);
      } else {
        setAllPosts([]);
      }
    } catch (error) {
      console.error('Error fetching all posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/users/${userInfo.user_id}/applications`);
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostApplications = async (postId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/posts/${postId}/applications?user_id=${userInfo.user_id}`
      );
      if (response.data.success) {
        setSelectedPost({
          ...posts.find(p => p.id === postId),
          applications: response.data.applications
        });
      }
    } catch (error) {
      console.error('Error fetching post applications:', error);
      alert('Failed to fetch applications');
    }
  };

  const handleSubmitText = async () => {
    if (!query.trim()) {
      alert('Please enter your request');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/query/text`, {
        user_info: userInfo,
        query: query,
        use_voice_response: false
      });

      if (response.data.success) {
        alert(response.data.output || 'Request processed successfully!');
        setQuery('');
        setActiveTab('my-posts');
        fetchMyPosts();
      } else {
        alert(response.data.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToPost = async (postId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/posts/${postId}/apply`, {
        post_id: postId,
        helper_id: userInfo.user_id,
        helper_name: userInfo.name,
        helper_location: userInfo.location,
        message: `Hi! I'm ${userInfo.name} from ${userInfo.location}. I'd love to help!`
      });

      if (response.data.success) {
        alert('Application submitted successfully!');
        fetchAllPosts();
      } else {
        alert(response.data.message || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying to post:', error);
      alert(error.response?.data?.detail || 'Failed to apply to post');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHelper = async (postId, applicationId, helperId) => {
    if (!window.confirm('Are you sure you want to select this helper? This will lock the post.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/posts/${postId}/select-helper`, {
        post_id: postId,
        application_id: applicationId,
        helper_id: helperId
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        setSelectedPost(null);
        fetchMyPosts();
      }
    } catch (error) {
      console.error('Error selecting helper:', error);
      alert('Failed to select helper');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/posts/${postId}`);
      alert('Post deleted successfully!');
      fetchMyPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await handleSubmitVoice(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitVoice = async (audioBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_query.webm');
      formData.append('user_info', JSON.stringify(userInfo));

      const response = await axios.post(`${API_BASE_URL}/api/query/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(response.data.output || 'Voice request processed successfully!');
        setActiveTab('my-posts');
        fetchMyPosts();
      } else {
        alert(response.data.error || 'Failed to process voice request');
      }
    } catch (error) {
      console.error('Error submitting voice query:', error);
      alert('Failed to submit voice request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Browser speech recognition (Web Speech API) – sends recognized text directly
  const [browserRecog, setBrowserRecog] = React.useState(null);
  const [browserListening, setBrowserListening] = React.useState(false);

  const handleBrowserSpeech = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser speech recognition not supported.');
      return;
    }
    try {
      setLoading(true);
      const recog = new SpeechRecognition();
      recog.lang = 'en-US';
      recog.interimResults = false;
      recog.maxAlternatives = 1;

      await new Promise((resolve, reject) => {
        recog.onresult = async (event) => {
          const transcript = event.results[0][0].transcript;
          try {
            const response = await axios.post(`${API_BASE_URL}/api/query/text`, {
              user_info: userInfo,
              query: transcript,
              use_voice_response: false,
            });
            if (response.data.success) {
              alert(response.data.output || 'Request processed successfully!');
              setActiveTab('my-posts');
              fetchMyPosts();
              resolve();
            } else {
              reject(new Error(response.data.error || 'Failed to process request'));
            }
          } catch (e) {
            reject(e);
          }
        };
        recog.onerror = (e) => reject(e.error || 'speech error');
        recog.onend = () => { setBrowserListening(false); };
        setBrowserRecog(recog);
        setBrowserListening(true);
        recog.start();
      });
    } catch (err) {
      console.error('Browser speech failed:', err);
      alert('Speech recognition failed. Please try again or upload audio.');
    } finally {
      setLoading(false);
    }
  };

  const stopBrowserSpeech = () => {
    try {
      if (browserRecog) {
        browserRecog.stop();
      }
    } catch {}
  };

  const renderMyPosts = () => (
    <div className="posts-container">
      <div className="posts-header">
        <h2>📋 My Help Posts</h2>
        <button className="refresh-btn" onClick={fetchMyPosts} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Posts Yet</h3>
          <p>Create your first help request using the Create tab</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className={`post-card ${post.status === 'matched' ? 'matched' : ''}`}>
              <div className="post-header">
                <h3>📌 Help Request</h3>
                <div className="post-actions">
                  {post.status === 'matched' && (
                    <span className="matched-badge">✅ Matched</span>
                  )}
                  {post.status === 'open' && (
                    <button 
                      className="view-applications-btn"
                      onClick={() => fetchPostApplications(post.id)}
                    >
                      👥 View Applications
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <p className="post-text">{post.text}</p>
              <div className="post-skills">
                <strong>Required Skills:</strong>
                <div className="skills-list">
                  {post.required_skills && post.required_skills.map((skill, idx) => (
                    <span key={idx} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>
              {post.status === 'matched' && post.matched_helper_name && (
                <div className="matched-info">
                  <strong>🤝 Matched with:</strong> {post.matched_helper_name}
                </div>
              )}
              <div className="post-footer">
                📍 {post.location} • Status: {post.status || 'open'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications Modal */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👥 Applications for: {selectedPost.text}</h2>
              <button className="close-btn" onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedPost.applications && selectedPost.applications.length === 0 ? (
                <div className="empty-state">
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="applications-list">
                  {selectedPost.applications && selectedPost.applications.map((app) => (
                    <div key={app.id} className="application-card">
                      <div className="application-header">
                        <h4>👤 {app.helper_name}</h4>
                        <span className="status-badge">{app.status}</span>
                      </div>
                      <p><strong>Location:</strong> 📍 {app.helper_location}</p>
                      {app.message && <p><strong>Message:</strong> {app.message}</p>}
                      {app.status === 'pending' && (
                        <button
                          className="select-helper-btn"
                          onClick={() => handleSelectHelper(selectedPost.id, app.id, app.helper_id)}
                        >
                          ✅ Thank you! Select This Helper
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBrowsePosts = () => (
    <div className="posts-container">
      <div className="posts-header">
        <h2>🔍 Browse Help Requests</h2>
        <button className="refresh-btn" onClick={fetchAllPosts} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      <div className="info-banner">
        ℹ️ {userInfo.role === 'elderly' ? 'Browse youth help requests and offer assistance' : 'Browse elderly help requests and offer assistance'}
      </div>

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : allPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Posts Available</h3>
          <p>Check back later for new help requests</p>
        </div>
      ) : (
        <div className="posts-list">
          {allPosts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <h3>📌 Help Needed</h3>
                <button 
                  className="apply-btn"
                  onClick={() => handleApplyToPost(post.id)}
                >
                  🙋 Apply to Help
                </button>
              </div>
              <p className="post-text">{post.text}</p>
              <div className="post-skills">
                <strong>Required Skills:</strong>
                <div className="skills-list">
                  {post.required_skills && post.required_skills.map((skill, idx) => (
                    <span key={idx} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="post-footer">
                📍 {post.location}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMyApplications = () => (
    <div className="posts-container">
      <div className="posts-header">
        <h2>📝 My Applications</h2>
        <button className="refresh-btn" onClick={fetchMyApplications} disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No Applications Yet</h3>
          <p>Browse posts and apply to help someone!</p>
        </div>
      ) : (
        <div className="posts-list">
          {applications.map((app) => (
            <div key={app.id} className="post-card">
              <div className="post-header">
                <h3>Application</h3>
                <span className={`status-badge status-${app.status}`}>
                  {app.status === 'accepted' ? '✅ Accepted' : 
                   app.status === 'rejected' ? '❌ Rejected' : 
                   '⏳ Pending'}
                </span>
              </div>
              <p className="post-text"><strong>Post:</strong> {app.post_text}</p>
              <p><strong>Location:</strong> 📍 {app.post_location}</p>
              {app.message && <p><strong>Your message:</strong> {app.message}</p>}
              <div className="post-footer">
                Applied on: {new Date(app.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="create-container">
      <div className="create-header">
        <h2>➕ Create New Request</h2>
        <p>Type your request or use voice input</p>
      </div>

      <div className="input-section">
        <label>Type Your Request</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., I need help with grocery shopping this weekend"
          rows="5"
          disabled={loading}
        />
        <button 
          className="submit-btn"
          onClick={handleSubmitText}
          disabled={loading || !query.trim()}
        >
          {loading ? '⏳ Processing...' : '📤 Submit Request'}
        </button>
      </div>

      <div className="divider">
        <span>OR</span>
      </div>

      <div className="voice-section">
        <label>Use Voice Input</label>
        <p className="voice-hint">Click the microphone to start recording, click again to stop</p>
        <button
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? (
            <>
              <span className="mic-icon">⏹️</span>
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <span className="mic-icon">🎤</span>
              <span>Tap to Speak</span>
            </>
          )}
        </button>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="submit-btn" onClick={handleBrowserSpeech} disabled={loading || browserListening}>
            🎙️ Use Browser Speech (faster)
          </button>
          <button className="submit-btn" onClick={stopBrowserSpeech} disabled={!browserListening}>
            ⏹️ Stop
          </button>
        </div>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span>Recording...</span>
          </div>
        )}
      </div>

      <div className="examples-section">
        <h4>Example Requests:</h4>
        <div className="examples">
          <button onClick={() => setQuery('I need help with grocery shopping this weekend')}>
            • I need help with grocery shopping
          </button>
          <button onClick={() => setQuery('I need someone to help me with computer setup')}>
            • I need help with computer setup
          </button>
          <button onClick={() => setQuery('I need help moving furniture next week')}>
            • I need help moving furniture
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="profile-section">
        <div className="avatar">{userInfo.role === 'elderly' ? '👴' : '🙋'}</div>
        <div className="profile-info">
          <h3>User Profile</h3>
          <p><strong>Name:</strong> {userInfo.name}</p>
          <p><strong>ID:</strong> {userInfo.user_id}</p>
          <p><strong>Role:</strong> {userInfo.role}</p>
          <p><strong>Location:</strong> {userInfo.location}</p>
          <button className="toggle-role-btn" onClick={toggleRole}>
            🔄 Switch to {userInfo.role === 'elderly' ? 'Youth' : 'Elderly'} Mode
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>System Status</h3>
        <button 
          className="health-check-btn"
          onClick={async () => {
            try {
              const response = await axios.get(`${API_BASE_URL}/health`);
              alert(`Status: ${response.data.status}\nDatabase: ${response.data.database}\nAgent: ${response.data.agent}`);
            } catch (error) {
              alert('Cannot connect to server');
            }
          }}
        >
          🏥 Check System Health
        </button>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p>Elderly Connect v2.0.0</p>
        <p>Powered by AI • Designed for accessibility</p>
        <p>Now with Helper Matching! 🤝</p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <h1>Elderly Connect</h1>
        <p>Community Help Platform</p>
        <div className="user-badge">
          {userInfo.role === 'elderly' ? '👴' : '🙋'} {userInfo.name} ({userInfo.role})
        </div>
      </header>

      <nav className="tab-nav">
        <button 
          className={activeTab === 'my-posts' ? 'active' : ''}
          onClick={() => setActiveTab('my-posts')}
        >
          📋 My Posts
        </button>
        <button 
          className={activeTab === 'browse' ? 'active' : ''}
          onClick={() => setActiveTab('browse')}
        >
          🔍 Browse
        </button>
        <button 
          className={activeTab === 'applications' ? 'active' : ''}
          onClick={() => setActiveTab('applications')}
        >
          📝 My Applications
        </button>
        <button 
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          ➕ Create
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'my-posts' && renderMyPosts()}
        {activeTab === 'browse' && renderBrowsePosts()}
        {activeTab === 'applications' && renderMyApplications()}
        {activeTab === 'create' && renderCreate()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      <footer className="app-footer">
        <p>Built for simple and innovative accessibility</p>
      </footer>
    </div>
  );
}

export default App;
