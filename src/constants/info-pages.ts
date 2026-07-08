export type InfoPageSection = {
  heading: string;
  body: string;
};

export type InfoPage = {
  title: string;
  eyebrow: string;
  subtitle: string;
  icon: 'shield-checkmark-outline' | 'document-text-outline' | 'information-circle-outline' | 'code-slash-outline';
  sections: InfoPageSection[];
};

export const infoPages = {
  privacyPolicy: {
    title: 'Privacy Policy',
    eyebrow: 'Legal',
    subtitle: 'How this LMS handles account, academic, and profile information.',
    icon: 'shield-checkmark-outline',
    sections: [
      {
        heading: 'Information We Use',
        body: 'The app uses profile, class, attendance, marks, assignment, test, announcement, and notification information required to provide the LMS experience.',
      },
      {
        heading: 'Why It Is Used',
        body: 'Information is used to show your dashboard, manage academic records, submit assignments, host tests, display notifications, and keep school workflows organized.',
      },
      {
        heading: 'Account Security',
        body: 'Password changes and profile update requests are handled through authenticated app flows. Do not share your login credentials with anyone.',
      },
      {
        heading: 'Files And Uploads',
        body: 'Profile photos and assignment files may be uploaded through the app. Only upload files that are relevant to your academic activity.',
      },
      {
        heading: 'Institution Control',
        body: 'Your institution manages official academic records. Contact your school administration for corrections, deletion requests, or data access questions.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    eyebrow: 'Legal',
    subtitle: 'Basic rules for using the LMS responsibly.',
    icon: 'document-text-outline',
    sections: [
      {
        heading: 'Use Of The App',
        body: 'Use this app only for authorized academic and institution-related activity. Keep your account information accurate and up to date.',
      },
      {
        heading: 'Student Responsibilities',
        body: 'Students are responsible for checking announcements, submitting assignments on time, attending classes, and following test rules.',
      },
      {
        heading: 'Staff Responsibilities',
        body: 'Staff users are responsible for entering accurate attendance, marks, assignments, and hosted test information.',
      },
      {
        heading: 'Online Tests',
        body: 'Online tests may include timer and anti-cheat behavior. Switching apps or leaving the test screen may affect test status according to institution rules.',
      },
      {
        heading: 'Misuse',
        body: 'Do not attempt to access data that does not belong to you, bypass app restrictions, submit false information, or disrupt institution workflows.',
      },
    ],
  },
  aboutApp: {
    title: 'About App',
    eyebrow: 'Taleem360',
    subtitle: 'A mobile LMS portal for students and staff.',
    icon: 'information-circle-outline',
    sections: [
      {
        heading: 'Purpose',
        body: 'This app helps students and staff manage daily academic workflows from one place.',
      },
      {
        heading: 'For Students',
        body: 'Students can view attendance, marks, exams, announcements, assignments, submissions, hosted tests, notifications, and profile information.',
      },
      {
        heading: 'For Staff',
        body: 'Staff can view daily classes, mark attendance, create assignments, enter marks, host tests, review submissions, and manage profile requests.',
      },
      {
        heading: 'Design Direction',
        body: 'The interface is designed to feel professional, compact, and institution-focused, with clear navigation and readable academic information.',
      },
      {
        heading: 'Version',
        body: 'Current app version: 1.0.0.',
      },
    ],
  },
  aboutDeveloper: {
    title: 'About Developer',
    eyebrow: 'Credits',
    subtitle: 'Developed by Apps by Hussnain.',
    icon: 'code-slash-outline',
    sections: [
      {
        heading: 'Developer',
        body: 'Taleem360 is developed and maintained by Apps by Hussnain with a focus on professional, reliable, and institution-ready digital products.',
      },
      {
        heading: 'Private Property',
        body: 'Taleem360 is private property. Institutions may use the platform only after an official agreement, approval, or permission from the project owner.',
      },
      {
        heading: 'Professional Use',
        body: 'The system is designed for legitimate academic and administrative workflows. Unauthorized copying, resale, modification, or commercial use is not permitted.',
      },
      {
        heading: 'Contact',
        body: 'Email: Workwithhussnainahmad@gmail.com\nWebsite: appsbyhussnain.vercel.app',
      },
    ],
  },
} satisfies Record<string, InfoPage>;
