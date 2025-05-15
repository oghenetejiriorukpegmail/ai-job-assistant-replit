import React from 'react';

function ParsedResume({ parsedResume, provider }) {
  if (!parsedResume) return null;

  return (
    <div className="parsed-resume-container">
      <div className="resume-header">
        <h3>Resume Analysis</h3>
        <div className="provider-badge">
          <span className="provider-icon">🤖</span>
          <span>Analyzed with {provider}</span>
        </div>
      </div>

      <div className="resume-section skills-section">
        <div className="section-header">
          <h4><span className="section-icon">💼</span> Professional Skills</h4>
        </div>
        <div className="skills-list">
          {parsedResume.skills && parsedResume.skills.map((skill, index) => (
            <span key={index} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>

      <div className="resume-section experience-section">
        <div className="section-header">
          <h4><span className="section-icon">📈</span> Work Experience</h4>
        </div>
        {parsedResume.experience && parsedResume.experience.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="timeline-marker"></div>
            <div className="job-content">
              <div className="job-header">
                <h5>{exp.title}</h5>
                <div className="job-meta">
                  <span className="company-name">{exp.company}</span>
                  {exp.duration && (
                    <span className="duration">
                      <span className="duration-icon">🗓️</span> {exp.duration}
                    </span>
                  )}
                </div>
              </div>
              <p className="job-description">{exp.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="resume-section education-section">
        <div className="section-header">
          <h4><span className="section-icon">🎓</span> Education</h4>
        </div>
        <div className="education-grid">
          {parsedResume.education && parsedResume.education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="education-content">
                <h5>{edu.degree}</h5>
                <div className="education-details">
                  <span className="institution">
                    <span className="institution-icon">🏫</span> {edu.institution}
                  </span>
                  {edu.year && <span className="year">{edu.year}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ParsedResume;