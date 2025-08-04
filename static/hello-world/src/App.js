import React, { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@forge/bridge';
import CourseForm from './courseForm.js';
import CourseCard from './courseCard.js';

function App() {
  const [text, setText] = useState('');
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [assignType, setAssignType] = useState('users'); // users or groups
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Test API access on component mount
  useEffect(() => {
    async function testApi() {
      try {
        const result = await invoke('testUserAccess');
        setApiTestResult(result);
        console.log('API Test Result:', result);
      } catch (error) {
        console.error('Failed to test API:', error);
        setApiTestResult({ success: false, error: 'Failed to call test function' });
      }
    }
    testApi();
  }, []);

  // Fetch courses from storage
  useEffect(() => {
    async function fetchCourses() {
      try {
        const result = await invoke('getCourses');
        setCourses(result);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    }
    fetchCourses();
  }, []);

  const handleAddCourse = async (course) => {
    try {
      const toStore = {
        ...course,
        imageUrl: course.imagePreview,
      };
      await invoke('addCourse', toStore);
      setCourses((prev) => [...prev, toStore]);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add course:', error);
    }
  };

  const handleAssign = () => {
    alert(`Assigned ${selectedCourses.length} course(s) to ${selectedUsers.length} ${assignType}`);
    setShowAssignModal(false);
    setSelectedCourses([]);
    setSelectedUsers([]);
    setUsers([]);
    setSearchQuery('');
  };

  // Debounced search function with better error handling
  const handleUserSearch = async (query) => {
    setSearchQuery(query);
    setSearchError(null);
    
    if (query.trim().length < 2) {
      setUsers([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    console.log('Searching for users with query:', query.trim());
    
    try {
      const results = await invoke('searchUsers', { query: query.trim() });
      console.log('Search results received:', results);
      
      if (results && results.error) {
        setSearchError(results.error);
        setUsers([]);
      } else {
        setUsers(results || []);
        setSearchError(null);
        
        if (!results || results.length === 0) {
          console.log('No users found for query:', query.trim());
        }
      }
    } catch (error) {
      console.error('Frontend error searching users:', error);
      setSearchError('Failed to search users. Please try again.');
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce the search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleUserSearch(searchQuery);
      }
    }, 500); // Increased delay to 500ms for better UX

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const resetAssignModal = () => {
    setShowAssignModal(false);
    setSelectedCourses([]);
    setSelectedUsers([]);
    setUsers([]);
    setSearchQuery('');
    setSearchError(null);
  };

  if (showForm) {
    return (
      <div>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Add New Course</h1>
        <CourseForm onAddCourse={handleAddCourse} onCancel={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div>
      {/* First container */}
      <div className="section-container">
        <div className="image-side">
          <img src="Photo.png" alt="Learning Visual" className="section-image" />
        </div>
        <div className="content-side">{text}</div>
      </div>

      {/* Second container */}
      <div className="section-container-course">
        <div className="course-card" onClick={() => setShowForm(true)} style={{ cursor: 'pointer' }}>
          <div className="course-icon">
            <img src="addcourse.png" alt="Add course icon" />
          </div>
          <h3>Add a new course</h3>
          <p>Add a custom course to the catalog, tailored to your organization.</p>
        </div>

        <div
          className="course-card"
          onClick={() => setShowAssignModal(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="course-icon">
            <img src="assigncourse.png" alt="Assign course icon" />
          </div>
          <h3>Assign courses to users</h3>
          <p>Be sure your learners complete important courses by assigning them to people in your org.</p>
        </div>
      </div>

      {/* Dynamic container */}
      <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>Your Courses</h2>
      <div className="course-container">
        {courses.length > 0 ? (
          courses.map((course, index) => <CourseCard key={index} course={course} />)
        ) : (
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>No courses added yet.</p>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Assignment</h2>
            <p>Email invitations will be sent to users or groups you select below.</p>

            {/* Radio buttons */}
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="assignType"
                  value="users"
                  checked={assignType === 'users'}
                  onChange={() => setAssignType('users')}
                />
                Users
              </label>
              <label>
                <input
                  type="radio"
                  name="assignType"
                  value="groups"
                  checked={assignType === 'groups'}
                  onChange={() => setAssignType('groups')}
                />
                Groups
              </label>
            </div>

            {/* Courses dropdown */}
            <div className="dropdown-section">
              <label>Courses*</label>
              <select
                multiple
                value={selectedCourses}
                onChange={(e) => setSelectedCourses([...e.target.selectedOptions].map(o => o.value))}
              >
                {courses.map((course, index) => (
                  <option key={index} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Users/Groups search and selection */}
            <div className="dropdown-section">
              <label>{assignType === 'users' ? 'Users*' : 'Groups*'}</label>
              
              <input
                type="text"
                placeholder={`Search ${assignType}... (min 2 characters)`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  marginBottom: '0.5rem',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />

              {/* Search Status Messages */}
              {isSearching && (
                <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#0052CC' }}>
                  🔍 Searching...
                </div>
              )}

              {searchError && (
                <div style={{ 
                  background: '#f8d7da', 
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '8px',
                  margin: '0.5rem 0',
                  color: '#721c24',
                  fontSize: '0.9rem'
                }}>
                  ⚠️ {searchError}
                </div>
              )}

              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                  Type at least 2 characters to search
                </div>
              )}

              <select
                multiple
                value={selectedUsers}
                onChange={(e) => setSelectedUsers([...e.target.selectedOptions].map(o => o.value))}
                style={{ minHeight: '120px', width: '100%' }}
              >
                {users.length > 0 ? (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))
                ) : (
                  searchQuery.length >= 2 && !isSearching && !searchError && (
                    <option disabled>No users found</option>
                  )
                )}
              </select>

              {selectedUsers.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#0052CC' }}>
                  ✅ Selected: {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="modal-buttons">
              <button onClick={resetAssignModal}>
                Cancel
              </button>
              <button
                disabled={selectedCourses.length === 0 || selectedUsers.length === 0}
                onClick={handleAssign}
                style={{
                  backgroundColor: selectedCourses.length === 0 || selectedUsers.length === 0 ? '#ccc' : '#0052CC',
                  color: 'white'
                }}
              >
                Assign ({selectedCourses.length} courses to {selectedUsers.length} users)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;