import React from 'react';
import './CourseCard.css';
import { router } from '@forge/bridge';

function CourseCard({ course }) {
  const { title, imageBase64, description, atlassianUrl, level, product } = course;

  const handleCardClick = async () => {
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
    <div className="course-card" onClick={handleCardClick}>
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
    </div>
  );
}

export default CourseCard;
