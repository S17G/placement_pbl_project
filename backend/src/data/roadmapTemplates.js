// Hardcoded roadmap templates for different branches and years
const roadmapTemplates = {
  'cse-2024': {
    branch: 'CSE',
    year: 2024,
    target: 'placement',
    title: 'CSE 2024 Placement Roadmap',
    dsa: [
      { topic: 'Arrays & Strings', difficulty: 'Easy', duration: '1 week', status: 'pending' },
      { topic: 'Linked Lists', difficulty: 'Easy', duration: '1 week', status: 'pending' },
      { topic: 'Stacks & Queues', difficulty: 'Medium', duration: '1 week', status: 'pending' },
      { topic: 'Trees & Graphs', difficulty: 'Medium', duration: '2 weeks', status: 'pending' },
      { topic: 'Dynamic Programming', difficulty: 'Hard', duration: '2 weeks', status: 'pending' },
      { topic: 'Backtracking & Greedy', difficulty: 'Medium', duration: '1 week', status: 'pending' },
    ],
    coreSubjects: [
      { subject: 'Operating Systems', duration: '2 weeks', status: 'pending' },
      { subject: 'Database Management Systems', duration: '2 weeks', status: 'pending' },
      { subject: 'Computer Networks', duration: '1.5 weeks', status: 'pending' },
      { subject: 'Object Oriented Programming', duration: '1.5 weeks', status: 'pending' },
    ],
    projects: [
      { title: 'Chat Application', tech: 'Node.js, React, Socket.io', duration: '2 weeks', status: 'pending' },
      { title: 'E-commerce Platform', tech: 'MERN Stack', duration: '3 weeks', status: 'pending' },
      { title: 'Task Management System', tech: 'React, Firebase', duration: '1.5 weeks', status: 'pending' },
    ],
    aptitude: [
      { topic: 'Quantitative Aptitude', subtopics: ['Number System', 'Percentage', 'Profit & Loss'], duration: '1 week', status: 'pending' },
      { topic: 'Logical Reasoning', subtopics: ['Puzzles', 'Series', 'Coding'], duration: '1 week', status: 'pending' },
      { topic: 'Verbal Ability', subtopics: ['Reading Comprehension', 'Synonyms', 'Grammar'], duration: '1 week', status: 'pending' },
    ],
    mockInterviews: [
      { round: 'Technical Round 1', topics: 'DSA, Core Subjects', status: 'pending' },
      { round: 'Technical Round 2', topics: 'Advanced DSA, System Design', status: 'pending' },
      { round: 'HR Round', topics: 'Communication, Behavioral', status: 'pending' },
    ],
    timeline: '12-16 weeks',
    estimatedCompletion: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'cse-2023': {
    branch: 'CSE',
    year: 2023,
    target: 'placement',
    title: 'CSE 2023 Placement Roadmap',
    dsa: [
      { topic: 'Basic Algorithms', difficulty: 'Easy', duration: '1 week', status: 'pending' },
      { topic: 'Searching & Sorting', difficulty: 'Easy', duration: '1 week', status: 'pending' },
      { topic: 'Advanced Data Structures', difficulty: 'Hard', duration: '3 weeks', status: 'pending' },
      { topic: 'Competitive Programming', difficulty: 'Hard', duration: '2 weeks', status: 'pending' },
    ],
    coreSubjects: [
      { subject: 'Compiler Design', duration: '1.5 weeks', status: 'pending' },
      { subject: 'Microprocessors', duration: '1.5 weeks', status: 'pending' },
      { subject: 'Web Technologies', duration: '2 weeks', status: 'pending' },
    ],
    projects: [
      { title: 'Compiler Project', tech: 'C/Python', duration: '2 weeks', status: 'pending' },
      { title: 'Full Stack Web App', tech: 'MERN', duration: '3 weeks', status: 'pending' },
    ],
    aptitude: [
      { topic: 'Quantitative Aptitude', subtopics: ['Ratios', 'Time & Work', 'Probability'], duration: '1 week', status: 'pending' },
      { topic: 'Analytical Reasoning', subtopics: ['Venn Diagrams', 'Sequences'], duration: '1 week', status: 'pending' },
    ],
    mockInterviews: [
      { round: 'Technical Round 1', topics: 'DSA Fundamentals', status: 'pending' },
      { round: 'Technical Round 2', topics: 'System Design & Projects', status: 'pending' },
      { round: 'Final Round', topics: 'HR & Negotiation', status: 'pending' },
    ],
    timeline: '10-14 weeks',
    estimatedCompletion: new Date(Date.now() + 14 * 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'etc-2024': {
    branch: 'ETC',
    year: 2024,
    target: 'placement',
    title: 'ETC 2024 Placement Roadmap',
    dsa: [
      { topic: 'Signal Processing Basics', difficulty: 'Medium', duration: '1.5 weeks', status: 'pending' },
      { topic: 'Digital Signal Processing', difficulty: 'Hard', duration: '2 weeks', status: 'pending' },
      { topic: 'Circuit Analysis', difficulty: 'Medium', duration: '1.5 weeks', status: 'pending' },
    ],
    coreSubjects: [
      { subject: 'Embedded Systems', duration: '2 weeks', status: 'pending' },
      { subject: 'VLSI Design', duration: '2 weeks', status: 'pending' },
      { subject: 'Communication Systems', duration: '2 weeks', status: 'pending' },
    ],
    projects: [
      { title: 'IoT Based Weather Station', tech: 'Arduino, Sensors', duration: '2 weeks', status: 'pending' },
      { title: 'FPGA Implementation', tech: 'Verilog, FPGA', duration: '3 weeks', status: 'pending' },
    ],
    aptitude: [
      { topic: 'Quantitative Aptitude', subtopics: ['Physics Problems', 'Mathematics'], duration: '1.5 weeks', status: 'pending' },
      { topic: 'Technical Aptitude', subtopics: ['Circuit Problems', 'Signal Analysis'], duration: '1.5 weeks', status: 'pending' },
    ],
    mockInterviews: [
      { round: 'Technical Round 1', topics: 'Circuits & Signals', status: 'pending' },
      { round: 'Technical Round 2', topics: 'Embedded Systems & Projects', status: 'pending' },
      { round: 'HR Round', topics: 'Communication & Problem Solving', status: 'pending' },
    ],
    timeline: '12-16 weeks',
    estimatedCompletion: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

module.exports = roadmapTemplates;
