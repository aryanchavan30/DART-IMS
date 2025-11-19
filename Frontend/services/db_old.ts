

import { Pool } from '@neondatabase/serverless';
import { 
  User, Role, Department, Candidate, Intern, Stipend, LeaveRequest, ExtensionRequest, ExitRequest,
  CandidateStatus, InternStatus, ApprovalStatus, Shift, Holiday, LeaveType
} from '../types';

// WARNING: Hardcoding credentials in the frontend is a major security risk.
// In a real-world application, this connection should be handled by a secure backend server.
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_biwDHp80vFXl@ep-red-fire-a14a1hhk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

const toCamel = (s) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));

const convertKeysToCamel = (obj) => {
  if (Array.isArray(obj)) return obj.map(v => convertKeysToCamel(v));
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => ({
      ...result,
      [toCamel(key)]: convertKeysToCamel(obj[key]),
    }), {});
  }
  return obj;
};

const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const db = {
  query: async (sql: string, params: any[] = []) => {
      const { rows } = await pool.query(sql, params);
      return convertKeysToCamel(rows);
  },
  users: {
    find: async (query: Partial<User>): Promise<User[]> => {
      let sql = 'SELECT * FROM users';
      const values: any[] = [];
      if (Object.keys(query).length > 0) {
        sql += ' WHERE ';
        const whereClauses = Object.entries(query).map(([key, value], index) => {
          values.push(value);
          // FIX: Make email searches case-insensitive for robustness.
          if (key === 'email' && typeof value === 'string') {
            return `LOWER(${toSnakeCase(key)}) = LOWER($${index + 1})`;
          }
          return `${toSnakeCase(key)} = $${index + 1}`;
        });
        sql += whereClauses.join(' AND ');
      }
      return db.query(sql, values);
    },
    findById: async (id: string): Promise<User | undefined> => {
       const rows = await db.query('SELECT * FROM users WHERE id = $1', [id]);
       return rows[0];
    },
    create: async (data: Partial<Omit<User, 'id'>>): Promise<User> => {
       const newId = `u${Math.floor(Math.random() * 100000)}`;
       const newUser: User = {
           id: newId,
           loginId: data.loginId || `TEMP-${newId}`,
           name: data.name!,
           email: data.email!,
           role: data.role || Role.INTERN,
           departmentId: data.departmentId,
           dob: data.dob || '2003-01-01',
           shift: data.shift || Shift.GENERAL,
           weekOffs: data.weekOffs || [0, 6],
       };
       await pool.query(
           'INSERT INTO users (id, login_id, name, email, role, department_id, dob, shift, week_offs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
           [newUser.id, newUser.loginId, newUser.name, newUser.email, newUser.role, newUser.departmentId, newUser.dob, newUser.shift, newUser.weekOffs]
       );
       return newUser;
    }
  },
  departments: {
    getAll: async (): Promise<Department[]> => db.query('SELECT * FROM departments'),
    findById: async (id: string): Promise<Department | undefined> => {
       const rows = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
       return rows[0];
    }
  },
  candidates: {
    getAll: async (): Promise<Candidate[]> => db.query('SELECT * FROM candidates'),
    findById: async (id: string): Promise<Candidate | undefined> => {
       const rows = await db.query('SELECT * FROM candidates WHERE id = $1', [id]);
       return rows[0];
    },
    create: async (data: {
        name: string;
        email: string;
        resumeUrl: string;
        photoUrl: string;
        signatureUrl: string;
        lastProjectReportUrl: string;
        questData: Record<string, any>;
    }): Promise<Candidate> => {
        const newId = `c${Math.floor(Math.random() * 1000000 + Date.now())}`;
        const status = CandidateStatus.PENDING_ASSIGNMENT;

        // Use provided photoUrl if available, otherwise generate one.
        const finalPhotoUrl = data.photoUrl || `https://i.pravatar.cc/150?u=${newId}`;
        
        const sql = `
            INSERT INTO candidates (id, name, email, photo_url, status, quest_data, resume_url, signature_url, last_project_report_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
        const values = [newId, data.name, data.email, finalPhotoUrl, status, data.questData, data.resumeUrl, data.signatureUrl, data.lastProjectReportUrl];

        const rows = await db.query(sql, values);
        return rows[0];
    },
    update: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
        const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
        const values = Object.values(data);
        const rows = await db.query(`UPDATE candidates SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
        return rows[0];
    }
  },
  interns: {
    getAll: async (): Promise<Intern[]> => db.query('SELECT * FROM interns'),
     findById: async (id: string): Promise<Intern | undefined> => {
       const rows = await db.query('SELECT * FROM interns WHERE id = $1', [id]);
       return rows[0];
    },
    create: async (data: Omit<Intern, 'id'>): Promise<Intern> => {
        const newId = `i${Math.floor(Math.random() * 100000)}`;
        const newIntern: Intern = { id: newId, ...data };
        await pool.query(
            'INSERT INTO interns (id, user_id, candidate_id, joining_date, mentor_id, offer_letter_url, bank_details, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [newIntern.id, newIntern.userId, newIntern.candidateId, newIntern.joiningDate, newIntern.mentorId, newIntern.offerLetterUrl, JSON.stringify(newIntern.bankDetails), newIntern.status]
        );
        return newIntern;
    },
    update: async (id: string, data: Partial<Intern>): Promise<Intern> => {
        const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
        const values = Object.values(data);
        const rows = await db.query(`UPDATE interns SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
        return rows[0];
    },
  },
  stipends: {
      getAll: async (): Promise<Stipend[]> => db.query('SELECT * FROM stipends'),
      findById: async (id: string): Promise<Stipend | undefined> => {
        const rows = await db.query('SELECT * FROM stipends WHERE id = $1', [id]);
        return rows[0];
      },
      create: async (data: Omit<Stipend, 'id'>): Promise<Stipend> => {
          const newId = `s${Math.floor(Math.random() * 100000)}`;
          const newStipend: Stipend = { id: newId, ...data };
          await pool.query(
              `INSERT INTO stipends (id, intern_id, month, amount, working_days, leaves_taken, comments, intern_approval, hr_approval, hod_approval, mhr_approval, invoice_url, intern_signature_url, hr_signature_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
              [newStipend.id, newStipend.internId, newStipend.month, newStipend.amount, newStipend.workingDays, newStipend.leavesTaken, newStipend.comments, newStipend.internApproval, newStipend.hrApproval, newStipend.hodApproval, newStipend.mhrApproval, newStipend.invoiceUrl, newStipend.internSignatureUrl || null, newStipend.hrSignatureUrl || null]
          );
          return newStipend;
      },
      update: async (id: string, data: Partial<Stipend>): Promise<Stipend> => {
          const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
          const values = Object.values(data);
          const rows = await db.query(`UPDATE stipends SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
          return rows[0];
      },
  },
   leaves: {
      getAll: async (): Promise<LeaveRequest[]> => db.query('SELECT * FROM leave_requests'),
      create: async (data: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
          const newId = `l${Math.floor(Math.random() * 100000)}`;
          const newLeave: LeaveRequest = { id: newId, ...data };
          await pool.query(
              'INSERT INTO leave_requests (id, intern_id, start_date, end_date, leave_type, leave_half, reason, mail_sent, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
              [newLeave.id, newLeave.internId, newLeave.startDate, newLeave.endDate, newLeave.leaveType, newLeave.leaveHalf || null, newLeave.reason, newLeave.mailSent, newLeave.status]
          );
          return newLeave;
      },
      update: async (id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> => {
          const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
          const values = Object.values(data);
          const rows = await db.query(`UPDATE leave_requests SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
          return rows[0];
      },
  },
   extensions: {
      getAll: async (): Promise<ExtensionRequest[]> => db.query('SELECT * FROM extension_requests'),
      create: async (data: Omit<ExtensionRequest, 'id'>): Promise<ExtensionRequest> => {
          const newId = `e${Math.floor(Math.random() * 100000)}`;
          const newExtension: ExtensionRequest = { id: newId, ...data };
          await pool.query(
              `INSERT INTO extension_requests (id, intern_id, months_requested, reason, status, hr_approval, mentor_approval, hod_approval, mhr_approval)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
               [newExtension.id, newExtension.internId, newExtension.monthsRequested, newExtension.reason, newExtension.status, newExtension.hrApproval, newExtension.mentorApproval, newExtension.hodApproval, newExtension.mhrApproval]
          );
          return newExtension;
      },
      update: async (id: string, data: Partial<ExtensionRequest>): Promise<ExtensionRequest> => {
          const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
          const values = Object.values(data);
          const rows = await db.query(`UPDATE extension_requests SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
          return rows[0];
      },
  },
   exits: {
      getAll: async (): Promise<ExitRequest[]> => db.query('SELECT * FROM exit_requests'),
      create: async (data: Omit<ExitRequest, 'id'>): Promise<ExitRequest> => {
          const newId = `x${Math.floor(Math.random() * 100000)}`;
          const newExit: ExitRequest = { id: newId, ...data };
          await pool.query(
              `INSERT INTO exit_requests (id, intern_id, feedback, internship_report_url, certificate_url, status, hr_approval, mentor_approval, hod_approval, mhr_approval)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [newExit.id, newExit.internId, newExit.feedback, newExit.internshipReportUrl, newExit.certificateUrl, newExit.status, newExit.hrApproval, newExit.mentorApproval, newExit.hodApproval, newExit.mhrApproval]
          );
          return newExit;
      },
      update: async (id: string, data: Partial<ExitRequest>): Promise<ExitRequest> => {
          const fields = Object.keys(data).map((key, i) => `${toSnakeCase(key)} = $${i + 1}`).join(', ');
          const values = Object.values(data);
          const rows = await db.query(`UPDATE exit_requests SET ${fields} WHERE id = $${values.length + 1} RETURNING *`, [...values, id]);
          return rows[0];
      },
  },
  holidays: {
    getAll: async (): Promise<Holiday[]> => db.query('SELECT * FROM holidays'),
  }
};

export default db;