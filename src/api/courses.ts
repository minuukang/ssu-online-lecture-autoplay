import { api } from './base';

export type Component = {
  assignment_id: number;
  attendance_status: 'attendance' | 'none';
  commons_content: {
    content_id: string;
    content_type: string;
    duration: number;
    progress_support: number;
    thumbnail_url: string;
    view_url: string;
  };
  completed: boolean;
  component_id: number;
  description: string;
  due_at: string;
  external_extra_vars: {
    canvas_content_id: number;
  };
  grade: string;
  grading_type: string;
  has_error_external_url: boolean;
  is_master_course_child_content: boolean;
  late_at: null | string;
  lock_at: string;
  muted: boolean;
  omit_from_final_grade: boolean;
  opened: boolean;
  points_possible: number;
  position: number;
  score: number;
  submission_types: string[];
  submitted: boolean;
  title: string;
  type: string;
  unlock_at: string;
  use_attendance: boolean;
  view_info: {
    view_url: string;
  };
};

export function components (props: { user_id: string; user_login: string; role: string; token: string, courseId: number; }) {
  const { user_id, user_login, role, token, courseId } = props;
  return api<Component[]>(`/courses/${courseId}/allcomponents_db?user_id=${user_id}&user_login=${user_login}&role=${role}`, token);
}