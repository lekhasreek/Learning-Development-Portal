import React from 'react';
import './CourseCard.css';
import { router } from '@forge/bridge';

function CourseCard({ course, isLocked }) {
  const { title, imageBase64, description, atlassianUrl, level, product } = course;

  const handleCardClick = async () => {
    if (isLocked) return;
    try {
      await router.navigate(atlassianUrl);
    } catch (error) {
      console.error('Navigation failed:', error);
    }
  };

  // Map L1/L2/L3 to Beginner/Intermediate/Advanced for legacy data
  const displayLevel =
    level === 'L1' ? 'Beginner' :
    level === 'L2' ? 'Intermediate' :
    level === 'L3' ? 'Advanced' :
    level;

  return (
    <div className="course-card" onClick={handleCardClick} style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer', position: 'relative' }}>
      {imageBase64 && (
        <img
          src={imageBase64}
          alt="Course Thumbnail"
          className="course-image"
        />
      )}
      <h3>{title}</h3>
      <p>{description}</p>
      <p><strong>Level:</strong> {displayLevel}</p>
      <p><strong>Product:</strong> {product}</p>
      <div style={{ marginTop: '12px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLocked ? (
          <span className="lock-label" title="Locked" style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span role="img" aria-label="locked">🔒</span> Locked
          </span>
        ) : (
          <span className="course-link" style={{ color: '#0052CC', fontWeight: 'bold', fontSize: '1.05rem' }}>Go to Course →</span>
        )}
      </div>
    </div>
  );
}

export default CourseCard;
