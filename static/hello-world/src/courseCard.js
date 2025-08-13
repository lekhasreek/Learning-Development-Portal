import React from 'react';
import './CourseCard.css';
import { router } from '@forge/bridge';

function CourseCard({ course, isLocked, minimal }) {
  const { title, imageBase64, description, atlassianUrl, level, product } = course;

  const handleCardClick = () => {
    if (!atlassianUrl) return;
    window.open(atlassianUrl, '_blank', 'noopener,noreferrer');
  };

  // Map L1/L2/L3 to Beginner/Intermediate/Advanced for legacy data
  const displayLevel =
    level === 'L1' ? 'Beginner' :
    level === 'L2' ? 'Intermediate' :
    level === 'L3' ? 'Advanced' :
    level;

  if (minimal) {
    // Minimal card: only image and name, smaller size, entire card clickable
    return (
      <div
        className="course-card"
        style={{ width: '180px', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', cursor: 'pointer' }}
        onClick={() => atlassianUrl && router.open(atlassianUrl)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (atlassianUrl && (e.key === 'Enter' || e.key === ' ')) {
            router.open(atlassianUrl);
          }
        }}
      >
        {imageBase64 && (
          <img
            src={imageBase64}
            alt="Course Thumbnail"
            style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
          />
        )}
        <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{title}</h4>
      </div>
    );
  }

  // ...existing code for full card (if needed)...
}

export default CourseCard;
