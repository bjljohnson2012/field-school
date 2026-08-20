import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { ensureSeeded, isFacultyUser, requireFaculty } from "@/lib/course/catalog";

type PublishedCourseRow = {
  slug: string;
  title: string;
  station_count: number;
};

type ProgressRow = {
  user_id: string;
  course_slug: string;
  module_slug: string;
  passed: boolean;
};

type ExamRow = {
  user_id: string;
  course_slug: string;
  score: number;
  passed: boolean;
  created_at: string;
};

type PersonRow = {
  id: string;
  name: string;
  email: string;
};

type MessageRow = {
  id: number;
  student_id: string;
  author_id: string;
  author_role: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

async function publishedCourses() {
  const sql = await getSql();
  await ensureSeeded(sql);
  return sql<PublishedCourseRow>`
    select c.slug, c.title,
           (select count(*)::int from course_modules m where m.course_slug = c.slug) as station_count
    from courses c
    where c.published = true
    order by c.updated_at desc
  `;
}

async function peopleByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const people = new Map<string, PersonRow>();
  if (unique.length === 0) return people;
  const sql = await getSql();
  for (const id of unique) {
    const rows = await sql<PersonRow>`
      select id, name, email from "user" where id = ${id}
    `;
    if (rows[0]) people.set(id, rows[0]);
  }
  return people;
}

function latestExamByCourse(rows: ExamRow[]) {
  const latest = new Map<string, ExamRow>();
  for (const row of rows) {
    const key = `${row.user_id}:${row.course_slug}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return latest;
}

export const getCampusNav = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const faculty = await isFacultyUser(context.userId);
    const sql = await getSql();
    const unread = faculty
      ? await sql<{ n: number }>`
          select count(*)::int as n
          from campus_messages
          where author_role = ${"student"} and read_at is null
        `
      : await sql<{ n: number }>`
          select count(*)::int as n
          from campus_messages
          where student_id = ${context.userId}
            and author_role = ${"admin"}
            and read_at is null
        `;
    return {
      faculty,
      unread: Number(unread[0]?.n ?? 0),
    };
  });

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const faculty = await isFacultyUser(context.userId);
    const courses = await publishedCourses();
    const slugSet = new Set(courses.map((course) => course.slug));
    const progress = (
      await sql<ProgressRow>`
        select user_id, course_slug, module_slug, passed
        from enrollment_progress
        where user_id = ${context.userId}
      `
    ).filter((row) => slugSet.has(row.course_slug));
    const exams = (
      await sql<ExamRow>`
        select user_id, course_slug, score, passed, created_at
        from enrollment_exams
        where user_id = ${context.userId}
        order by created_at desc
      `
    ).filter((row) => slugSet.has(row.course_slug));
    const passedByCourse = new Map<string, number>();
    for (const row of progress) {
      if (!row.passed) continue;
      passedByCourse.set(row.course_slug, (passedByCourse.get(row.course_slug) ?? 0) + 1);
    }
    const examByCourse = latestExamByCourse(exams);

    return {
      faculty,
      courses: courses.map((course) => {
        const required = Number(course.station_count) || 0;
        const completed = passedByCourse.get(course.slug) ?? 0;
        const exam = examByCourse.get(`${context.userId}:${course.slug}`);
        return {
          slug: course.slug,
          title: course.title,
          requiredStations: required,
          completedStations: completed,
          percent: required === 0 ? 0 : Math.round((completed / required) * 100),
          examPassed: Boolean(exam?.passed),
          examScore: exam?.score ?? null,
          certified: Boolean(exam?.passed && completed >= required && required > 0),
        };
      }),
    };
  });

export const getAdminProgressBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const courses = await publishedCourses();
    const slugSet = new Set(courses.map((course) => course.slug));
    const students = await sql<{
      id: string;
      name: string;
      email: string;
      createdAt: string;
    }>`
      select id, name, email, "createdAt" from "user" order by "createdAt" asc
    `;
    const progress = (
      await sql<ProgressRow>`
        select user_id, course_slug, module_slug, passed
        from enrollment_progress
      `
    ).filter((row) => slugSet.has(row.course_slug));
    const exams = (
      await sql<ExamRow>`
        select user_id, course_slug, score, passed, created_at
        from enrollment_exams
        order by created_at desc
      `
    ).filter((row) => slugSet.has(row.course_slug));
    const passedByKey = new Map<string, number>();
    for (const row of progress) {
      if (!row.passed) continue;
      const key = `${row.user_id}:${row.course_slug}`;
      passedByKey.set(key, (passedByKey.get(key) ?? 0) + 1);
    }
    const examByKey = latestExamByCourse(exams);

    return {
      courses: courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        stations: Number(course.station_count) || 0,
      })),
      students: students.map((student) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt,
        courses: courses.map((course) => {
          const key = `${student.id}:${course.slug}`;
          const exam = examByKey.get(key);
          const required = Number(course.station_count) || 0;
          const completed = passedByKey.get(key) ?? 0;
          return {
            slug: course.slug,
            completedStations: completed,
            requiredStations: required,
            examPassed: Boolean(exam?.passed),
            examScore: exam?.score ?? null,
            certified: Boolean(exam?.passed && completed >= required && required > 0),
          };
        }),
      })),
    };
  });

export const listCampusInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const faculty = await isFacultyUser(context.userId);
    const sql = await getSql();

    if (!faculty) {
      const last = await sql<MessageRow>`
        select id, student_id, author_id, author_role, body, created_at, read_at
        from campus_messages
        where student_id = ${context.userId}
        order by created_at desc
        limit 1
      `;
      const unread = await sql<{ n: number }>`
        select count(*)::int as n
        from campus_messages
        where student_id = ${context.userId}
          and author_role = ${"admin"}
          and read_at is null
      `;
      return {
        faculty: false,
        threads: [
          {
            studentId: context.userId,
            name: "Campus office",
            email: "dean",
            lastBody:
              last[0]?.body ??
              "Ask the dean a question about a station, quiz, or certificate.",
            lastAt: last[0]?.created_at ?? new Date().toISOString(),
            unread: Number(unread[0]?.n ?? 0),
          },
        ],
      };
    }

    const latest = await sql<{
      student_id: string;
      body: string;
      created_at: string;
    }>`
      select m.student_id, m.body, m.created_at
      from campus_messages m
      inner join (
        select student_id, max(created_at) as last_at
        from campus_messages
        group by student_id
      ) t on t.student_id = m.student_id and t.last_at = m.created_at
      order by m.created_at desc
    `;
    const unreadRows = await sql<{ student_id: string; n: number }>`
      select student_id, count(*)::int as n
      from campus_messages
      where author_role = ${"student"} and read_at is null
      group by student_id
    `;
    const unreadByStudent = new Map(unreadRows.map((row) => [row.student_id, Number(row.n)]));
    const people = await peopleByIds(latest.map((row) => row.student_id));

    return {
      faculty: true,
      threads: latest.map((row) => {
        const person = people.get(row.student_id);
        return {
          studentId: row.student_id,
          name: person?.name ?? "Student",
          email: person?.email ?? "",
          lastBody: row.body,
          lastAt: row.created_at,
          unread: unreadByStudent.get(row.student_id) ?? 0,
        };
      }),
    };
  });

export const listCampusStudents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    // Every signed-in account (except the dean themselves) so the office can
    // start a thread with anyone, not only students who messaged first.
    const students = await sql<{
      id: string;
      name: string;
      email: string;
      created_at: string;
    }>`
      select id, name, email, "createdAt" as created_at
      from "user"
      where id <> ${context.userId}
      order by "createdAt" asc
    `;
    const latest = await sql<{
      student_id: string;
      body: string;
      created_at: string;
    }>`
      select m.student_id, m.body, m.created_at
      from campus_messages m
      inner join (
        select student_id, max(created_at) as last_at
        from campus_messages
        group by student_id
      ) t on t.student_id = m.student_id and t.last_at = m.created_at
    `;
    const lastByStudent = new Map(
      latest.map((row) => [row.student_id, { body: row.body, at: row.created_at }]),
    );
    const unreadRows = await sql<{ student_id: string; n: number }>`
      select student_id, count(*)::int as n
      from campus_messages
      where author_role = ${"student"} and read_at is null
      group by student_id
    `;
    const unreadByStudent = new Map(
      unreadRows.map((row) => [row.student_id, Number(row.n)]),
    );
    return students.map((student) => {
      const last = lastByStudent.get(student.id);
      return {
        studentId: student.id,
        name: student.name || "Student",
        email: student.email || "",
        lastBody: last?.body ?? "",
        lastAt: last?.at ?? null,
        hasThread: Boolean(last),
        unread: unreadByStudent.get(student.id) ?? 0,
      };
    });
  });

const TEST_STUDENTS = [
  { id: "test-student-ada", name: "Ada Lovelace", email: "ada@campus.test" },
  { id: "test-student-alan", name: "Alan Turing", email: "alan@campus.test" },
  { id: "test-student-grace", name: "Grace Hopper", email: "grace@campus.test" },
  { id: "test-student-katherine", name: "Katherine Johnson", email: "katherine@campus.test" },
  { id: "test-student-linus", name: "Linus Torvalds", email: "linus@campus.test" },
];

const TEST_INTROS: Record<string, string> = {
  "test-student-ada":
    "Hi! I'm stuck on the exam — is a retake allowed if I miss by one question?",
  "test-student-grace":
    "The clip timestamps on station 2 don't match my video. Can you check?",
};

export const seedTestStudents = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    await ensureSeeded(sql);

    let created = 0;
    for (const s of TEST_STUDENTS) {
      const inserted = await sql<{ id: string }>`
        insert into "user" (id, name, email, "emailVerified")
        values (${s.id}, ${s.name}, ${s.email}, ${true})
        on conflict (id) do nothing
        returning id
      `;
      if (inserted[0]) created += 1;
    }

    // A couple of inbound questions so the inbox has real threads to open.
    for (const [studentId, body] of Object.entries(TEST_INTROS)) {
      const existing = await sql<{ id: number }>`
        select id from campus_messages where student_id = ${studentId} limit 1
      `;
      if (!existing[0]) {
        await sql`
          insert into campus_messages (student_id, author_id, author_role, body)
          values (${studentId}, ${studentId}, ${"student"}, ${body})
        `;
      }
    }

    // Give the first few test students some visible progress on the first
    // published course so the progress board isn't all zeros.
    const firstCourse = (
      await sql<{ slug: string }>`
        select slug from courses where published = true order by updated_at asc limit 1
      `
    )[0];
    if (firstCourse) {
      const mods = await sql<{ slug: string }>`
        select slug from course_modules where course_slug = ${firstCourse.slug}
        order by sort_order asc limit 2
      `;
      for (const studentId of [
        "test-student-ada",
        "test-student-alan",
        "test-student-grace",
      ]) {
        for (const m of mods) {
          await sql`
            insert into enrollment_progress
              (user_id, course_slug, module_slug, watched, quiz_passed, passed)
            values (${studentId}, ${firstCourse.slug}, ${m.slug}, ${true}, ${true}, ${true})
            on conflict (user_id, course_slug, module_slug) do nothing
          `;
        }
      }
    }

    return { ok: true as const, created, total: TEST_STUDENTS.length };
  });

export const listCampusThread = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { studentId?: string }) => d)
  .handler(async ({ context, data }) => {
    const faculty = await isFacultyUser(context.userId);
    const studentId = faculty ? data.studentId || context.userId : context.userId;
    if (faculty && data.studentId) {
      await requireFaculty(context.userId);
    }

    const sql = await getSql();
    const messages = await sql<MessageRow>`
      select id, student_id, author_id, author_role, body, created_at, read_at
      from campus_messages
      where student_id = ${studentId}
      order by created_at asc
    `;

    if (faculty) {
      await sql`
        update campus_messages
        set read_at = now()
        where student_id = ${studentId}
          and author_role = ${"student"}
          and read_at is null
      `;
    } else {
      await sql`
        update campus_messages
        set read_at = now()
        where student_id = ${context.userId}
          and author_role = ${"admin"}
          and read_at is null
      `;
    }

    const people = await peopleByIds([
      studentId,
      ...messages.map((row) => row.author_id),
    ]);
    const student = people.get(studentId);

    return {
      faculty,
      studentId,
      student: {
        id: studentId,
        name: student?.name ?? "Student",
        email: student?.email ?? "",
      },
      messages: messages.map((row) => ({
        id: row.id,
        body: row.body,
        authorRole: row.author_role,
        authorName:
          people.get(row.author_id)?.name ??
          (row.author_role === "admin" ? "Dean" : "Student"),
        createdAt: row.created_at,
        mine: row.author_id === context.userId,
      })),
    };
  });

export const sendCampusMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { body: string; studentId?: string }) => d)
  .handler(async ({ context, data }) => {
    const faculty = await isFacultyUser(context.userId);
    const body = data.body.trim().slice(0, 4000);
    if (!body) {
      throw new Error("Write a short message first.");
    }
    const studentId = faculty ? data.studentId : context.userId;
    if (!studentId) {
      throw new Error("Choose a student thread first.");
    }
    if (faculty) {
      await requireFaculty(context.userId);
    }

    const sql = await getSql();
    const rows = await sql<MessageRow>`
      insert into campus_messages (student_id, author_id, author_role, body)
      values (${studentId}, ${context.userId}, ${faculty ? "admin" : "student"}, ${body})
      returning id, student_id, author_id, author_role, body, created_at, read_at
    `;
    const row = rows[0];
    return {
      id: row.id,
      body: row.body,
      authorRole: row.author_role,
      createdAt: row.created_at,
    };
  });
