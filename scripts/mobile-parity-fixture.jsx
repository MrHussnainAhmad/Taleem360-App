import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useReducedMotion } from '../src/hooks/use-reduced-motion';
import StudentTests from '../src/app/(student)/tests';
import Submissions from '../src/app/(student)/submissions';
import Fees from '../src/app/(student)/vouchers';
import ParentFees from '../src/app/(parent)/fees';
import HostedTests from '../src/app/(staff)/host-tests';
import Assignments from '../src/app/(staff)/assignments';
import MarkEntry from '../src/app/(staff)/mark-entry/[id]';
import StudentAnnouncements from '../src/app/(student)/announcements';
import TeacherAnnouncements from '../src/app/(staff)/announcements';
import Results from '../src/app/(parent)/results';
import Account from '../src/app/(parent)/account';
import Diary from '../src/app/(parent)/diary';
import IdCard from '../src/app/(student)/id-card';
import Transcript from '../src/app/(student)/transcript/[id]';
import { CourseStreamingSettings } from '../src/components/staff/CourseStreamingSettings';
import { PromotionResult } from '../src/components/student/PromotionResult';
import StaffCourses from '../src/app/(staff)/courses';
import { FixtureParentProvider } from '@/context/ParentPortalContext';
import { studentDocumentHtml } from '../src/utils/student-documents';
window.requests = [];
window.printRequests = [];
window.notifications = [];
const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const identity = {
  institution: { name: 'Fixture School', logoKey: png, signatureKey: png },
  student: {
    name: 'Student One',
    fatherName: 'Guardian One',
    phone: '03000000001',
    emergencyContact: '03000000002',
    profilePictureUrl: png,
    loginRollNumber: 'student@example.test',
    classRollNumber: '1',
    className: 'Class 1',
    sectionName: 'A',
    verificationQr: png,
  },
};
const transcript = {
  examTitle: 'Annual Exam',
  examType: 'FINAL',
  examCreatedAt: '2026-10-01',
  results: [{ subjectName: 'Math', maxMarks: 100, marksObtained: 90 }],
};
window.documentHtml = async () => studentDocumentHtml(identity, transcript);
let published = false,
  submitted = false,
  configured = false,
  sent = [];
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
  if (url.protocol === 'data:' || url.protocol === 'blob:') return nativeFetch(input, options);
  const method = options.method || 'GET',
    form = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : null;
  const body = form || (typeof options.body === 'string' ? JSON.parse(options.body) : null);
  window.requests.push({
    path: url.pathname,
    query: url.search,
    method,
    body,
    headers: Object.fromEntries(new Headers(options.headers).entries()),
  });
  const ok = (data) => {
    if (window.largeLists && ['/api/student/tests', '/api/student/submissions', '/api/staff/assignments', '/api/staff/host-tests'].includes(url.pathname)) {
      const key = data.tests ? 'tests' : data.assignments ? 'assignments' : null;
      if (key && data[key].length) {
        const first = data[key][0];
        data[key] = Array.from({ length: 300 }, (_, index) => ({ ...first, id: index + 1,
          title: 'Performance row ' + (index + 1),
          ...(first.onlineTest ? { onlineTest: { ...first.onlineTest, id: index + 1 }, test: { ...first.test, title: 'Performance row ' + (index + 1) } } : {}),
        }));
        data.nextCursor = null;
        if (data.page) data.page.nextCursor = null;
      }
    }
    return Response.json(data);
  };
  const path = url.pathname,
    p = url.searchParams;
  if (url.hostname === 'api.cloudinary.com') {
    if (form.overwrite !== 'false')
      return Response.json({ error: { message: 'Signature mismatch' } }, { status: 400 });
    return ok({ public_id: 'student-fees/1/1/1/proof', format: 'png', resource_type: 'image' });
  }
  if (method !== 'GET') {
    if (path === '/api/staff/courses/uploads') return ok({ uploadId: 'saved-upload', uploadUrl: 'https://upload.fixture.test', uploadMethod: 'TUS', headers: {} });
    if (path === '/api/student/fees') {
      if (body.action === 'signature')
        return ok({
          cloudName: 'fixture',
          apiKey: 'key',
          timestamp: 123,
          signature: 'sig',
          folder: 'student-fees/1/1/1',
          allowedFormats: 'png,pdf',
          type: 'authenticated',
          overwrite: false,
        });
      if (!body.paymentAccountId)
        return Response.json({ error: 'Missing destination account' }, { status: 400 });
      submitted = true;
      return ok({ success: true });
    }
    if (path === '/api/staff/marks/tools') {
      if (body.action === 'publish') published = true;
      return ok({ success: true });
    }
    if (path === '/api/course-streaming') {
      configured = method !== 'DELETE';
      return ok({ success: true });
    }
    if (path === '/api/staff/announcements') {
      sent = [{ id: 1, ...body, createdAt: new Date().toISOString() }];
      return ok({ success: true });
    }
    return ok({ success: true });
  }
  if (path === '/api/student/tests')
    return ok({
      tests: [
        {
          onlineTest: {
            id: p.has('cursor') ? 2 : 1,
            mode: 'MIX',
            durationMinutes: 20,
            createdAt: '2026-10-01',
          },
          test: { title: p.has('cursor') ? 'Older test' : 'Current test', maxMarks: 10 },
          subjectName: 'Math',
          className: 'Class 1',
          isActive: true,
        },
      ],
      nextCursor: p.has('cursor') ? null : 'older',
    });
  if (path === '/api/student/submissions')
    return ok({
      assignments: [
        {
          id: p.has('cursor') ? 2 : 1,
          title: p.has('cursor') ? 'Older assignment' : 'Current assignment',
          description: 'Homework',
          dueAt: '2026-10-20',
          subjectName: 'Math',
          referenceFileUrl: null,
          submission: null,
        },
      ],
      nextCursor: p.has('cursor') ? null : 'older',
    });
  if (path === '/api/student/fees') {
    if (p.has('invoiceId'))
      return ok({
        items: [
          {
            id: Number(p.get('page')) || 1,
            label: p.get('page') === '2' ? 'Second fee item' : 'Tuition',
            type: 'CHARGE',
            amount: 1000,
          },
        ],
        payments: [
          {
            id: Number(p.get('page')) || 1,
            receiptNumber: p.get('page') === '2' ? 'RECEIPT-2' : 'RECEIPT-1',
            amount: 200,
            method: 'BANK',
            receivedAt: '2026-10-01',
          },
        ],
        page: Number(p.get('page')) || 1,
        hasMore: p.get('page') !== '2',
      });
    return ok({
      invoices: [
        {
          id: 1,
          billingKind: 'ONE_TIME',
          billingLabel: p.get('activePage') === '2' ? 'Older challan' : 'Admission charge',
          billingMonth: '2026-10',
          dueDate: '2026-10-20',
          status: 'PARTIAL',
          totalAmount: 1000,
          paidAmount: 200,
        },
      ],
      paymentAccounts: [
        {
          id: 'bank1',
          providerName: 'School Bank',
          accountTitle: 'School',
          accountNumber: '111',
          qrUrl: png,
        },
        {
          id: 'bank2',
          providerName: 'Second Bank',
          accountTitle: 'School',
          accountNumber: '222',
          qrUrl: null,
        },
      ],
      submissions: [
        { invoiceId: 1, status: submitted ? 'SUBMITTED' : 'REJECTED', reviewerNote: 'Unclear receipt' },
      ],
      summary: { billed: 25000, paid: 2000, balance: 23000 },
      activePagination: { page: Number(p.get('activePage')) || 1, pages: 2, total: 21 },
      paidPagination: { page: 1, pages: 1, total: 0 },
    });
  }
  if (path === '/api/staff/host-tests')
    return ok({
      tests: [
        {
          id: p.has('cursor') ? 2 : 1,
          onlineTestId: p.has('cursor') ? 20 : 10,
          title: p.has('cursor') ? 'Older hosted test' : 'Hosted quiz',
          type: 'QUIZ',
          maxMarks: 10,
          date: '2026-10-01',
          className: 'Class 1',
          sectionName: 'A',
          subjectName: 'Math',
          durationMinutes: 20,
          mode: 'MIX',
          submissionCount: 1,
          pendingReviewCount: 1,
        },
      ],
      nextCursor: p.has('cursor') ? null : 'older',
      assignedSlots: [{ id: 1, name: 'A', className: 'Class 1' }],
      subjectOptions: [{ id: 1, name: 'Math', sectionId: 1 }],
    });
  if (path.endsWith('/details'))
    return ok({
      questions: [{ id: 1, questionType: 'SHORT', prompt: 'Explain fractions', marks: 5, orderIndex: 0 }],
      submissions: [
        { id: 100, studentName: 'Student One', rollNumber: '1', status: 'PENDING_REVIEW', totalScore: 3 },
      ],
      hostedTest: { onlineTestId: 10, testId: 1, mode: 'MIX', maxMarks: 10 },
    });
  if (path === '/api/staff/host-tests/10/submissions/100')
    return ok({ id: 100, answers: { 1: 'A fraction is part of a whole.' } });
  if (path === '/api/staff/assignments') {
    if (p.get('view') === 'metadata')
      return ok({
        sectionOptions: [{ id: 1, name: 'A', className: 'Class 1' }],
        subjectOptions: [{ id: 1, name: 'Math', sectionId: 1 }],
      });
    return ok({
      assignments: [
        {
          id: p.has('cursor') ? 2 : 1,
          title: p.has('cursor') ? 'Older class assignment' : 'Current class assignment',
          description: 'Read chapter',
          dueAt: '2026-10-20',
          subjectName: 'Math',
          className: 'Class 1',
          sectionName: 'A',
          submittedStudents: [],
          pendingStudents: [],
        },
      ],
      page: { limit: 50, nextCursor: p.has('cursor') ? null : 'older' },
    });
  }
  if (path === '/api/staff/marks')
    return ok({
      tests: [
        {
          id: 1,
          title: 'Manual quiz',
          type: 'QUIZ',
          maxMarks: 10,
          date: '2026-10-10',
          className: 'Class 1',
          sectionName: 'A',
          subjectName: 'Math',
          createdByRole: 'STAFF',
          resultsPublishedAt: published ? '2026-10-14' : null,
        },
      ],
      rosters: { 1: [{ id: 1, name: 'Student One', rollNumber: '1' }] },
      marks: { '1:1': 8 },
    });
  if (path === '/api/staff/marks/template')
    return new Response('Roll Number,Student Name,Marks Obtained,Total Marks\n1,Student One,,10', {
      headers: { 'Content-Type': 'text/csv' },
    });
  if (path === '/api/staff/announcements')
    return ok({
      sections: [{ id: 1, name: 'A', classId: 1, className: 'Class 1' }],
      sent,
      hasMore: p.get('page') !== '2',
      page: Number(p.get('page')) || 1,
    });
  if (path === '/api/staff/courses') return ok({ courses: [{ id: 1, title: 'Video course', lectureCount: 3, subjectName: 'Math' }], pagination: { page: 1, pageSize: 10, total: 1, pages: 1 } });
  if (path === '/api/staff/courses/1') return ok({ course: { id: 1, title: 'Video course', lectureCount: 3, subjectName: 'Math' }, lectures: [] });
  if (path === '/api/staff/courses/uploads') return ok(window.processingReady ? { status: 'READY', videoUrl: 'https://video.fixture.test/ready.m3u8' } : { status: 'PROCESSING' });
  if (path === '/api/announcements/notifications')
    return ok({
      announcements: [
        {
          id: Number(p.get('page')) || 1,
          title: p.get('page') === '2' ? 'Older notice' : 'Current notice',
          content: 'Notice content',
          senderRole: 'INSTITUTION',
          createdAtIso: '2026-10-01',
        },
      ],
      pagination: { page: Number(p.get('page')) || 1, pages: 2, total: 11 },
    });
  if (path === '/api/course-streaming')
    return ok({
      provider: configured ? 'MUX' : null,
      configured,
      institutionOverride: { provider: 'BUNNY', configured: true },
    });
  if (path === '/api/student/id-card') return ok(identity);
  if (path === '/api/student/transcripts/1') return ok({ ...transcript, identity });
  if (path === '/api/student/promotion-result') return ok({ promotion: { id: 987, status: 'PROMOTED' } });
  if (path === '/api/parent/portal') {
    if (p.get('section') === 'results')
      return ok({
        performance: [{ subject: 'Math', average: 75, highest: 95, assessments: 25 }],
        results: [
          {
            id: Number(p.get('page')),
            title: p.get('page') === '2' ? 'Earlier result' : 'Current result',
            type: p.get('type') === 'ALL' ? 'QUIZ' : p.get('type'),
            date: '2026-10-10',
            subject: 'Math',
            obtained: 8,
            total: 10,
          },
        ],
        pagination: { page: Number(p.get('page')) || 1, pages: 2, total: 25 },
      });
    if (p.get('section') === 'account')
      return ok({
        parent: { name: 'Guardian', email: 'parent@example.test' },
        selectedStudent: { name: 'Student One', className: 'Class 1', sectionName: 'A', campusName: 'Main' },
        profile: {
          fatherName: 'Guardian One',
          loginId: 'student@example.test',
          classRoll: '1',
          gender: 'FEMALE',
          age: 12,
          year: 2020,
          phone: '03001234567',
          guardianEmail: 'guardian@example.test',
          whatsapp: '03001234568',
          emergency: '03001234569',
          status: 'ACTIVE',
        },
      });
    if (p.get('section') === 'diary')
      return ok({
        homework: [
          {
            id: 1,
            title: 'Homework',
            fileName: 'chapter.pdf',
            description: 'Read it',
            dueAt: '2026-10-20',
            subject: 'Math',
            teacher: 'Teacher',
          },
        ],
        diary: [],
      });
  }
  throw Error('Missing API fixture: ' + path + url.search);
};
const screens = {
  tests: StudentTests,
  submissions: Submissions,
  fees: Fees,
  parentFees: ParentFees,
  hosted: HostedTests,
  assignments: Assignments,
  marks: MarkEntry,
  studentAnnouncements: StudentAnnouncements,
  teacherAnnouncements: TeacherAnnouncements,
  results: Results,
  account: Account,
  diary: Diary,
  idCard: IdCard,
  transcript: Transcript,
  streaming: CourseStreamingSettings,
  promotion: PromotionResult,
  staffCourses: StaffCourses,
};
function App() {
  window.motionReduced = useReducedMotion();
  const [screen, setScreen] = useState('tests');
  window.showScreen = setScreen;
  const Component = screens[screen];
  return (
    <FixtureParentProvider>
      <Component key={screen} />
    </FixtureParentProvider>
  );
}
createRoot(document.getElementById('root')).render(<App />);
