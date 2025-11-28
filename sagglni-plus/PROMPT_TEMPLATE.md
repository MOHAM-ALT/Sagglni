# 📋 SAGGLNI PLUS - INTERVIEW PROMPT TEMPLATE

> **Version**: 1.0  
> **Last Updated**: 2025-11-28  
> **Purpose**: Generate structured profile data from AI interview

---

## 🎯 HOW TO USE THIS PROMPT

1. **Copy this entire prompt** from Sagglni Plus Extension
2. **Paste in your preferred AI**:
   - ChatGPT (openai.com)
   - Claude (claude.ai)
   - Ollama (local)
   - Any other AI you prefer
3. **Answer all questions honestly and completely**
4. **Copy the JSON output** (between the markers)
5. **Paste back in Sagglni Plus Extension**
6. **Click "Save Profile"** ✅

---

## 📝 BASIC INFORMATION

> You will provide this information. Extension will fill these automatically.

```
First Name: {{FIRST_NAME}}
Last Name: {{LAST_NAME}}
Email: {{EMAIL}}
Phone: {{PHONE}}
```

---

## ❓ INTERVIEW QUESTIONS

### Please answer the following questions in detail and honestly.

---

### **SECTION 1: EDUCATION**

> Tell me about your educational background, starting from high school or equivalent.

**Q1.1**: What is your **highest qualification**?
- (e.g., Bachelor's Degree, Master's Degree, Diploma, High School, etc.)

**Q1.2**: What **field/major** did you study?
- (e.g., Information Science, Business Administration, Mechanical Engineering, etc.)

**Q1.3**: From which **university/institution** did you graduate?
- (Full name of the institution)

**Q1.4**: When did you **graduate** (or will graduate)?
- (e.g., 2023, June 2024, etc.)

**Q1.5**: What was your **GPA/Grade** (if available)?
- (e.g., 3.21/5.0, 85%, A+, etc.)
- (Write "Not Available" if not applicable)

**Q1.6**: Do you have **any other degrees or diplomas**?
- (List all diplomas, certificates, additional degrees)
- (e.g., "HR Management Diploma from Saudi Public Administration Institute, 2019-2023")

**Q1.7**: Are you currently **studying or in school**?
- (Yes/No, and if yes, what are you studying?)

---

### **SECTION 2: WORK EXPERIENCE**

> Tell me about all your previous and current jobs.

**Q2.1**: What is your **current job title** or most recent job title?
- (e.g., Operations Manager, HR Officer, Data Analyst, etc.)

**Q2.2**: What **company/organization** are/were you working for?
- (Current or most recent company name)

**Q2.3**: How long have you **worked there** (or worked there)?
- (e.g., 1 year, 2023-2025, from January 2023 to present, etc.)

**Q2.4**: What are/were your **main responsibilities**?
- (List 3-5 key responsibilities)
- (e.g., "Managed 1,900 personnel, coordinated logistics, handled compliance")

**Q2.5**: What are/were your **major achievements** in this role?
- (List specific achievements with numbers if possible)
- (e.g., "Achieved 95% recruitment targets, maintained zero incident safety record")

**Q2.6**: Do you have **previous jobs** before this one?
- (If yes, list them with company name, job title, duration, and brief description)
- (Format: "Company Name | Job Title | 2023-2025 | Description")

**Q2.7**: What is your **total years of experience** in your field?
- (e.g., 5 years, 3+ years, etc.)

---

### **SECTION 3: SKILLS & COMPETENCIES**

> Tell me about your skills, both technical and soft skills.

**Q3.1**: What **technical skills** do you have?
- (e.g., Programming languages, software, tools, databases)
- (List: Python, SQL, Excel, Power BI, etc.)

**Q3.2**: What **soft skills** do you possess?
- (e.g., Leadership, Communication, Problem-solving, Time Management)
- (List: Team Leadership, Project Management, Negotiation, etc.)

**Q3.3**: What **languages** do you speak?
- (Language name and proficiency level: Native, Fluent, Advanced, Intermediate, Basic)
- (e.g., "Arabic - Native, English - Advanced")

**Q3.4**: Do you have any **certifications or licenses**?
- (List all professional certifications and licenses you hold)
- (e.g., "HR Management Diploma, Six Sigma Certification, etc.")

---

### **SECTION 4: WORK PREFERENCES & GOALS**

> Tell me about what kind of work you're looking for.

**Q4.1**: What **job titles** are you interested in?
- (List 3-5 positions you want to apply for)
- (e.g., "HR Officer, HR Specialist, Operations Manager")

**Q4.2**: What **industries or sectors** interest you?
- (e.g., Technology, Finance, Logistics, Healthcare, etc.)
- (Write "Any" if you're flexible)

**Q4.3**: Are you **willing to relocate** to a different city/country?
- (Yes/No)
- (If yes, where are you willing to go?)

**Q4.4**: Are you **willing to travel** for work?
- (Yes/No)
- (If yes, what percentage? e.g., 20%, 50%, 80%, etc.)

**Q4.5**: What is your **expected salary** (if any)?
- (Minimum salary range, e.g., "5000-8000 SAR", "50,000 USD per year")
- (Write "Flexible" if you're open)

**Q4.6**: What **type of employment** do you prefer?
- (e.g., Full-time, Part-time, Contract, Freelance, Temporary)
- (List all that you're willing to accept)

**Q4.7**: What **work environment** do you prefer?
- (e.g., Office, Remote, Hybrid)
- (List all that you're willing to accept)

---

### **SECTION 5: CAREER GOALS & ASPIRATIONS**

> Tell me about your career goals and vision.

**Q5.1**: Where do you see yourself **in 5 years**?
- (Describe your career goals and aspirations)

**Q5.2**: What are your **strengths** as a professional?
- (List 3-5 key strengths)

**Q5.3**: What are **areas you want to improve** or learn?
- (List skills or knowledge you want to develop)

**Q5.4**: What **motivates** you at work?
- (e.g., Career growth, financial stability, helping others, etc.)

---

### **SECTION 6: PERSONAL & ADDITIONAL INFORMATION**

> Any other information that might be relevant.

**Q6.1**: Do you have any **hobbies or interests**?
- (List if relevant to your professional profile)

**Q6.2**: Have you done any **volunteer work**?
- (List volunteer positions and what you did)

**Q6.3**: Do you have any **publications, awards, or recognition**?
- (List any notable achievements or publications)

**Q6.4**: Is there anything **else** you'd like to add about yourself?
- (Any additional information that helps us understand your profile better)

---

## 📊 OUTPUT FORMAT

> **IMPORTANT**: After answering all questions, please provide your complete profile data in the following JSON format EXACTLY as shown. This format is required for the Extension to accept it.

```json
===== START PROFILE DATA =====
{
  "personalInfo": {
    "firstName": "{{FIRST_NAME}}",
    "lastName": "{{LAST_NAME}}",
    "email": "{{EMAIL}}",
    "phone": "{{PHONE}}"
  },
  
  "education": [
    {
      "degree": "Bachelor's",
      "field": "Information Science",
      "university": "King Saud University",
      "graduationYear": 2023,
      "gpa": "3.21/5.0",
      "additionalInfo": "Specialization: Records Management & Electronic Storage"
    },
    {
      "degree": "Diploma",
      "field": "HR Management",
      "university": "Saudi Public Administration Institute",
      "graduationYear": 2023,
      "gpa": "N/A",
      "additionalInfo": ""
    }
  ],
  
  "experience": [
    {
      "jobTitle": "Operations Manager",
      "company": "Secu Company",
      "startDate": "2024",
      "endDate": "2025",
      "duration": "1 year",
      "responsibilities": [
        "Recruited, trained, and deployed 1,900+ security personnel",
        "Managed large-scale international events logistics",
        "Coordinated international delegates and operations"
      ],
      "achievements": [
        "95% recruitment targets achieved within deadlines",
        "100% personnel deployment rate",
        "Zero security incidents across all events",
        "Developed automated employee tracking systems"
      ]
    },
    {
      "jobTitle": "International Guest Operations Manager",
      "company": "Aone Company",
      "startDate": "2025",
      "endDate": "Present",
      "duration": "Ongoing",
      "responsibilities": [
        "Manage logistics for 500+ international delegates",
        "Coordinate visa and registration processes",
        "Ensure smooth guest arrival and accommodation"
      ],
      "achievements": [
        "100% arrival rate with zero delays",
        "Implemented fraud prevention system for visa applications",
        "Reduced processing time by 60% through digital optimization"
      ]
    }
  ],
  
  "skills": {
    "technical": [
      "Microsoft Excel (Advanced - Formulas, PivotTables, VBA)",
      "SQL (Database queries and management)",
      "Python (Basics for automation)",
      "Power BI (Data visualization)",
      "Git & GitHub (Version control)"
    ],
    "soft": [
      "Team Leadership",
      "Operations Management",
      "Problem-solving",
      "Communication",
      "Time Management",
      "Crisis Management",
      "Strategic Planning"
    ]
  },
  
  "languages": [
    {
      "language": "Arabic",
      "level": "Native",
      "reading": 10,
      "writing": 10,
      "speaking": 10
    },
    {
      "language": "English",
      "level": "Advanced",
      "reading": 7,
      "writing": 6,
      "speaking": 6
    }
  ],
  
  "certifications": [
    {
      "name": "HR Management Diploma",
      "issuer": "Saudi Public Administration Institute",
      "year": 2023,
      "expirationYear": "N/A"
    },
    {
      "name": "Distinguished Service Operations & Executive Relations",
      "issuer": "Al Rajhi Bank",
      "year": 2023,
      "expirationYear": "N/A"
    }
  ],
  
  "workPreferences": {
    "targetPositions": [
      "HR Officer",
      "Operations Manager",
      "HR Specialist",
      "Administrative Coordinator"
    ],
    "preferredIndustries": [
      "Technology",
      "Finance",
      "Healthcare",
      "Logistics",
      "Maritime"
    ],
    "willingToRelocate": true,
    "relocationCities": "Any city in Saudi Arabia",
    "willingToTravel": true,
    "maxTravelPercentage": 80,
    "employmentTypes": [
      "Full-time",
      "Part-time",
      "Contract",
      "Temporary"
    ],
    "workEnvironments": [
      "Office",
      "Remote",
      "Hybrid"
    ],
    "minimumSalary": 5000,
    "expectedSalaryRange": "5000-8000 SAR",
    "salaryFlexible": false
  },
  
  "careerGoals": {
    "fiveYearVision": "Reach a leadership position in HR or Operations Management, contributing to organizational growth and strategy",
    "strengths": [
      "Large team management (1,900+ personnel)",
      "Strategic planning and execution",
      "International coordination",
      "Crisis management and problem-solving",
      "Continuous learning and development"
    ],
    "areasToImprove": [
      "Advanced programming skills",
      "Data science and analytics",
      "Executive-level certifications"
    ],
    "workMotivation": [
      "Career growth and advancement",
      "Financial stability",
      "Contributing to organizational success",
      "Building and leading effective teams"
    ]
  },
  
  "additionalInfo": {
    "hobbies": [
      "Swimming",
      "Sports and fitness",
      "Professional development"
    ],
    "volunteerWork": "None currently",
    "awardsAndRecognition": [
      "Perfect safety record across 1,900 personnel management"
    ],
    "additionalNotes": "Seeking positions that leverage operations management and HR expertise in international or maritime sector"
  }
}
===== END PROFILE DATA =====
```

---

## ✅ IMPORTANT INSTRUCTIONS FOR THE AI

> Please follow these instructions when generating the profile:

1. **Be Comprehensive**: Ask clarifying questions if the user's answers are vague
2. **Verify Information**: Make sure all dates, numbers, and facts are logical and consistent
3. **Format Correctly**: Return ONLY the JSON structure above, nothing else
4. **Fill All Fields**: Do not leave empty fields unless explicitly marked as "N/A"
5. **Use Exact Structure**: The Extension will ONLY accept the exact JSON format shown
6. **Maintain Order**: Keep fields in the same order as shown in the template
7. **Validate Data**: Check that years make sense, durations are correct, etc.

---

## 🔍 EXAMPLE FLOW

### User Answers:

```
Q1.1: "I have a Bachelor's degree"
Q1.2: "Information Science"
Q1.3: "King Saud University"
Q1.4: "2023"
Q1.5: "3.21"
Q1.6: "I also have an HR diploma from 2019-2023"
[... answers more questions ...]
```

### AI Returns (in JSON):

```json
===== START PROFILE DATA =====
{
  "personalInfo": {
    "firstName": "Mohammed",
    "lastName": "Al-Namlan",
    ...
  },
  ...
}
===== END PROFILE DATA =====
```

### User:
1. Copies JSON (from ===== START to ===== END)
2. Pastes in Sagglni Plus Extension
3. Clicks "Save Profile"
4. ✅ Profile is ready!

---

## 📌 NOTES

- **No Character Limit**: Answer questions as completely as possible
- **Honesty**: Be truthful about your qualifications and experience
- **Accuracy**: Double-check dates, numbers, and names
- **Clarity**: Be specific rather than vague in your answers
- **Completeness**: Don't skip questions - answer all of them

---

## ⚠️ VALIDATION CHECKLIST

Before pasting the JSON back into the Extension, verify:

- [ ] JSON is valid (no syntax errors)
- [ ] All required fields are filled
- [ ] Between "===== START PROFILE DATA =====" and "===== END PROFILE DATA =====" markers
- [ ] All dates are in correct format (YYYY format for years)
- [ ] All arrays have proper content
- [ ] No empty objects or arrays (unless explicitly allowed)
- [ ] Personal information matches what you provided initially

---

**Version History**:
- v1.0 (2025-11-28): Initial template created

**For Support**: If you have questions about this template, contact Sagglni Plus support.

---

**Ready to create your profile? Start copying and pasting! 🚀**
