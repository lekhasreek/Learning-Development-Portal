import React from 'react';
import './BrowseCatalogButton.css';

// Helper to map legacy level values
function getDisplayLevel(level) {
  if (level === 'L1') return 'Beginner';
  if (level === 'L2') return 'Intermediate';
  if (level === 'L3') return 'Advanced';
  return level;
}

export default function BrowseCatalogButton({ onClick, courses = [], productFilter = 'All', levelFilter = 'All', onProductFilterChange, onLevelFilterChange }) {
  // Standardized product options to match courseForm.js
  const productOptions = [
    { label: 'Jira', value: 'Jira' },
    { label: 'Confluence', value: 'Confluence' },
    { label: 'Marketplace apps', value: 'Marketplace apps' },
    { label: 'Other', value: 'Other' }
  ];

  const levelOptions = [
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' }
  ];

  // Filter courses based on product and level
  const filteredCourses = courses.filter(course => {
    const productMatch = productFilter === 'All' || (course.product && course.product.trim().toLowerCase() === productFilter.trim().toLowerCase());
    const levelMatch = levelFilter === 'All' || (getDisplayLevel(course.level) && getDisplayLevel(course.level).trim().toLowerCase() === levelFilter.trim().toLowerCase());
    return productMatch && levelMatch;
  });

  return (
    <div className="catalog-modal">
      <button className="browse-catalog-btn" onClick={onClick}>
        Browse the Catalog
      </button>
      {/* Example modal content for catalog */}
      <div className="catalog-content">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <select value={productFilter} onChange={e => onProductFilterChange(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="All">Products</option>
            {productOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={levelFilter} onChange={e => onLevelFilterChange(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
            <option value="All">Level</option>
            {levelOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          {filteredCourses.map((course, idx) => (
            <div key={idx} className="course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <p><strong>Level:</strong> {getDisplayLevel(course.level)}</p>
              <p><strong>Product:</strong> {course.product}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
