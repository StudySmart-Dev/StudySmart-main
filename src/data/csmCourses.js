/** Shown on the dashboard hub so you can confirm the deployed bundle matches this repo. */
export const UI_SEED_REVISION = 'csm-seed-v2';

/** CSM programme courses used across signup and note upload. */
export const CSM_COURSES = [
  { code: 'CSM 285', topic: 'Accounting I', label: 'ACCOUNTING I (CSM 285)' },
  { code: 'CSM 387', topic: 'Data Structures I', label: 'DATA STRUCTURES I (CSM 387)' },
  { code: 'CSM 393', topic: 'Operations Research I', label: 'OPERATIONS RESEARCH I (CSM 393)' },
  { code: 'CSM 365', topic: 'Introduction to Artificial Intelligence', label: 'INTRODUCTION TO ARTIFICIAL INTELLIGENCE (CSM 365)' },
  { code: 'CSM 357', topic: 'Human Computer Interaction', label: 'HUMAN COMPUTER INTERACTION (CSM 357)' }
];

export function topicForCourseCode(code) {
  return CSM_COURSES.find((c) => c.code === code)?.topic || '';
}
