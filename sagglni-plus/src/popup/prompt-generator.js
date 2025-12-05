/**
 * Build interview prompt for the AI based on comprehensive profile data collection.
 * Generates interview questions that guide users to provide complete profile information.
 */

/**
 * Generate a comprehensive JSON example matching the profile schema
 */
function generateExampleJSON() {
  return {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    gender: "Male",
    nationality: "American",
    city: "San Francisco",
    postalCode: "94105",
    education: [
      {
        university: "Stanford University",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startYear: 2012,
        graduationYear: 2016,
        gpa: "3.8",
        country: "USA",
        stillAttending: false
      }
    ],
    experience: [
      {
        jobTitle: "Senior Software Engineer",
        company: "Tech Company Inc",
        startDate: "2020-06-01",
        endDate: null,
        currentlyWorking: true,
        description: "Led development of microservices architecture. Mentored junior engineers."
      }
    ],
    skills: {
      technical: ["JavaScript", "Python", "Go", "React", "PostgreSQL"],
      soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"]
    },
    languages: [
      { language: "English", level: "native" },
      { language: "Spanish", level: "fluent" }
    ],
    preferences: {
      targetPositions: "Senior Software Engineer, Tech Lead",
      willingToRelocate: true,
      willingToTravel: true,
      maxTravelPercentage: 20,
      employmentTypes: ["Full-time", "Contract"]
    }
  };
}

function summarizeProfileForPrompt(profile) {
  const pi = (profile && profile.data && profile.data.personalInfo) || {};
  const skills = (profile && profile.data && profile.data.skills && profile.data.skills.technical) || [];
  const short = {
    firstName: pi.firstName || null,
    lastName: pi.lastName || null,
    email: pi.email || null,
    phone: pi.phone || null,
    topSkills: skills.slice(0, 5),
  };
  return short;
}

/**
 * Build comprehensive interview prompt with detailed questions
 * @param {Object} profile - The profile object
 * @param {Object} options - { modelType: 'default'|'lmstudio', concise: bool }
 */
function buildInterviewPrompt(profile, options = {}) {
  const opt = Object.assign({ modelType: 'default', concise: false }, options);

  // Minimal prompt for LM Studio
  if (opt.modelType === 'lmstudio' || opt.concise) {
    const data = summarizeProfileForPrompt(profile);
    const content = [];
    Object.keys(data).forEach(k => {
      const v = data[k];
      if (v === null || (Array.isArray(v) && v.length === 0)) return;
      if (Array.isArray(v)) content.push(`${k}: ${v.join(', ')}`);
      else content.push(`${k}: ${v}`);
    });
    const body = content.join('\n');
    const prompt = `You are a helpful assistant. Given the profile metadata below, return a compact JSON object that conforms to the Sagglni profile schema. Return only JSON, no extra commentary. If a field cannot be inferred, set it to null.\n\n${body}\n\nOutput between markers:\n===== START PROFILE DATA =====\n{ ... }\n===== END PROFILE DATA =====`;
    return prompt;
  }

  // Comprehensive interview prompt
  const exampleJSON = generateExampleJSON();
  const prompt = `# Interview: Complete Your Professional Profile

Please answer the following detailed questions about yourself. Your responses will be converted to JSON format for your professional profile.

## INSTRUCTIONS:
1. Answer each question thoughtfully and completely
2. Provide specific details where requested
3. After answering, format your response as JSON (see example below)
4. Wrap your JSON response between the markers:
   ===== START PROFILE DATA =====
   { ...your JSON here... }
   ===== END PROFILE DATA =====

---

## PERSONAL INFORMATION

**1. What is your full legal name?**
(First Name, Last Name)

**2. What is your primary email address?**
(e.g., name@example.com)

**3. What is your phone number?**
(Include country code, e.g., +1-555-123-4567)

**4. What is your date of birth?**
(Format: YYYY-MM-DD, e.g., 1990-05-15)

**5. What is your gender?**
(e.g., Male, Female, Non-binary, Prefer not to say)

**6. What is your nationality?**
(e.g., American, British, Canadian)

**7. Where do you currently live?**
(City and postal/zip code)

---

## EDUCATION

**8. List all your formal education (universities, colleges, trade schools):**

For each educational institution, provide:
- Name of university/institution
- Degree obtained (e.g., Bachelor of Science, Master of Arts)
- Field of study/major
- Graduation year
- GPA (if applicable)
- Country of institution
- Are you still attending? (Yes/No)

Example:
- Stanford University, Bachelor of Science in Computer Science, 2016, GPA: 3.8, USA
- MIT, Master of Science in Computer Science, 2018, GPA: 3.9, USA

---

## WORK EXPERIENCE

**9. List all your professional work experience (most recent first):**

For each position, provide:
- Job title
- Company name
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format, leave blank if still working)
- Are you still working there? (Yes/No)
- Key achievements and responsibilities

Example:
- Senior Software Engineer at Tech Company Inc, 2020-present
  Achievements: Led microservices architecture, mentored 5 junior engineers, improved system performance by 40%

---

## TECHNICAL SKILLS

**10. List all your technical skills and programming languages:**

Format: Comma-separated list in order of proficiency (most proficient first)

Examples: JavaScript, Python, Go, React, PostgreSQL, Docker, Kubernetes, AWS, etc.

---

## SOFT SKILLS

**11. What are your key soft skills?**

Examples: Leadership, Project Management, Communication, Problem Solving, Team Collaboration, etc.

---

## LANGUAGES

**12. What languages do you speak and at what proficiency level?**

For each language:
- Language name
- Proficiency level: (Basic, Conversational, Fluent, Native)

Example:
- English: Native
- Spanish: Fluent
- French: Basic

---

## WORK PREFERENCES

**13. What position(s) are you targeting?**

Examples: Senior Software Engineer, Tech Lead, Product Manager, Full-Stack Developer

**14. Are you willing to relocate?** (Yes/No)

**15. Are you willing to travel for work?** (Yes/No)

**16. If yes to travel, what is the maximum percentage?** (0-100%)

**17. What employment types interest you?**

Options: Full-time, Part-time, Contract, Freelance, Remote

---

## EXPECTED JSON OUTPUT

After answering all questions, format your complete response as valid JSON matching this structure:

\`\`\`json
${JSON.stringify(exampleJSON, null, 2)}
\`\`\`

Wrap your final JSON response between these exact markers:
===== START PROFILE DATA =====
{ ...your complete JSON response... }
===== END PROFILE DATA =====

---

## IMPORTANT NOTES:
- All string values must be in double quotes
- Use null for empty fields
- Dates must be in YYYY-MM-DD format
- Arrays use square brackets [ ]
- Return ONLY valid JSON between the markers
- No additional text or commentary after the JSON

---

**Please provide your complete profile information in JSON format:**`;

  return prompt;
}

/**
 * Generate a condensed prompt for quick updates
 */
function buildQuickUpdatePrompt(profile) {
  const pi = profile?.data?.personalInfo || {};
  const currentJobs = (profile?.data?.experience || []).filter(e => e.currentlyWorking);
  const skills = profile?.data?.skills?.technical || [];

  return `Update my professional profile with the following information:

Current Profile:
- Name: ${pi.firstName} ${pi.lastName}
- Email: ${pi.email}
- Phone: ${pi.phone}
- Current Role(s): ${currentJobs.map(j => j.jobTitle).join(', ') || 'Not specified'}
- Top Skills: ${skills.slice(0, 5).join(', ') || 'Not specified'}

Please help me update any outdated information. Provide the complete updated profile in JSON format between markers:
===== START PROFILE DATA =====
{ ...updated JSON here... }
===== END PROFILE DATA =====`;
}

module.exports = { buildInterviewPrompt, generateExampleJSON, buildQuickUpdatePrompt };
if (typeof window !== 'undefined') {
  window.buildInterviewPrompt = buildInterviewPrompt;
  window.generateExampleJSON = generateExampleJSON;
  window.buildQuickUpdatePrompt = buildQuickUpdatePrompt;
}
