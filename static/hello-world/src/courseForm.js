import React, { useState } from 'react';
import './CourseForm.css';

function CourseForm({ onAddCourse, onCancel }) {
  const [form, setForm] = useState({
    title: '',
    imageFile: null,
    imagePreview: '',
    description: '',
    atlassianUrl: '',
    level: 'Beginner',
    product: '' // New field
  });

  const isValidUrl = (url) => {
    // Accepts:
    // https://community.atlassian.com/learning/collection/topic/slug
    // https://community.atlassian.com/learning/course/slug
    // https://university.atlassian.com/student/page/1568719-advanced-asset-management-in-jira-service-management-live-team-training
    const patterns = [
      /^https:\/\/community\.atlassian\.com\/learning\/collection\/topic\/[a-zA-Z0-9-]+$/,
      /^https:\/\/community\.atlassian\.com\/learning\/course\/[a-zA-Z0-9-]+$/,
      /^https:\/\/university\.atlassian\.com\/student\/page\/[a-zA-Z0-9-]+$/
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidUrl(form.atlassianUrl)) {
      alert('Please enter a valid Atlassian URL');
      return;
    }

    if (!form.imageFile) {
      alert('Please upload an image.');
      return;
    }

    if (!form.product) {
      alert('Please select a product.');
      return;
    }

    try {
      const imageBase64 = await convertToBase64(form.imageFile);

      const courseData = {
        title: form.title,
        imageBase64,
        description: form.description,
        atlassianUrl: form.atlassianUrl,
        level: form.level,
        product: form.product // Include product
      };

      onAddCourse(courseData);

      setForm({
        title: '',
        imageFile: null,
        imagePreview: '',
        description: '',
        atlassianUrl: '',
        level: 'Beginner',
        product: ''
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      alert('Failed to process the image. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="image-upload-preview">
        {form.imagePreview ? (
          <img src={form.imagePreview} alt="Course Thumbnail" className="thumbnail" />
        ) : (
          <div className="thumbnail-placeholder" />
        )}
        <input
          type="file"
          accept="image/*"
          id="course-thumbnail"
          onChange={handleImageChange}
          hidden
        />
        <label htmlFor="course-thumbnail" className="upload-button">Upload course thumbnail</label>
      </div>

      <div className="form-row">
        <label>Course Title:</label>
        <input type="text" name="title" value={form.title} onChange={handleChange} required />
      </div>

      <div className="form-row">
        <label>Course Description:</label>
        <textarea name="description" value={form.description} onChange={handleChange} required />
      </div>

      <div className="form-row">
        <label>Atlassian URL:</label>
        <input type="text" name="atlassianUrl" value={form.atlassianUrl} onChange={handleChange} required />
      </div>

      <div className="form-row">
        <label>Level:</label>
        <select name="level" value={form.level} onChange={handleChange} required>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div className="form-row">
        <label>Product:</label>
        <select name="product" value={form.product} onChange={handleChange} required>
          <option value="">Select...</option>
          <option value="Jira">Jira</option>
          <option value="Confluence">Confluence</option>
          <option value="Marketplace apps">Marketplace apps</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
        <button type="submit">Add Course</button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: '#ccc', color: '#222' }}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default CourseForm;
