// backend/src/resumes/utils/data-extraction.js

/**
 * Extract structured data from resume text
 * @param {string} text - Raw text from resume
 * @returns {Object} - Structured resume data
 */
function extractStructuredData(text) {
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input for data extraction:', text);
    return { skills: [], experience: [], education: [] };
  }

  // Normalize text - replace multiple spaces, tabs, etc. with single space
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Try to identify sections using various common headers and formats
  const sections = identifySections(normalizedText);
  
  // Process skills
  let skills = extractSkills(sections.skills || '');
  
  // If no skills were found using the skills section, try to extract from the whole text
  if (skills.length === 0) {
    skills = extractSkillsFromFullText(normalizedText);
  }
  
  // Process experience
  let experience = extractExperience(sections.experience || '');
  
  // Process education
  let education = extractEducation(sections.education || '');
  
  // Validate and clean the extracted data
  const validatedData = {
    skills: validateSkills(skills),
    experience: validateExperience(experience),
    education: validateEducation(education)
  };
  
  return validatedData;
}

/**
 * Identify different sections in the resume text
 * @param {string} text - Resume text
 * @returns {Object} - Object with identified sections
 */
function identifySections(text) {
  const sections = {};
  
  // Common section headers with variations
  const sectionPatterns = {
    skills: [
      /\b(?:technical\s+)?skills\s*(?::|&|\/|\||—|-|\n)/i,
      /\bcore\s+competencies\s*(?::|&|\/|\||—|-|\n)/i,
      /\bproficiencies\s*(?::|&|\/|\||—|-|\n)/i,
      /\bqualifications\s*(?::|&|\/|\||—|-|\n)/i
    ],
    experience: [
      /\b(?:work|professional)\s+experience\s*(?::|&|\/|\||—|-|\n)/i,
      /\bemployment\s+history\s*(?::|&|\/|\||—|-|\n)/i,
      /\bcareer\s+history\s*(?::|&|\/|\||—|-|\n)/i,
      /\bwork\s+history\s*(?::|&|\/|\||—|-|\n)/i
    ],
    education: [
      /\beducation(?:al)?\s+(?:background|history)?\s*(?::|&|\/|\||—|-|\n)/i,
      /\bacademic\s+background\s*(?::|&|\/|\||—|-|\n)/i,
      /\bdegrees?\s*(?::|&|\/|\||—|-|\n)/i,
      /\bqualifications\s*(?::|&|\/|\||—|-|\n)/i
    ]
  };
  
  // Find the positions of each section in the text
  const sectionPositions = {};
  
  for (const [sectionName, patterns] of Object.entries(sectionPatterns)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        sectionPositions[sectionName] = match.index;
        break;
      }
    }
  }
  
  // Sort sections by their position in the text
  const sortedSections = Object.entries(sectionPositions)
    .sort((a, b) => a[1] - b[1]);
  
  // Extract text for each section
  for (let i = 0; i < sortedSections.length; i++) {
    const [sectionName, startPos] = sortedSections[i];
    const nextSection = sortedSections[i + 1];
    
    const sectionStart = text.indexOf('\n', startPos) + 1;
    const sectionEnd = nextSection ? nextSection[1] : text.length;
    
    sections[sectionName] = text.substring(sectionStart, sectionEnd).trim();
  }
  
  return sections;
}

/**
 * Extract skills from the skills section
 * @param {string} skillsText - Skills section text
 * @returns {Array} - Array of skills
 */
function extractSkills(skillsText) {
  if (!skillsText) return [];
  
  // Try different delimiters to split skills
  let skills = [];
  
  // Try bullet points, commas, and new lines
  const delimiters = [/•|\*|·|○|▪|▫|◦|⦿|⁃|⁌|⁍|⦾|⦿|⧫|⧮|⧯|⧰|⧱|⧲|⧳|⧴|⧵|⧶|⧷|⧸|⧹|⧺|⧻|⧼|⧽|⧾|⧿/, /,/, /\n/];
  
  for (const delimiter of delimiters) {
    const splitSkills = skillsText.split(delimiter)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0 && skill.length < 50);
    
    if (splitSkills.length > skills.length) {
      skills = splitSkills;
    }
  }
  
  // If still no skills found, try to extract words that might be skills
  if (skills.length === 0) {
    skills = skillsText.split(/\s+/)
      .filter(word => word.length > 2 && !/^\d+$/.test(word))
      .map(word => word.trim());
  }
  
  return skills;
}

/**
 * Extract skills from the full text when no skills section is found
 * @param {string} fullText - Full resume text
 * @returns {Array} - Array of skills
 */
function extractSkillsFromFullText(fullText) {
  // Common technical skills to look for
  const commonSkills = [
    'javascript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'rails',
    'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material-ui',
    'sql', 'mysql', 'postgresql', 'mongodb', 'firebase', 'dynamodb', 'redis',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello',
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'keras',
    'leadership', 'management', 'communication', 'teamwork', 'problem-solving'
  ];
  
  const skills = [];
  
  for (const skill of commonSkills) {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(fullText)) {
      // Capitalize first letter of each word
      const formattedSkill = skill.replace(/\b\w/g, l => l.toUpperCase());
      skills.push(formattedSkill);
    }
  }
  
  return skills;
}

/**
 * Extract experience from the experience section
 * @param {string} experienceText - Experience section text
 * @returns {Array} - Array of experience objects
 */
function extractExperience(experienceText) {
  if (!experienceText) return [];
  
  // Split by potential job entries (looking for patterns like dates, company names, etc.)
  const expEntries = experienceText.split(/\n(?=[A-Z]|\d{4}|\d{1,2}\/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)
    .filter(entry => entry.trim().length > 10);
  
  const experience = expEntries.map(entry => {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return null;
    
    // Try different patterns to extract job title and company
    const titleCompanyPatterns = [
      /(.*?)\s+(?:at|@|,|\||-|–)\s+(.*?)(?:\s+\(|\s+\d{1,2}\/\d{4}|\s+\d{4}|$)/i,
      /(.*?)\s*[,\|]\s*(.*?)(?:\s+\(|\s+\d{1,2}\/\d{4}|\s+\d{4}|$)/i,
      /(.*?)(?:\n|\r\n)(.*?)(?:\s+\(|\s+\d{1,2}\/\d{4}|\s+\d{4}|$)/i
    ];
    
    let title = '';
    let company = '';
    
    // Try each pattern until we find a match
    for (const pattern of titleCompanyPatterns) {
      const match = entry.match(pattern);
      if (match) {
        title = match[1].trim();
        company = match[2].trim();
        break;
      }
    }
    
    // If no match found, use first line as title
    if (!title) {
      title = lines[0].trim();
    }
    
    // Look for date patterns to extract duration
    const datePatterns = [
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|to)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}/i,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|–|to)\s*(?:Present|Current)/i,
      /\d{1,2}\/\d{4}\s*(?:-|–|to)\s*\d{1,2}\/\d{4}/i,
      /\d{1,2}\/\d{4}\s*(?:-|–|to)\s*(?:Present|Current)/i,
      /\d{4}\s*(?:-|–|to)\s*\d{4}/i,
      /\d{4}\s*(?:-|–|to)\s*(?:Present|Current)/i
    ];
    
    let duration = '';
    
    // Try each date pattern until we find a match
    for (const pattern of datePatterns) {
      const match = entry.match(pattern);
      if (match) {
        duration = match[0].trim();
        break;
      }
    }
    
    // Extract description (everything after title, company, and duration)
    let descriptionStartIndex = 1;
    if (company && lines[1].includes(company)) {
      descriptionStartIndex = 2;
    }
    if (duration && lines[descriptionStartIndex].includes(duration)) {
      descriptionStartIndex++;
    }
    
    const description = lines.slice(descriptionStartIndex).join('\n').trim();
    
    return {
      title,
      company,
      duration,
      description
    };
  }).filter(Boolean);
  
  return experience;
}

/**
 * Extract education from the education section
 * @param {string} educationText - Education section text
 * @returns {Array} - Array of education objects
 */
function extractEducation(educationText) {
  if (!educationText) return [];
  
  // Split by potential education entries
  const eduEntries = educationText.split(/\n(?=[A-Z]|\d{4}|Bachelor|Master|PhD|Doctor|Associate)/i)
    .filter(entry => entry.trim().length > 5);
  
  const education = eduEntries.map(entry => {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 1) return null;
    
    // Try to extract degree and institution
    let degree = '';
    let institution = '';
    let year = '';
    
    // Look for common degree patterns
    const degreePatterns = [
      /(?:Bachelor|Master|PhD|Doctor|Associate)(?:'s)?\s+(?:of|in|degree in)?\s+[A-Za-z\s]+/i,
      /[A-Za-z\s]+\s+(?:Bachelor|Master|PhD|Doctor|Associate)(?:'s)?/i,
      /B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D\.?|M\.?B\.?A\.?/i
    ];
    
    for (const pattern of degreePatterns) {
      const match = entry.match(pattern);
      if (match) {
        degree = match[0].trim();
        break;
      }
    }
    
    // If no degree pattern found, use first line
    if (!degree && lines.length > 0) {
      degree = lines[0].trim();
    }
    
    // Look for institution
    const institutionPatterns = [
      /(?:University|College|Institute|School) of [A-Za-z\s]+/i,
      /[A-Za-z\s]+ (?:University|College|Institute|School)/i
    ];
    
    for (const pattern of institutionPatterns) {
      const match = entry.match(pattern);
      if (match && !match[0].includes(degree)) {
        institution = match[0].trim();
        break;
      }
    }
    
    // If no institution found and we have multiple lines, use second line
    if (!institution && lines.length > 1) {
      institution = lines[1].trim();
    }
    
    // Look for graduation year
    const yearPattern = /(?:19|20)\d{2}/;
    const yearMatch = entry.match(yearPattern);
    if (yearMatch) {
      year = yearMatch[0].trim();
    }
    
    return {
      degree,
      institution,
      year
    };
  }).filter(Boolean);
  
  return education;
}

/**
 * Validate and clean skills data
 * @param {Array} skills - Array of skills
 * @returns {Array} - Validated skills array
 */
function validateSkills(skills) {
  if (!Array.isArray(skills)) return [];
  
  return skills
    .map(skill => {
      if (typeof skill !== 'string') return null;
      return skill.trim();
    })
    .filter(skill => skill && skill.length > 0 && skill.length < 50)
    .filter((skill, index, self) => self.indexOf(skill) === index); // Remove duplicates
}

/**
 * Validate and clean experience data
 * @param {Array} experience - Array of experience objects
 * @returns {Array} - Validated experience array
 */
function validateExperience(experience) {
  if (!Array.isArray(experience)) return [];
  
  return experience
    .map(exp => {
      if (!exp || typeof exp !== 'object') return null;
      
      return {
        title: typeof exp.title === 'string' ? exp.title.trim() : '',
        company: typeof exp.company === 'string' ? exp.company.trim() : '',
        duration: typeof exp.duration === 'string' ? exp.duration.trim() : '',
        description: typeof exp.description === 'string' ? exp.description.trim() : ''
      };
    })
    .filter(exp => exp && (exp.title || exp.company)); // Must have at least title or company
}

/**
 * Validate and clean education data
 * @param {Array} education - Array of education objects
 * @returns {Array} - Validated education array
 */
function validateEducation(education) {
  if (!Array.isArray(education)) return [];
  
  return education
    .map(edu => {
      if (!edu || typeof edu !== 'object') return null;
      
      return {
        degree: typeof edu.degree === 'string' ? edu.degree.trim() : '',
        institution: typeof edu.institution === 'string' ? edu.institution.trim() : '',
        year: typeof edu.year === 'string' ? edu.year.trim() : ''
      };
    })
    .filter(edu => edu && (edu.degree || edu.institution)); // Must have at least degree or institution
}

module.exports = {
  extractStructuredData
};
