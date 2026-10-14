import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BASE_URL } from '@/utils/api';

export type StudentIdentity = {
  student: {
    name: string;
    fatherName: string | null;
    phone: string | null;
    emergencyContact: string | null;
    profilePictureUrl: string | null;
    loginRollNumber: string;
    classRollNumber: string;
    className: string;
    sectionName: string;
    verificationQr?: string;
  };
  institution: { name: string; logoKey: string | null; signatureKey: string | null };
};
export type Transcript = {
  examTitle: string;
  examType: string;
  examCreatedAt: string;
  results: { subjectName: string; maxMarks: number; marksObtained: number }[];
};
export const documentImageUrl = (value: string | null) =>
  !value
    ? null
    : /^(https?:\/\/|data:image\/)/i.test(value)
      ? value
      : `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
export const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
async function imageTag(value: string | null, width: number, height: number) {
  const url = documentImageUrl(value);
  if (!url) return '';
  let data = url;
  if (!url.startsWith('data:image/')) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not load document images. Please retry.');
    const blob = await response.blob();
    data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Could not prepare document image.'));
      reader.readAsDataURL(blob);
    });
  }
  return `<img alt="" src="${escapeHtml(data)}" style="width:${width}px;height:${height}px;object-fit:contain" />`;
}
export async function studentDocumentHtml(identity: StudentIdentity, transcript?: Transcript) {
  const { student: s, institution: i } = identity;
  const [logo, photo, signature, qr] = await Promise.all([
    imageTag(i.logoKey, 64, 64),
    imageTag(s.profilePictureUrl, 80, 100),
    imageTag(i.signatureKey, 160, 60),
    transcript ? '' : imageTag(s.verificationQr || null, 130, 130),
  ]);
  const identityBlock = `<h2>${escapeHtml(s.name)}</h2><p>Father / guardian: ${escapeHtml(s.fatherName || '—')}</p><p>Class: ${escapeHtml(s.className)} · Section: ${escapeHtml(s.sectionName)} · Roll: ${escapeHtml(s.classRollNumber)}</p><p>Student ID: ${escapeHtml(s.loginRollNumber)}</p>`;
  let body;
  if (transcript) {
    const maximum = transcript.results.reduce((sum, row) => sum + Number(row.maxMarks), 0),
      obtained = transcript.results.reduce((sum, row) => sum + Number(row.marksObtained), 0);
    body = `<h2>Official Transcript — ${escapeHtml(transcript.examTitle)}</h2><p>${escapeHtml(transcript.examType)} · Issued ${escapeHtml(new Date(transcript.examCreatedAt).toLocaleDateString())}</p>${identityBlock}<table><thead><tr><th>Subject</th><th>Max marks</th><th>Obtained</th><th>Percentage</th></tr></thead><tbody>${transcript.results.map((row) => `<tr><td>${escapeHtml(row.subjectName)}</td><td>${row.maxMarks}</td><td>${row.marksObtained}</td><td>${row.maxMarks > 0 ? ((row.marksObtained / row.maxMarks) * 100).toFixed(1) : '0.0'}%</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th>${maximum}</th><th>${obtained}</th><th>${maximum > 0 ? ((obtained / maximum) * 100).toFixed(1) : '0.0'}%</th></tr></tfoot></table><p>Grading reference: A+ 90–100% · A 80–89% · B 70–79% · C 60–69% · D 50–59% · F below 50%</p>${signature}<p>Principal / Head (Electronic Signature)</p>`;
  } else
    body = `<section><h2>Student ID — Front</h2>${photo}${identityBlock}${signature}<p>Principal / Head</p></section><section><h2>Student ID — Back</h2><p>Student contact: ${escapeHtml(s.phone || 'Not provided')}</p><p>Emergency contact: ${escapeHtml(s.emergencyContact || 'Not provided')}</p>${qr}<p>Scan to verify student identity</p></section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(transcript?.examTitle || 'Student ID')}</title><style>@page{margin:20mm}body{font:14px Arial;color:#17233a}header{display:flex;align-items:center;gap:20px;border-bottom:2px solid #17233a}table{width:100%;border-collapse:collapse;margin:25px 0}th,td{padding:12px;border-bottom:1px solid #ccc;text-align:left}section{border:1px solid #ccc;padding:20px;margin-top:20px;break-inside:avoid}img{object-fit:contain}h2{font-size:20px}</style></head><body><header>${logo}<h1>${escapeHtml(i.name)}</h1></header>${body}</body></html>`;
}
export async function exportStudentDocument(
  identity: StudentIdentity,
  transcript: Transcript | undefined,
  share: boolean,
) {
  const html = await studentDocumentHtml(identity, transcript);
  if (Platform.OS === 'web') {
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => frame.remove(), 60000);
    };
    frame.srcdoc = html;
  } else if (share) {
    if (!(await Sharing.isAvailableAsync())) throw new Error('PDF sharing is unavailable on this device.');
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
  } else await Print.printAsync({ html });
}
