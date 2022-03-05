import { api } from './base';

type Activitie = {
  course: {
    course_format: 'online' | 'offline' | 'none';
    id: number;
    name: string;
    professors: string;
    total_students: number;
  }
};

export function learnActivities ({ userId, token, term_id }: { userId: string, token: string, term_id: number }) {
  return api<{ total_count: number; activities: Activitie[] }>(`/users/${userId}/learn_activities?term_ids=${term_id}`, token);
}