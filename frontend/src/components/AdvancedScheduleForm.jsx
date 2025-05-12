// frontend/src/components/AdvancedScheduleForm.jsx

/**
 * Advanced Schedule Form component.
 * Allows users to set up advanced scheduling options for job crawls.
 *
 * Author: Roo
 * Date: 2025-04-07
 */

import React, { useState } from 'react';
import '../styles/advanced-schedule-form.css';

function AdvancedScheduleForm({ onScheduleChange, initialSchedule = null }) {
  const [scheduleType, setScheduleType] = useState(initialSchedule?.type || 'simple');
  const [selectedDays, setSelectedDays] = useState(initialSchedule?.days || [1, 3, 5]); // Mon, Wed, Fri by default
  const [times, setTimes] = useState(initialSchedule?.times || ['09:00']);
  const [timezone, setTimezone] = useState(initialSchedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Day names for display
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Common timezones
  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];
  
  // Handle day selection
  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };
  
  // Handle time changes
  const handleTimeChange = (index, value) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };
  
  // Add a new time
  const addTime = () => {
    setTimes([...times, '12:00']);
  };
  
  // Remove a time
  const removeTime = (index) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };
  
  // Update parent component when schedule changes
  React.useEffect(() => {
    if (scheduleType === 'advanced') {
      onScheduleChange({
        type: 'advanced',
        days: selectedDays,
        times,
        timezone
      });
    } else {
      onScheduleChange(null); // Use simple scheduling
    }
  }, [scheduleType, selectedDays, times, timezone, onScheduleChange]);
  
  return (
    <div className="advanced-schedule-form">
      <div className="schedule-type-selector">
        <label className="radio-option">
          <input
            type="radio"
            name="scheduleType"
            value="simple"
            checked={scheduleType === 'simple'}
            onChange={() => setScheduleType('simple')}
          />
          <span>Simple Interval</span>
        </label>
        <label className="radio-option">
          <input
            type="radio"
            name="scheduleType"
            value="advanced"
            checked={scheduleType === 'advanced'}
            onChange={() => setScheduleType('advanced')}
          />
          <span>Advanced Schedule</span>
        </label>
      </div>
      
      {scheduleType === 'advanced' && (
        <div className="advanced-options">
          <div className="form-section">
            <h4>Days of Week</h4>
            <div className="days-selector">
              {[0, 1, 2, 3, 4, 5, 6].map(day => (
                <label 
                  key={day} 
                  className={`day-option ${selectedDays.includes(day) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  <span>{dayNames[day].substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-section">
            <h4>Times</h4>
            <div className="times-container">
              {times.map((time, index) => (
                <div key={index} className="time-input-group">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="time-input"
                  />
                  {times.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeTime(index)}
                      className="remove-time-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addTime}
                className="add-time-btn"
              >
                + Add Time
              </button>
            </div>
          </div>
          
          <div className="form-section">
            <h4>Timezone</h4>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="timezone-select"
            >
              <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                {Intl.DateTimeFormat().resolvedOptions().timeZone} (Local)
              </option>
              {commonTimezones.map(tz => (
                tz !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                )
              ))}
            </select>
          </div>
          
          <div className="schedule-summary">
            <h4>Schedule Summary</h4>
            <p>
              This job will run at{' '}
              <strong>{times.join(', ')}</strong> on{' '}
              <strong>
                {selectedDays.map(day => dayNames[day]).join(', ')}
              </strong>{' '}
              in the <strong>{timezone}</strong> timezone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedScheduleForm;
