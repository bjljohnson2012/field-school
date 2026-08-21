import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { ensureSeeded, isFacultyUser, requireFaculty } from "./catalog";
import { slugify } from "./youtube";

const SETTING_KEYS = ["founder_name", "signature_text", "signature_image"];

type Signature = {
  founderName: string;
  signatureText: string;
  signatureImage: string;
};

async function readSignature(sql: Sql): Promise<Signature> {
  const rows = await sql<{ key: string; value: string }>`
    select key, value from site_settings where key = any(${SETTING_KEYS})
  `;
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    founderName: map.get("founder_name") ?? "",
    signatureText: map.get("signature_text") ?? "",
    signatureImage: map.get("signature_image") ?? "",
  };
}

async function publishedCourseStations(sql: Sql) {
  await ensureSeeded(sql);
  return sql<{ slug: string; title: string; station_count: number }>`
    select c.slug, c.title,
           (select count(*)::int from course_modules m where m.course_slug = c.slug) as station_count
    from courses c where c.published = true
  `;
}

/** Set of course slugs the given user has fully certified. */
async function certifiedCourseSlugs(sql: Sql, userId: string): Promise<Set<string>> {
  const courses = await publishedCourseStations(sql);
  const required = new Map(courses.map((c) => [c.slug, Number(c.station_count) || 0]));
  const slugSet = new Set(courses.map((c) => c.slug));

  const progress = (
    await sql<{ course_slug: string; passed: boolean }>`
      select course_slug, passed from enrollment_progress where user_id = ${userId}
    `
  ).filter((r) => slugSet.has(r.course_slug));
  const passedByCourse = new Map<string, number>();
  for (const r of progress) {
    if (r.passed) passedByCourse.set(r.course_slug, (passedByCourse.get(r.course_slug) ?? 0) + 1);
  }
  const exams = (
    await sql<{ course_slug: string; passed: boolean; created_at: string }>`
      select course_slug, passed, created_at from enrollment_exams
      where user_id = ${userId} order by created_at desc
    `
  ).filter((r) => slugSet.has(r.course_slug));
  const examPassed = new Set<string>();
  const seen = new Set<string>();
  for (const r of exams) {
    if (seen.has(r.course_slug)) continue; // latest first
    seen.add(r.course_slug);
    if (r.passed) examPassed.add(r.course_slug);
  }

  const certified = new Set<string>();
  for (const slug of slugSet) {
    const req = required.get(slug) ?? 0;
    if (req > 0 && (passedByCourse.get(slug) ?? 0) >= req && examPassed.has(slug)) {
      certified.add(slug);
    }
  }
  return certified;
}

async function memberCourses(sql: Sql, certSlug: string) {
  return sql<{ course_slug: string; sort_order: number; title: string; published: boolean }>`
    select cc.course_slug, cc.sort_order, c.title, c.published
    from certification_courses cc
    left join courses c on c.slug = cc.course_slug
    where cc.certification_slug = ${certSlug}
    order by cc.sort_order asc
  `;
}

// ---- Public reads -------------------------------------------------------

export const getPublicSignature = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    return readSignature(sql);
  },
);

export const listPublishedCertifications = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const rows = await sql<{
      slug: string;
      title: string;
      description: string;
      updated_at: string;
      course_count: number;
    }>`
      select t.slug, t.title, t.description, t.updated_at,
             (select count(*)::int from certification_courses cc where cc.certification_slug = t.slug) as course_count
      from certifications t
      where t.published = true
      order by t.updated_at desc
    `;
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      description: r.description,
      courseCount: Number(r.course_count) || 0,
      updatedAt: r.updated_at,
    }));
  },
);

export const getPublishedCertification = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{
      slug: string;
      title: string;
      description: string;
      published: boolean;
    }>`
      select slug, title, description, published from certifications where slug = ${data.slug}
    `;
    const row = rows[0];
    if (!row || !row.published) return null;
    const courses = await memberCourses(sql, data.slug);
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      courses: courses
        .filter((c) => c.published)
        .map((c) => ({ slug: c.course_slug, title: c.title ?? c.course_slug })),
    };
  });

// ---- Student progress ---------------------------------------------------

export const getMyCertifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const certs = await sql<{ slug: string; title: string; description: string }>`
      select slug, title, description from certifications where published = true order by updated_at desc
    `;
    if (certs.length === 0) return [];
    const certified = await certifiedCourseSlugs(sql, context.userId);
    const result = [];
    for (const cert of certs) {
      const courses = (await memberCourses(sql, cert.slug)).filter((c) => c.published);
      const done = courses.filter((c) => certified.has(c.course_slug)).length;
      result.push({
        slug: cert.slug,
        title: cert.title,
        description: cert.description,
        totalCourses: courses.length,
        completedCourses: done,
        complete: courses.length > 0 && done === courses.length,
      });
    }
    return result;
  });

export const getTrackAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const certRows = await sql<{ slug: string; title: string; published: boolean }>`
      select slug, title, published from certifications where slug = ${data.slug}
    `;
    const cert = certRows[0];
    if (!cert) return null;
    const faculty = await isFacultyUser(context.userId);
    // Unpublished tracks are visible only to faculty (for preview).
    if (!cert.published && !faculty) return null;
    const certified = await certifiedCourseSlugs(sql, context.userId);
    const courses = (await memberCourses(sql, data.slug)).filter((c) => c.published);
    const done = courses.filter((c) => certified.has(c.course_slug)).length;
    const signature = await readSignature(sql);
    return {
      slug: cert.slug,
      title: cert.title,
      faculty,
      totalCourses: courses.length,
      completedCourses: done,
      complete: courses.length > 0 && done === courses.length,
      courses: courses.map((c) => ({
        slug: c.course_slug,
        title: c.title ?? c.course_slug,
        certified: certified.has(c.course_slug),
      })),
      signature,
    };
  });

// ---- Admin: settings ----------------------------------------------------

export const getSiteSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    return readSignature(sql);
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: { founderName: string; signatureText: string; signatureImage: string }) => d,
  )
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const entries: [string, string][] = [
      ["founder_name", (data.founderName ?? "").slice(0, 200)],
      ["signature_text", (data.signatureText ?? "").slice(0, 200)],
      // Allow a URL or a data: URL; keep it bounded.
      ["signature_image", (data.signatureImage ?? "").slice(0, 500000)],
    ];
    for (const [key, value] of entries) {
      await sql`
        insert into site_settings (key, value, updated_at) values (${key}, ${value}, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
    }
    return { ok: true as const };
  });

// ---- Admin: certifications CRUD ----------------------------------------

export const listCertificationsAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      slug: string;
      title: string;
      published: boolean;
      updated_at: string;
      course_count: number;
    }>`
      select t.slug, t.title, t.published, t.updated_at,
             (select count(*)::int from certification_courses cc where cc.certification_slug = t.slug) as course_count
      from certifications t order by t.updated_at desc
    `;
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      published: Boolean(r.published),
      courseCount: Number(r.course_count) || 0,
      updatedAt: r.updated_at,
    }));
  });

export const getCertificationAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      slug: string;
      title: string;
      description: string;
      published: boolean;
    }>`
      select slug, title, description, published from certifications where slug = ${data.slug}
    `;
    const row = rows[0];
    if (!row) return null;
    const members = await memberCourses(sql, data.slug);
    const allCourses = await sql<{ slug: string; title: string; published: boolean }>`
      select slug, title, published from courses order by updated_at desc
    `;
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      published: Boolean(row.published),
      courseSlugs: members.map((m) => m.course_slug),
      allCourses: allCourses.map((c) => ({
        slug: c.slug,
        title: c.title,
        published: Boolean(c.published),
      })),
    };
  });

export const upsertCertification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      slug?: string;
      title: string;
      description: string;
      published: boolean;
      courseSlugs: string[];
    }) => d,
  )
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    let slug = slugify(data.slug || data.title);
    if (!data.slug) {
      const clash = await sql<{ slug: string }>`select slug from certifications where slug = ${slug}`;
      if (clash[0]) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    await sql`
      insert into certifications (slug, title, description, published, created_by, updated_at)
      values (${slug}, ${data.title || "Untitled certification"}, ${data.description ?? ""}, ${data.published}, ${context.userId}, now())
      on conflict (slug) do update set
        title = excluded.title, description = excluded.description,
        published = excluded.published, updated_at = now()
    `;
    await sql`delete from certification_courses where certification_slug = ${slug}`;
    const slugs = (data.courseSlugs ?? []).filter(Boolean);
    for (let i = 0; i < slugs.length; i += 1) {
      await sql`
        insert into certification_courses (certification_slug, course_slug, sort_order)
        values (${slug}, ${slugs[i]}, ${i})
        on conflict (certification_slug, course_slug) do update set sort_order = excluded.sort_order
      `;
    }
    return { ok: true as const, slug };
  });

export const setCertificationPublished = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string; published: boolean }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    await sql`update certifications set published = ${data.published}, updated_at = now() where slug = ${data.slug}`;
    return { ok: true as const };
  });

export const deleteCertification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ context, data }) => {
    await requireFaculty(context.userId);
    const sql = await getSql();
    await sql`delete from certification_courses where certification_slug = ${data.slug}`;
    await sql`delete from certifications where slug = ${data.slug}`;
    return { ok: true as const };
  });
