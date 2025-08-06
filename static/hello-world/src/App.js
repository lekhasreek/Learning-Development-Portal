import React, { useEffect, useState } from 'react';
import './App.css';
import { invoke, requestConfluence } from '@forge/bridge';
import CourseForm from './courseForm.js';
import CourseCard from './courseCard.js';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [showCatalog, setShowCatalog] = useState(false);
  const [productFilter, setProductFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');

  useEffect(() => {
    async function fetchData() {
      try {
        const { accountId } = await invoke('get-current-accountId');
        const response = await requestConfluence(`/wiki/rest/api/user?accountId=${accountId}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Failed to fetch user info: ${response.status}`);
        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleUserSearch(searchQuery);
      }
    }, 500);
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

  if (showCatalog) {
    // Helper to map legacy level values
    const getDisplayLevel = (level) => {
      if (level === 'L1') return 'Beginner';
      if (level === 'L2') return 'Intermediate';
      if (level === 'L3') return 'Advanced';
      return level;
    };

    const filteredCourses = courses.filter(course => {
      const productMatch = productFilter === 'All' || (course.product && course.product.trim().toLowerCase() === productFilter.trim().toLowerCase());
      const displayLevel = getDisplayLevel(course.level);
      const levelMatch = levelFilter === 'All' || (displayLevel && displayLevel.trim().toLowerCase() === levelFilter.trim().toLowerCase());
      return productMatch && levelMatch;
    });
    return (
      <div style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Course catalog</h1>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="All">Products</option>
            <option value="Jira">Jira</option>
            <option value="Confluence">Confluence</option>
            <option value="Marketplace apps">Marketplace apps</option>
            <option value="Other">Other</option>
          </select>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="All">Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          {filteredCourses.map(course => (
            <div key={course.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '30px', padding: '30px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '600' }}>{course.title}</span>
                <div style={{ margin: '10px 0', color: '#344563' }}>Level: <span style={{ fontWeight: 'bold' }}>{getDisplayLevel(course.level)}</span></div>
                <button style={{ background: '#36B37E', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' }}>Start</button>
              </div>
              <div style={{ width: '220px', height: '120px', background: '#0052CC', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{course.title}</div>
            </div>
          ))}
        </div>
        <button style={{ marginTop: '30px', padding: '10px 24px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem' }} onClick={() => setShowCatalog(false)}>Back</button>
      </div>
    );
  }

  return (
    <div>
      <div className="section-container">
        <div className="image-side">
          <img src="Photo.png" alt="Learning Visual" className="section-image" />
        </div>
        <div className="content-side">
          {loading && <div>Loading...</div>}
          {error && <div>Error: {error}</div>}
          {user && <h1 className="welcome">Welcome {user.displayName}!</h1>}
          <button style={{ marginTop: '10px', padding: '10px 24px', background: '#0052CC', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', width: 'fit-content' }} onClick={() => setShowCatalog(true)}>Browse the Catalog</button>
        </div>
      </div>

      <div className="section-container-course">
        <div className="course-card" onClick={() => { console.log('Add course clicked'); setShowForm(true); }} style={{ cursor: 'pointer', zIndex: 1000 }}>
          <div className="course-icon">
            <img src="addcourse.png" alt="Add course icon" />
          </div>
          <h3>Add a new course</h3>
          <p>Add a custom course to the catalog, tailored to your organization.</p>
        </div>

        <div className="course-card" onClick={() => setShowAssignModal(true)} style={{ cursor: 'pointer' }}>
          <div className="course-icon">
            <img src="assigncourse.png" alt="Assign course icon" />
          </div>
          <h3>Assign courses to users</h3>
          <p>Be sure your learners complete important courses by assigning them to people in your org.</p>
        </div>
      </div>

      <h2 style={{ textAlign: 'center', marginTop: '2rem' }}>Your Courses</h2>
      <div className="course-container">
        {courses.length > 0 ? (
          courses.map((course, index) => <CourseCard key={index} course={course} />)
        ) : (
          <p style={{ textAlign: 'center', marginTop: '1rem' }}>No courses added yet.</p>
        )}
      </div>

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Assignment</h2>
            <p>Email invitations will be sent to users or groups you select below.</p>

            <div className="radio-group">
              <label>
                <input type="radio" name="assignType" value="users" checked={assignType === 'users'} onChange={() => setAssignType('users')} />
                Users
              </label>
              <label>
                <input type="radio" name="assignType" value="groups" checked={assignType === 'groups'} onChange={() => setAssignType('groups')} />
                Groups
              </label>
            </div>

            <div className="dropdown-section">
              <label>Courses*</label>
              <select multiple value={selectedCourses} onChange={(e) => setSelectedCourses([...e.target.selectedOptions].map(o => o.value))}>
                {courses.map((course, index) => (
                  <option key={index} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>

            <div className="dropdown-section">
              <label>{assignType === 'users' ? 'Users*' : 'Groups*'}</label>
              <input type="text" placeholder={`Search ${assignType}... (min 2 characters)`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {isSearching && <div>🔍 Searching...</div>}
              {searchError && <div style={{ color: 'red' }}>⚠️ {searchError}</div>}
              <select multiple value={selectedUsers} onChange={(e) => setSelectedUsers([...e.target.selectedOptions].map(o => o.value))}>
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
            </div>

            <div className="modal-buttons">
              <button onClick={resetAssignModal}>Cancel</button>
              <button disabled={selectedCourses.length === 0 || selectedUsers.length === 0} onClick={handleAssign}>
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
