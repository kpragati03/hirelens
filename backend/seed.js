/**
 * Seed HireLens with Pragati Kumari's profile, the 5 demo jobs and
 * her 5 applications (all in the Applied stage, with the known match scores).
 *
 * Usage:
 *   cd backend
 *   cp .env.example .env   # set MONGODB_URI
 *   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');
const Profile = require('./models/Profile');
const Application = require('./models/Application');
const Submission = require('./models/Submission');
const Interview = require('./models/Interview');

const PROFILE = {
  name: 'Pragati Kumari',
  headline: 'Computer Science Undergraduate | Full-Stack Developer | TDM Intern',
  email: 'pragati111kumari@gmail.com',
  location: 'Phagwara, Punjab, India',
  skills: 'Java, Python, JavaScript, React, Node.js, Express.js, MongoDB, MySQL, HTML, CSS, Bootstrap, PHP, Git, Agile/Scrum, JIRA',
  experienceYears: 1,
  summary: 'B.Tech Computer Science student at Lovely Professional University with hands-on experience in full-stack web development, project delivery and agile teamwork. Intern at Codefeast and JPMorgan Chase virtual programme, with MERN-stack projects focused on usable, responsive and performant web applications.',
  resumeText: 'Pragati Kumari — B.Tech Computer Science and Engineering, Lovely Professional University, Phagwara (Aug 2023 – Present, CGPA 7.38). TDM Intern at Codefeast (Oct 2025 – Jun 2026): managed end-to-end project delivery, coordinated teams, planned sprints, resolved technical blockers, handled client communication. Virtual Software Engineering Intern at JPMorgan Chase & Co. (Oct 2025): backend setup, Kafka integration, H2 database, REST APIs with Java and Spring Boot. Projects: Resume Generator Website (MERN, Sep 2025) with real-time preview and multi-format export, cutting input errors by 40%; Personal Portfolio Website (MERN, Jul 2025). Skills: Java, Python, JavaScript, React, Node.js, Express.js, MongoDB, MySQL, HTML, CSS, Bootstrap, PHP, Git, Agile/Scrum, JIRA. Certifications: Oracle Cloud Infrastructure 2025 Certified Generative AI Professional, Full Stack Web Development (InternsElite), Data Structures and Algorithms (NeoColab). Achievements: 4-star Java on HackerRank, 160-day DSA challenge on GeeksforGeeks, 1st Runner-up HackWithVertos 1.0.',
};

const JOBS = [
  {
    title: 'Full-Stack Developer (MERN)', company: 'Codefeast', location: 'Bengaluru (Remote-friendly)',
    jobType: 'Full-time', level: 'Junior', salary: '₹6–8 LPA',
    skills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Git'],
    description: 'Build and ship full-stack web applications with the MERN stack. You will work in agile sprints, build REST APIs, develop React interfaces, and coordinate with designers and backend developers to deliver on-time releases.',
    matchScore: 95,
  },
  {
    title: 'Software Development Engineer', company: 'JPMorgan Chase & Co.', location: 'Mumbai',
    jobType: 'Full-time', level: 'Entry Level', salary: '₹12–15 LPA',
    skills: ['Java', 'Spring Boot', 'Kafka', 'REST APIs', 'H2', 'Git'],
    description: 'Join the engineering team to build reliable backend services in Java and Spring Boot. Work with Kafka for event-driven messaging, H2 and relational databases, and REST APIs, with a focus on testing, debugging and code quality.',
    matchScore: 90,
  },
  {
    title: 'Frontend Developer (React)', company: 'Zeta Tech', location: 'Remote',
    jobType: 'Full-time', level: 'Junior', salary: '₹5–7 LPA',
    skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Bootstrap', 'Node.js'],
    description: 'Own the frontend for a customer-facing product. Build responsive, accessible React interfaces, optimise performance, and work closely with product and design to ship polished user experiences.',
    matchScore: 90,
  },
  {
    title: 'Backend Developer (Node.js)', company: 'Freshworks', location: 'Chennai',
    jobType: 'Full-time', level: 'Junior', salary: '₹7–9 LPA',
    skills: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'REST APIs', 'JavaScript'],
    description: 'Design and build scalable Node.js backend services and REST APIs, work with MongoDB and MySQL, and improve reliability, logging and performance across our SaaS platform.',
    matchScore: 88,
  },
  {
    title: 'Generative AI Intern', company: 'Oracle', location: 'Bengaluru',
    jobType: 'Internship', level: 'Intern', salary: '₹30,000/month stipend',
    skills: ['Python', 'Generative AI', 'JavaScript', 'React', 'MongoDB'],
    description: 'Work on generative AI prototypes and internal tools. Use Python and JavaScript to build AI-assisted features, experiment with LLM APIs, and present demos to the team. Ideal for someone with a Generative AI certification and full-stack basics.',
    matchScore: 90,
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set. Copy backend/.env.example to backend/.env and set it first.');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected — clearing HireLens collections…');
  await Promise.all([
    Job.deleteMany({}), Profile.deleteMany({}), Application.deleteMany({}),
    Submission.deleteMany({}), Interview.deleteMany({}),
  ]);

  const profile = await Profile.create(PROFILE);
  console.log('Profile seeded:', profile.email);

  const jobs = [];
  for (const j of JOBS) {
    const { matchScore, ...jobData } = j;
    const job = await Job.create(jobData);
    jobs.push({ job, matchScore });
    console.log('Job seeded:', job.title, '—', job.company);
  }

  for (const { job, matchScore } of jobs) {
    await Application.create({
      jobId: job._id,
      jobTitle: job.title,
      company: job.company,
      candidateName: PROFILE.name,
      candidateEmail: PROFILE.email,
      skills: PROFILE.skills,
      matchScore,
      matchedSkills: job.skills,
      missingSkills: [],
      aiSummary: 'Strong match — shortlist recommended.',
      stage: 'Applied',
    });
  }
  console.log('5 applications seeded (all Applied). Done.');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err.message); process.exit(1); });
