import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

// System health check table (DO NOT MODIFY)
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// Users table - phone-based registration
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }).notNull().default(""),
    is_active: boolean("is_active").default(true).notNull(),
    is_frozen: boolean("is_frozen").default(false).notNull(),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    login_token: varchar("login_token", { length: 255 }),
    token_expires_at: timestamp("token_expires_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_phone_idx").on(table.phone),
    index("users_is_active_idx").on(table.is_active),
    index("users_login_token_idx").on(table.login_token),
  ]
);

// Notices / Announcements
export const notices = pgTable(
  "notices",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull().default(""),
    pdf_url: text("pdf_url"),
    is_pinned: boolean("is_pinned").default(false).notNull(),
    is_published: boolean("is_published").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notices_is_pinned_idx").on(table.is_pinned),
    index("notices_is_published_idx").on(table.is_published),
    index("notices_created_at_idx").on(table.created_at),
  ]
);

// Information Disclosure
export const info_disclosures = pgTable(
  "info_disclosures",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull().default(""),
    pdf_url: text("pdf_url"),
    display_type: varchar("display_type", { length: 20 }).notNull().default("text"), // 'text' or 'pdf'
    is_published: boolean("is_published").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("info_disclosures_is_published_idx").on(table.is_published),
    index("info_disclosures_created_at_idx").on(table.created_at),
  ]
);

// Online Consultations
export const consultations = pgTable(
  "consultations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    contact: varchar("contact", { length: 200 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, replied, closed
    reply: text("reply"),
    replied_at: timestamp("replied_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("consultations_user_id_idx").on(table.user_id),
    index("consultations_status_idx").on(table.status),
    index("consultations_created_at_idx").on(table.created_at),
  ]
);

// Information Disclosure Requests
export const disclosure_requests = pgTable(
  "disclosure_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    title: varchar("title", { length: 300 }).notNull(),
    content: text("content").notNull(),
    contact: varchar("contact", { length: 200 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, replied, closed
    reply: text("reply"),
    replied_at: timestamp("replied_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("disclosure_requests_user_id_idx").on(table.user_id),
    index("disclosure_requests_status_idx").on(table.status),
    index("disclosure_requests_created_at_idx").on(table.created_at),
  ]
);

// IOUs / Financial Documents
export const ious = pgTable(
  "ious",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
    borrower_phone: varchar("borrower_phone", { length: 20 }).notNull(),
    document_no: varchar("document_no", { length: 100 }).notNull(),
    verification_code: varchar("verification_code", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("valid"), // valid, expired, invalid
    amount: varchar("amount", { length: 50 }),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ious_user_id_idx").on(table.user_id),
    index("ious_borrower_phone_idx").on(table.borrower_phone),
    index("ious_document_no_idx").on(table.document_no),
    index("ious_status_idx").on(table.status),
  ]
);

// Verification Records
export const verification_records = pgTable(
  "verification_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    iou_id: varchar("iou_id", { length: 36 }).notNull().references(() => ious.id),
    document_no: varchar("document_no", { length: 100 }).notNull(),
    verification_code: varchar("verification_code", { length: 50 }).notNull(),
    result: varchar("result", { length: 20 }).notNull(), // success, failed
    ip_address: varchar("ip_address", { length: 50 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("verification_records_iou_id_idx").on(table.iou_id),
    index("verification_records_result_idx").on(table.result),
    index("verification_records_created_at_idx").on(table.created_at),
  ]
);

// Visitor Feedback
export const feedback = pgTable(
  "feedback",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 20 }).notNull(), // bug, feature
    content: text("content").notNull(),
    contact: varchar("contact", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("feedback_type_idx").on(table.type),
    index("feedback_status_idx").on(table.status),
  ]
);

// Visit Statistics
export const visit_stats = pgTable(
  "visit_stats",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    visit_date: varchar("visit_date", { length: 10 }).notNull(), // YYYY-MM-DD
    visit_count: integer("visit_count").notNull().default(0),
    total_count: integer("total_count").notNull().default(0),
  },
  (table) => [
    index("visit_stats_visit_date_idx").on(table.visit_date),
  ]
);

// Audit Logs
export const audit_logs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }),
    action: varchar("action", { length: 100 }).notNull(),
    target_type: varchar("target_type", { length: 50 }),
    target_id: varchar("target_id", { length: 36 }),
    detail: text("detail"),
    ip_address: varchar("ip_address", { length: 50 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.user_id),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.created_at),
  ]
);

// Site Settings (for homepage image, etc.)
export const site_settings = pgTable(
  "site_settings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull().default(""),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("site_settings_key_idx").on(table.key),
  ]
);
