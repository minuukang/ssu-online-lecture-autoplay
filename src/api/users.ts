import { api } from "./base";

type Course = {
  course_format: "online" | "offline" | "none";
  id: number;
  name: string;
  professors: string;
  total_students: number;
};

export function learnActivities({
  token,
  term_id,
}: {
  token: string;
  term_id: number;
}) {
  return api<Course[]>(
    `/learn_activities/courses?term_ids[]=${term_id}`,
    token
  );
}
