import * as accountApi from '../api/accounts';
import * as userApi from '../api/users';
import * as coursesApi from '../api/courses';

import { Authorization } from "./auth";

export async function getUnCompletedCourseComponents (me: Authorization) {
  const terms = await accountApi.terms(me.token);
  const defaultTerm = terms.enrollment_terms.find(term => term.default) || terms.enrollment_terms[terms.enrollment_terms.length - 1];
  const { activities } = await userApi.learnActivities({
    userId: me.user_login,
    token: me.token,
    term_id: defaultTerm.id,
  });
  const onlineCourses = activities.map(({ course }) => course).filter(course => course.course_format !== 'none')
  const components = (await Promise.all(
    onlineCourses.map(async course => {
      const courseComponents = await coursesApi.components({
        ...me,
        courseId: course.id
      });
      return courseComponents.map(component => ({
        ...component,
        courseName: course.name,
      }));
    })
  )).flat();

  const now = new Date();
  const activeComponents = components.filter(component => {
    return component.use_attendance && new Date(component.unlock_at) < now && now < new Date(component.due_at);
  });
  return activeComponents.filter(component => component.attendance_status === 'none');
}