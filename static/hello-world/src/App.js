import React from 'react';
import './App.css'; // Optional for cleaner styles

function App() {
  return (
    <div>
    <div className="section-container">
      <div className="image-side">
        <img
          src="Photo.png"
          alt="Learning Visual"
          className="section-image"
        />
      </div>
      <div className="content-side">
        {/* You'll add your right-side content here later */}
      </div>
    </div>
    <div className="section-container-course">
      <div>add course</div>
    </div>
    </div>
  );
}

export default App;
