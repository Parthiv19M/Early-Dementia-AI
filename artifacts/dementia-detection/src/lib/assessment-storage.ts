import type { FullResult } from './store';

const STORAGE_KEY = 'synapta-assessments';

export interface AssessmentRecord extends FullResult {
  id: string;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizePatientId(patientId: string): string {
  return patientId.trim().toUpperCase();
}

function sortByNewest(records: AssessmentRecord[]): AssessmentRecord[] {
  return records
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getStoredAssessments(): AssessmentRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as AssessmentRecord[];
    if (!Array.isArray(parsed)) return [];

    return sortByNewest(
      parsed.filter((record) => record && typeof record.patientId === 'string' && typeof record.timestamp === 'string'),
    );
  } catch (error) {
    console.error('Failed to read saved assessments:', error);
    return [];
  }
}

function writeStoredAssessments(records: AssessmentRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortByNewest(records)));
}

export function saveAssessment(result: FullResult): AssessmentRecord {
  const record: AssessmentRecord = {
    ...result,
    patientId: normalizePatientId(result.patientId),
    id: `${normalizePatientId(result.patientId)}-${new Date(result.timestamp).getTime()}`,
  };

  const existing = getStoredAssessments().filter((item) => item.id !== record.id);
  writeStoredAssessments([record, ...existing]);
  return record;
}

export function getAssessmentsByPatientId(patientId: string): AssessmentRecord[] {
  const normalized = normalizePatientId(patientId);
  if (!normalized) return [];
  return getStoredAssessments().filter((record) => normalizePatientId(record.patientId) === normalized);
}

export function deleteAssessment(recordId: string) {
  const filtered = getStoredAssessments().filter((record) => record.id !== recordId);
  writeStoredAssessments(filtered);
}
