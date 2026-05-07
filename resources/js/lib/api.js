import axios from 'axios';
import { router } from '@inertiajs/react';

/**
 * TALAIS API client.
 *
 * Compatibility layer that emulates the previous `base44` SDK shape so the
 * existing React UI keeps working unchanged while the calls now hit the
 * Laravel REST API mounted at `/api/v1`. CSRF is handled by Sanctum's
 * stateful cookie flow.
 */

export const http = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            router.visit('/login');
        }
        return Promise.reject(error);
    },
);

const ENTITY_PATHS = {
    Student: 'students',
    Section: 'sections',
    Subject: 'subjects',
    SchoolYear: 'school-years',
    GradeLevel: 'grade-levels',
    Faculty: 'faculty',
    Quarter: 'quarters',
    Enrollment: 'enrollments',
    ClassSchedule: 'class-schedules',
    AssessmentComponent: 'assessment-components',
    Grade: 'grades',
    StudentGrade: 'grades',
    Attendance: 'attendance',
    AttendanceRecord: 'attendance',
    HealthRecord: 'health-records',
    StudentHealthRecord: 'health-records',
    Violation: 'violations',
    StudentViolation: 'violations',
    Transfer: 'transfers',
    TransferRecord: 'transfers',
    HomeroomGuidance: 'homeroom-guidance',
    HomeroomGuidanceAssessment: 'homeroom-guidance',
    Sf3BookRecord: 'sf3-book-records',
    NatResult: 'nat-results',
    Kpi: 'kpis',
    KeyPerformanceIndicator: 'kpis',
    PirReportSnapshot: 'pir-reports',
    GradeReviewAssignment: 'grade-reviews',
    User: 'users',
    Parent: 'parents',
    ParentGuardian: 'parents',
    AuditLog: 'audit-logs',
    BackupLog: 'backup-logs',
    Notification: 'notifications',
};

function buildEntity(name) {
    const path = ENTITY_PATHS[name] ?? name.toLowerCase();

    return {
        async list(orderBy, limit) {
            const params = {};
            if (orderBy) params.order = orderBy;
            if (limit) params.limit = limit;
            const { data } = await http.get(`/${path}`, { params });
            return Array.isArray(data) ? data : (data?.data ?? []);
        },
        async filter(query = {}, orderBy, limit) {
            const params = { ...query };
            if (orderBy) params.order = orderBy;
            if (limit) params.limit = limit;
            const { data } = await http.get(`/${path}`, { params });
            return Array.isArray(data) ? data : (data?.data ?? []);
        },
        async get(id) {
            const { data } = await http.get(`/${path}/${id}`);
            return data?.data ?? data;
        },
        async create(payload) {
            const { data } = await http.post(`/${path}`, payload);
            return data?.data ?? data;
        },
        async update(id, payload) {
            const { data } = await http.put(`/${path}/${id}`, payload);
            return data?.data ?? data;
        },
        async delete(id) {
            const { data } = await http.delete(`/${path}/${id}`);
            return data?.data ?? data;
        },
    };
}

const entitiesProxy = new Proxy(
    {},
    {
        get: (_target, name) => {
            if (typeof name !== 'string') return undefined;
            return buildEntity(name);
        },
    },
);

async function lookupStudentByLrn(lrn) {
    const { data } = await http.get('/students/lookup', { params: { lrn: String(lrn).trim() } });
    return data?.data ?? null;
}

async function importStudentsExcel(file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await http.post('/students/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data?.data ?? data;
}

export const base44 = {
    entities: entitiesProxy,
    students: {
        lookup: lookupStudentByLrn,
        importExcel: importStudentsExcel,
    },
    auth: {
        async me() {
            const { data } = await http.get('/me');
            return data?.data ?? data;
        },
        async logout() {
            try {
                await axios.post('/logout', {}, { withCredentials: true });
            } catch (_) {
                /* ignore */
            }
            window.location.href = '/login';
        },
        redirectToLogin() {
            window.location.href = '/login';
        },
    },
    integrations: {
        Core: {
            async UploadFile({ file }) {
                const fd = new FormData();
                fd.append('file', file);
                const { data } = await http.post('/uploads', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                return { file_url: data?.url ?? data?.data?.url };
            },
        },
    },
    appLogs: {
        async logUserInApp(_pageName) {
            return null;
        },
    },
};

export default base44;
