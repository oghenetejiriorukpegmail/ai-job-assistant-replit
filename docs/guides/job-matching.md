# Job Matching Algorithms Guide

This guide explains the job matching algorithms used in the application and how they can be customized or extended.

## Overview

The application provides two main approaches to job matching:

1. **Resume-based matching**: Matches jobs based on skills extracted from the user's resume
2. **Title-based matching**: Matches jobs based on job titles specified by the user

Both approaches are implemented in the `job-service.js` module and can be customized to suit specific requirements.

## Resume-Based Matching

### How It Works

The resume-based matching algorithm works as follows:

1. Extract skills from the user's parsed resume
2. For each job in the database:
   - Extract skills from the job description (if not already present)
   - Count the number of matching skills between the resume and job
   - Calculate a match score based on the proportion of matching skills
3. Sort jobs by match score (descending) and return the top matches

### Implementation

The core matching function is `matchJobsBySkills` in `src/jobs/services/job-service.js`:

```javascript
async function matchJobsBySkills(skills, limit = 20) {
  try {
    if (!skills || skills.length === 0) {
      throw new Error('No skills provided for matching');
    }
    
    // Get all active jobs
    const jobs = await Job.find({ isActive: true });
    
    // Calculate match score for each job
    const scoredJobs = jobs.map(job => {
      // Extract skills from job description if not already present
      const jobSkills = job.skills.length > 0 ? job.skills : 
        extractSkillsFromText(job.description);
      
      // Count matching skills
      const matchingSkills = skills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(jobSkill.toLowerCase())
        )
      );
      
      // Calculate score (0-100)
      const score = jobSkills.length > 0 
        ? Math.round((matchingSkills.length / jobSkills.length) * 100)
        : 0;
      
      return {
        ...job.toObject(),
        score,
        matchingSkills
      };
    });
    
    // Sort by score (descending) and take top matches
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    logger.error('Error matching jobs by skills:', error);
    throw error;
  }
}
```

### Customization Options

You can customize the resume-based matching algorithm in several ways:

1. **Skill Extraction**: Modify the `extractSkillsFromText` function to use more sophisticated NLP techniques
2. **Matching Logic**: Change how skills are compared (e.g., use fuzzy matching or synonyms)
3. **Scoring Formula**: Adjust how the match score is calculated
4. **Additional Factors**: Consider other factors like location, experience level, etc.

## Title-Based Matching

### How It Works

The title-based matching algorithm works as follows:

1. Get the list of job titles specified by the user
2. Create regular expression patterns for each title
3. Find jobs that match any of the patterns
4. Return the matching jobs

### Implementation

The core matching function is `matchJobsByTitles` in `src/jobs/services/job-service.js`:

```javascript
async function matchJobsByTitles(titles, limit = 20) {
  try {
    if (!titles || titles.length === 0) {
      throw new Error('No job titles provided for matching');
    }
    
    // Create regex patterns for each title
    const patterns = titles.map(title => new RegExp(title, 'i'));
    
    // Find jobs matching any of the titles
    const jobs = await Job.find({
      isActive: true,
      title: { $in: patterns }
    })
    .limit(limit);
    
    return jobs;
  } catch (error) {
    logger.error('Error matching jobs by titles:', error);
    throw error;
  }
}
```

### Customization Options

You can customize the title-based matching algorithm in several ways:

1. **Pattern Matching**: Adjust how title patterns are created and matched
2. **Additional Filters**: Add filters for location, company, etc.
3. **Scoring**: Add a scoring system to rank matches by relevance
4. **Fuzzy Matching**: Implement fuzzy matching for job titles

## Advanced Matching Techniques

For more sophisticated matching, consider implementing these advanced techniques:

### 1. TF-IDF (Term Frequency-Inverse Document Frequency)

TF-IDF can be used to identify the most important terms in job descriptions and resumes:

```javascript
function calculateTfIdf(documents) {
  // Implementation of TF-IDF algorithm
  // ...
}
```

### 2. Word Embeddings

Word embeddings like Word2Vec or GloVe can capture semantic relationships between terms:

```javascript
async function loadWordEmbeddings() {
  // Load pre-trained word embeddings
  // ...
}

function calculateSimilarity(resumeEmbedding, jobEmbedding) {
  // Calculate cosine similarity between embeddings
  // ...
}
```

### 3. Machine Learning Models

Train a machine learning model to predict job-resume matches:

```javascript
async function trainMatchingModel(trainingData) {
  // Train a model using historical match data
  // ...
}

async function predictMatch(resume, job) {
  // Use the trained model to predict match quality
  // ...
}
```

## Integration with Preference Wizard

The job matching algorithms are integrated with the Matching Preference Wizard:

1. When a user selects "Match based on uploaded resume", the `matchJobsBySkills` function is used
2. When a user selects "Match based on job titles", the `matchJobsByTitles` function is used

The preference is stored in the user's profile and used by the `matchJobs` controller function.

## Performance Considerations

For large job databases, consider these performance optimizations:

1. **Indexing**: Ensure proper MongoDB indexes are in place
2. **Caching**: Cache matching results for frequently accessed resumes/titles
3. **Pagination**: Implement pagination for large result sets
4. **Background Processing**: Run matching operations in the background for large datasets

## Testing and Evaluation

To evaluate the quality of job matches:

1. **Precision and Recall**: Measure how many relevant jobs are returned
2. **User Feedback**: Collect feedback on match quality from users
3. **A/B Testing**: Compare different matching algorithms

## Conclusion

The job matching algorithms provide a foundation for connecting users with relevant job opportunities. By customizing and extending these algorithms, you can create a more personalized and effective job matching experience.
