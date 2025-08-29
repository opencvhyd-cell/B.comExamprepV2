export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  prerequisites?: string[];
}

export interface SemesterSubjects {
  semester: number;
  year: number;
  subjects: Subject[];
  totalCredits: number;
}

export interface StreamSubjects {
  stream: string;
  semesters: SemesterSubjects[];
}

// Comprehensive B.Com Subject Mapping based on actual curriculum
export const BCOM_SUBJECTS: StreamSubjects[] = [
  {
    stream: 'General',
    semesters: [
      {
        semester: 1,
        year: 1,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr101_gen',
            name: 'Financial Accounting-I',
            code: 'MJR101',
            credits: 5,
            description: 'Introduction to accounting principles, double-entry bookkeeping, and financial statements',
            difficulty: 'beginner',
            topics: [
              'Basic Accounting Concepts',
              'Double Entry System',
              'Journal and Ledger',
              'Trial Balance',
              'Financial Statements',
              'Bank Reconciliation'
            ]
          },
          {
            id: 'mjr102_gen',
            name: 'Business Organization and Management',
            code: 'MJR102',
            credits: 5,
            description: 'Fundamentals of business organization, management principles, and organizational behavior',
            difficulty: 'beginner',
            topics: [
              'Business Environment',
              'Forms of Business Organization',
              'Management Functions',
              'Organizational Structure',
              'Leadership Styles',
              'Motivation Theories'
            ]
          },
          {
            id: 'mjr103_gen',
            name: 'Business Economics',
            code: 'MJR103',
            credits: 5,
            description: 'Microeconomic principles applied to business decision-making',
            difficulty: 'beginner',
            topics: [
              'Demand and Supply',
              'Elasticity of Demand',
              'Consumer Behavior',
              'Production Theory',
              'Cost Analysis',
              'Market Structures'
            ]
          }
        ]
      },
      {
        semester: 2,
        year: 1,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr201_gen',
            name: 'Financial Accounting-II',
            code: 'MJR201',
            credits: 5,
            description: 'Advanced accounting concepts including partnership and company accounts',
            difficulty: 'intermediate',
            topics: [
              'Partnership Accounts',
              'Company Accounts',
              'Issue of Shares',
              'Debentures',
              'Final Accounts',
              'Accounting Standards'
            ],
            prerequisites: ['mjr101_gen']
          },
          {
            id: 'mjr202_gen',
            name: 'Business Laws',
            code: 'MJR202',
            credits: 5,
            description: 'Legal framework governing business operations and contracts',
            difficulty: 'intermediate',
            topics: [
              'Contract Law',
              'Company Law',
              'Partnership Law',
              'Consumer Protection',
              'Intellectual Property',
              'Business Ethics'
            ]
          },
          {
            id: 'mjr203_gen',
            name: 'Banking and Financial Services',
            code: 'MJR203',
            credits: 5,
            description: 'Banking operations, financial services, and regulatory framework',
            difficulty: 'intermediate',
            topics: [
              'Banking Operations',
              'Financial Services',
              'Credit Management',
              'Risk Management',
              'Regulatory Framework',
              'Digital Banking'
            ]
          }
        ]
      },
      {
        semester: 3,
        year: 2,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr301_gen',
            name: 'Advanced Accounting',
            code: 'MJR301',
            credits: 5,
            description: 'Advanced accounting concepts and complex financial reporting',
            difficulty: 'intermediate',
            topics: [
              'Consolidated Accounts',
              'Branch Accounts',
              'Departmental Accounts',
              'Foreign Exchange',
              'Advanced Financial Statements',
              'Accounting Standards'
            ],
            prerequisites: ['mjr201_gen']
          },
          {
            id: 'mjr302_gen',
            name: 'Business Statistics-I',
            code: 'MJR302',
            credits: 5,
            description: 'Statistical methods and data analysis for business decision making',
            difficulty: 'intermediate',
            topics: [
              'Descriptive Statistics',
              'Probability Distributions',
              'Sampling Methods',
              'Hypothesis Testing',
              'Correlation Analysis',
              'Regression Analysis'
            ]
          },
          {
            id: 'mjr303_gen',
            name: 'Auditing',
            code: 'MJR303',
            credits: 5,
            description: 'Audit principles, procedures, and internal control systems',
            difficulty: 'intermediate',
            topics: [
              'Audit Planning',
              'Internal Control',
              'Audit Evidence',
              'Audit Reports',
              'Fraud Detection',
              'Compliance Auditing'
            ],
            prerequisites: ['mjr301_gen']
          }
        ]
      },
      {
        semester: 4,
        year: 2,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr401_gen',
            name: 'Corporate Accounting',
            code: 'MJR401',
            credits: 5,
            description: 'Corporate accounting practices and financial reporting',
            difficulty: 'advanced',
            topics: [
              'Share Capital',
              'Debentures',
              'Dividends',
              'Corporate Financial Statements',
              'Mergers and Acquisitions',
              'Corporate Governance'
            ],
            prerequisites: ['mjr301_gen']
          },
          {
            id: 'mjr402_gen',
            name: 'Business Statistics-II',
            code: 'MJR402',
            credits: 5,
            description: 'Advanced statistical techniques and business analytics',
            difficulty: 'advanced',
            topics: [
              'Time Series Analysis',
              'Index Numbers',
              'Quality Control',
              'Multivariate Analysis',
              'Forecasting Methods',
              'Statistical Software'
            ],
            prerequisites: ['mjr302_gen']
          },
          {
            id: 'mjr403_gen',
            name: 'Income Tax',
            code: 'MJR403',
            credits: 5,
            description: 'Income tax provisions, computation, and tax planning',
            difficulty: 'advanced',
            topics: [
              'Tax Computation',
              'Deductions and Exemptions',
              'Tax Planning',
              'Tax Returns',
              'Tax Audit',
              'International Taxation'
            ],
            prerequisites: ['mjr201_gen']
          }
        ]
      },
      {
        semester: 5,
        year: 3,
        totalCredits: 20,
        subjects: [
          {
            id: 'mjr501_gen',
            name: 'Cost Accounting',
            code: 'MJR501',
            credits: 5,
            description: 'Cost concepts, classification, and cost accounting methods',
            difficulty: 'advanced',
            topics: [
              'Cost Classification',
              'Job Costing',
              'Process Costing',
              'Marginal Costing',
              'Standard Costing',
              'Variance Analysis'
            ],
            prerequisites: ['mjr301_gen']
          },
          {
            id: 'mjr502_gen',
            name: 'Business Ethics & Corporate Governance',
            code: 'MJR502',
            credits: 5,
            description: 'Ethical business practices and corporate governance principles',
            difficulty: 'intermediate',
            topics: [
              'Business Ethics',
              'Corporate Governance',
              'Corporate Social Responsibility',
              'Ethical Decision Making',
              'Stakeholder Management',
              'Sustainability'
            ]
          },
          {
            id: 'mdc503_gen',
            name: 'Principles of Management',
            code: 'MDC503',
            credits: 5,
            description: 'Management principles and organizational behavior',
            difficulty: 'intermediate',
            topics: [
              'Management Functions',
              'Organizational Behavior',
              'Leadership',
              'Motivation',
              'Communication',
              'Change Management'
            ]
          },
          {
            id: 'sec1_gen',
            name: 'Communication Skills',
            code: 'SEC1',
            credits: 2.5,
            description: 'Effective communication skills for business professionals',
            difficulty: 'beginner',
            topics: [
              'Business Writing',
              'Oral Communication',
              'Presentation Skills',
              'Interpersonal Skills',
              'Cross-cultural Communication',
              'Digital Communication'
            ]
          },
          {
            id: 'sec2_gen',
            name: 'Professional Development Skills',
            code: 'SEC2',
            credits: 2.5,
            description: 'Professional skills and career development',
            difficulty: 'beginner',
            topics: [
              'Career Planning',
              'Professional Networking',
              'Time Management',
              'Stress Management',
              'Personal Branding',
              'Continuous Learning'
            ]
          }
        ]
      },
      {
        semester: 6,
        year: 3,
        totalCredits: 20,
        subjects: [
          {
            id: 'mjr601_gen',
            name: 'Management Accounting',
            code: 'MJR601',
            credits: 5,
            description: 'Accounting information for management decision making',
            difficulty: 'advanced',
            topics: [
              'Budgeting',
              'Performance Measurement',
              'Responsibility Accounting',
              'Transfer Pricing',
              'Strategic Cost Management',
              'Balanced Scorecard'
            ],
            prerequisites: ['mjr501_gen']
          },
          {
            id: 'mjr602_gen',
            name: 'Theory and Practice of GST',
            code: 'MJR602',
            credits: 5,
            description: 'Goods and Services Tax principles and implementation',
            difficulty: 'advanced',
            topics: [
              'GST Framework',
              'Tax Computation',
              'Input Tax Credit',
              'GST Returns',
              'Compliance',
              'GST Software'
            ]
          },
          {
            id: 'rmp603_gen',
            name: 'Research Methodology',
            code: 'RMP603',
            credits: 5,
            description: 'Research methods and project work',
            difficulty: 'advanced',
            topics: [
              'Research Design',
              'Data Collection',
              'Data Analysis',
              'Report Writing',
              'Project Management',
              'Research Ethics'
            ]
          },
          {
            id: 'sec3_gen',
            name: 'Fundamentals of AI Tools',
            code: 'SEC3',
            credits: 2.5,
            description: 'Introduction to artificial intelligence tools and applications',
            difficulty: 'intermediate',
            topics: [
              'AI Fundamentals',
              'Machine Learning Basics',
              'AI Tools and Platforms',
              'Business Applications',
              'Ethical AI',
              'Future of AI'
            ]
          },
          {
            id: 'sec4_gen',
            name: 'Computerized Accounting',
            code: 'SEC4',
            credits: 2.5,
            description: 'Computerized accounting systems and software',
            difficulty: 'intermediate',
            topics: [
              'Accounting Software',
              'Tally ERP',
              'QuickBooks',
              'Excel for Accounting',
              'Digital Bookkeeping',
              'Cloud Accounting'
            ]
          }
        ]
      }
    ]
  },
  {
    stream: 'Computer Applications',
    semesters: [
      {
        semester: 1,
        year: 1,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr101_ca',
            name: 'Financial Accounting-I',
            code: 'MJR101',
            credits: 5,
            description: 'Introduction to accounting principles and computerized accounting',
            difficulty: 'beginner',
            topics: [
              'Basic Accounting Concepts',
              'Double Entry System',
              'Journal and Ledger',
              'Trial Balance',
              'Financial Statements',
              'Computerized Accounting'
            ]
          },
          {
            id: 'mjr102_ca',
            name: 'Business Organization and Management',
            code: 'MJR102',
            credits: 5,
            description: 'Fundamentals of business organization and management principles',
            difficulty: 'beginner',
            topics: [
              'Business Environment',
              'Forms of Business Organization',
              'Management Functions',
              'Organizational Structure',
              'Leadership Styles',
              'Motivation Theories'
            ]
          },
          {
            id: 'mjr103_ca',
            name: 'Fundamentals of Information Technology',
            code: 'MJR103',
            credits: 5,
            description: 'Basic computer concepts and IT fundamentals',
            difficulty: 'beginner',
            topics: [
              'Computer Architecture',
              'Operating Systems',
              'Software Applications',
              'Networking Basics',
              'Internet and Web',
              'IT Security'
            ]
          }
        ]
      },
      {
        semester: 2,
        year: 1,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr201_ca',
            name: 'Financial Accounting-II',
            code: 'MJR201',
            credits: 5,
            description: 'Advanced accounting with ERP systems and digital tools',
            difficulty: 'intermediate',
            topics: [
              'Partnership Accounts',
              'Company Accounts',
              'ERP Systems',
              'Digital Accounting Tools',
              'Cloud Accounting',
              'Accounting Standards'
            ],
            prerequisites: ['mjr101_ca']
          },
          {
            id: 'mjr202_ca',
            name: 'Business Laws',
            code: 'MJR202',
            credits: 5,
            description: 'Legal framework governing business operations',
            difficulty: 'intermediate',
            topics: [
              'Contract Law',
              'Company Law',
              'Partnership Law',
              'Consumer Protection',
              'Intellectual Property',
              'Business Ethics'
            ]
          },
          {
            id: 'mjr203_ca',
            name: 'Programming with C & C++',
            code: 'MJR203',
            credits: 5,
            description: 'C and C++ programming language fundamentals',
            difficulty: 'intermediate',
            topics: [
              'C Basics',
              'Control Structures',
              'Functions',
              'Arrays and Pointers',
              'C++ Classes',
              'Object-Oriented Programming'
            ],
            prerequisites: ['mjr103_ca']
          }
        ]
      },
      {
        semester: 3,
        year: 2,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr301_ca',
            name: 'Advanced Accounting',
            code: 'MJR301',
            credits: 5,
            description: 'Advanced accounting concepts and computerized systems',
            difficulty: 'intermediate',
            topics: [
              'Consolidated Accounts',
              'Branch Accounts',
              'Departmental Accounts',
              'Computerized Systems',
              'Advanced Financial Statements',
              'Accounting Standards'
            ],
            prerequisites: ['mjr201_ca']
          },
          {
            id: 'mjr302_ca',
            name: 'Business Statistics-I',
            code: 'MJR302',
            credits: 5,
            description: 'Statistical methods and data analysis using software',
            difficulty: 'intermediate',
            topics: [
              'Descriptive Statistics',
              'Probability Distributions',
              'Sampling Methods',
              'Statistical Software',
              'Data Visualization',
              'Business Analytics'
            ]
          },
          {
            id: 'mjr303_ca',
            name: 'Relational Database Management System',
            code: 'MJR303',
            credits: 5,
            description: 'Database design, SQL programming, and database management',
            difficulty: 'intermediate',
            topics: [
              'Database Design',
              'SQL Programming',
              'Normalization',
              'Indexing',
              'Transaction Management',
              'Database Security'
            ],
            prerequisites: ['mjr203_ca']
          }
        ]
      },
      {
        semester: 4,
        year: 2,
        totalCredits: 15,
        subjects: [
          {
            id: 'mjr401_ca',
            name: 'Corporate Accounting',
            code: 'MJR401',
            credits: 5,
            description: 'Corporate accounting with computerized systems',
            difficulty: 'advanced',
            topics: [
              'Share Capital',
              'Debentures',
              'Dividends',
              'Computerized Corporate Accounting',
              'ERP Integration',
              'Corporate Financial Statements'
            ],
            prerequisites: ['mjr301_ca']
          },
          {
            id: 'mjr402_ca',
            name: 'Business Statistics-II',
            code: 'MJR402',
            credits: 5,
            description: 'Advanced statistical techniques and business intelligence',
            difficulty: 'advanced',
            topics: [
              'Time Series Analysis',
              'Index Numbers',
              'Quality Control',
              'Business Intelligence',
              'Predictive Analytics',
              'Statistical Software'
            ],
            prerequisites: ['mjr302_ca']
          },
          {
            id: 'mjr403_ca',
            name: 'Web Technologies',
            code: 'MJR403',
            credits: 5,
            description: 'Web development technologies and frameworks',
            difficulty: 'advanced',
            topics: [
              'HTML5 and CSS3',
              'JavaScript and jQuery',
              'PHP Programming',
              'Web Frameworks',
              'Web Security',
              'Responsive Design'
            ],
            prerequisites: ['mjr303_ca']
          }
        ]
      },
      {
        semester: 5,
        year: 3,
        totalCredits: 20,
        subjects: [
          {
            id: 'mjr501_ca',
            name: 'Cost Accounting',
            code: 'MJR501',
            credits: 5,
            description: 'Cost analysis with computerized systems and software',
            difficulty: 'advanced',
            topics: [
              'Cost Classification',
              'Job Costing',
              'Process Costing',
              'Cost Control Software',
              'Budgeting Systems',
              'Cost Analysis Tools'
            ],
            prerequisites: ['mjr301_ca']
          },
          {
            id: 'mjr502_ca',
            name: 'Mobile Applications',
            code: 'MJR502',
            credits: 5,
            description: 'Mobile app development for Android and iOS',
            difficulty: 'advanced',
            topics: [
              'Mobile UI/UX Design',
              'Android Development',
              'iOS Development',
              'Cross-platform Development',
              'App Store Deployment',
              'Mobile Testing'
            ],
            prerequisites: ['mjr403_ca']
          },
          {
            id: 'mdc503_ca',
            name: 'Principles of Management',
            code: 'MDC503',
            credits: 5,
            description: 'Management principles in IT environment',
            difficulty: 'intermediate',
            topics: [
              'IT Project Management',
              'Agile Methodologies',
              'Team Management',
              'Change Management',
              'Risk Management',
              'Quality Management'
            ]
          },
          {
            id: 'sec1_ca',
            name: 'Communication Skills',
            code: 'SEC1',
            credits: 2.5,
            description: 'Technical communication and presentation skills',
            difficulty: 'beginner',
            topics: [
              'Technical Writing',
              'Presentation Skills',
              'Client Communication',
              'Documentation',
              'Team Collaboration',
              'Professional Ethics'
            ]
          },
          {
            id: 'sec2_ca',
            name: 'Professional Development Skills',
            code: 'SEC2',
            credits: 2.5,
            description: 'Professional skills for IT professionals',
            difficulty: 'beginner',
            topics: [
              'Career Planning in IT',
              'Professional Networking',
              'Time Management',
              'Stress Management',
              'Personal Branding',
              'Continuous Learning'
            ]
          }
        ]
      },
      {
        semester: 6,
        year: 3,
        totalCredits: 20,
        subjects: [
          {
            id: 'mjr601_ca',
            name: 'E-commerce',
            code: 'MJR601',
            credits: 5,
            description: 'Electronic commerce and digital business models',
            difficulty: 'advanced',
            topics: [
              'E-commerce Models',
              'Online Payment Systems',
              'Digital Marketing',
              'E-commerce Security',
              'Mobile Commerce',
              'E-commerce Analytics'
            ],
            prerequisites: ['mjr403_ca']
          },
          {
            id: 'mjr602_ca',
            name: 'Data Analytics',
            code: 'MJR602',
            credits: 5,
            description: 'Data analysis, visualization, and business intelligence',
            difficulty: 'advanced',
            topics: [
              'Data Collection',
              'Data Cleaning',
              'Statistical Analysis',
              'Data Visualization',
              'Business Intelligence',
              'Predictive Analytics'
            ],
            prerequisites: ['mjr402_ca']
          },
          {
            id: 'rmp603_ca',
            name: 'Research Methodology',
            code: 'RMP603',
            credits: 5,
            description: 'Research methods and IT project work',
            difficulty: 'advanced',
            topics: [
              'Research Design',
              'Data Collection',
              'Data Analysis',
              'IT Project Management',
              'Report Writing',
              'Research Ethics'
            ]
          },
          {
            id: 'sec3_ca',
            name: 'Fundamentals of AI Tools',
            code: 'SEC3',
            credits: 2.5,
            description: 'Introduction to AI tools and machine learning',
            difficulty: 'intermediate',
            topics: [
              'AI Fundamentals',
              'Machine Learning Basics',
              'AI Tools and Platforms',
              'Business Applications',
              'Ethical AI',
              'Future of AI'
            ]
          },
          {
            id: 'sec4_ca',
            name: 'Computerized Accounting',
            code: 'SEC4',
            credits: 2.5,
            description: 'Advanced computerized accounting systems',
            difficulty: 'intermediate',
            topics: [
              'Advanced Accounting Software',
              'ERP Systems',
              'Cloud Accounting',
              'Digital Bookkeeping',
              'Automation Tools',
              'Integration'
            ]
          }
        ]
      }
    ]
  }
];

// Service functions
export const subjectMappingService = {
  // Get subjects for a specific semester and stream
  getSubjectsForSemester: (stream: string, year: number, semester: number): Subject[] => {
    const streamData = BCOM_SUBJECTS.find(s => s.stream === stream);
    if (!streamData) return [];
    
    const semesterData = streamData.semesters.find(s => s.year === year && s.semester === semester);
    return semesterData?.subjects || [];
  },

  // Get all subjects for a specific year
  getSubjectsForYear: (stream: string, year: number): Subject[] => {
    const streamData = BCOM_SUBJECTS.find(s => s.stream === stream);
    if (!streamData) return [];
    
    const yearSubjects = streamData.semesters.filter(s => s.year === year);
    return yearSubjects.flatMap(s => s.subjects);
  },

  // Get subjects for current and previous semesters (for AI Tutor context)
  getRelevantSubjects: (stream: string, year: number, semester: number): Subject[] => {
    const streamData = BCOM_SUBJECTS.find(s => s.stream === stream);
    if (!streamData) return [];
    
    // Get subjects from current and previous semesters
    const relevantSemesters = streamData.semesters.filter(s => 
      (s.year < year) || (s.year === year && s.semester <= semester)
    );
    
    return relevantSemesters.flatMap(s => s.subjects);
  },

  // Get subject by ID
  getSubjectById: (subjectId: string): Subject | undefined => {
    for (const stream of BCOM_SUBJECTS) {
      for (const semester of stream.semesters) {
        const subject = semester.subjects.find(s => s.id === subjectId);
        if (subject) return subject;
      }
    }
    return undefined;
  },

  // Get difficulty level for a subject based on prerequisites
  getSubjectDifficulty: (subject: Subject, completedSubjects: string[]): 'beginner' | 'intermediate' | 'advanced' => {
    if (!subject.prerequisites || subject.prerequisites.length === 0) {
      return subject.difficulty;
    }
    
    const hasPrerequisites = subject.prerequisites.every(prereq => 
      completedSubjects.includes(prereq)
    );
    
    if (hasPrerequisites) {
      return subject.difficulty;
    } else {
      // If prerequisites not met, increase difficulty
      switch (subject.difficulty) {
        case 'beginner': return 'intermediate';
        case 'intermediate': return 'advanced';
        case 'advanced': return 'advanced';
      }
    }
  },

  // Get study recommendations based on current semester
  getStudyRecommendations: (stream: string, year: number, semester: number): string[] => {
    const currentSubjects = getSubjectsForSemester(stream, year, semester);
    const recommendations: string[] = [];
    
    currentSubjects.forEach(subject => {
      if (subject.difficulty === 'advanced') {
        recommendations.push(`Focus on ${subject.name} - requires strong foundation in previous subjects`);
      } else if (subject.difficulty === 'intermediate') {
        recommendations.push(`Review ${subject.name} prerequisites before starting`);
      } else {
        recommendations.push(`${subject.name} is a good starting point for this semester`);
      }
    });
    
    return recommendations;
  }
};

// Helper function
function getSubjectsForSemester(stream: string, year: number, semester: number): Subject[] {
  return subjectMappingService.getSubjectsForSemester(stream, year, semester);
}
