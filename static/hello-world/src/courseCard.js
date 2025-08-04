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
      <p><strong>Level:</strong> {level}</p>
      <p><strong>Product:</strong> {product}</p>
    </div>
  );
}

export default CourseCard;
