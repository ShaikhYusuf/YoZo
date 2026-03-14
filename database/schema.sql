-- ══════════════════════════════════════════════════════════════
-- YoZo — Unified PostgreSQL Schema
-- Generated from merging Test/ (MySQL) and Dip-Project/ (PostgreSQL)
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- USERS (merged: Test/logindetail + Dip-Project/users)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    adhaar VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student'
        CHECK (role IN ('admin', 'principal', 'teacher', 'student', 'parent')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────
-- SCHOOL MANAGEMENT (from Test/)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS standards (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS school_standards (
    "Id" SERIAL PRIMARY KEY,
    school INTEGER NOT NULL REFERENCES schools("Id") ON DELETE CASCADE,
    standard INTEGER NOT NULL REFERENCES standards("Id") ON DELETE CASCADE,
    UNIQUE(school, standard)
);

CREATE TABLE IF NOT EXISTS students (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    adhaar VARCHAR(20),
    school INTEGER REFERENCES schools("Id"),
    standard INTEGER REFERENCES standards("Id")
);

-- ──────────────────────────────────────────
-- CURRICULUM (from Test/)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    standard INTEGER NOT NULL REFERENCES standards("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject INTEGER NOT NULL REFERENCES subjects("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lesson_sections (
    "Id" SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    explanation TEXT,
    quiz TEXT,
    fillblanks TEXT,
    truefalse TEXT,
    subject INTEGER REFERENCES subjects("Id"),
    lesson INTEGER REFERENCES lessons("Id") ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- PROGRESS (from Test/)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
    "Id" SERIAL PRIMARY KEY,
    student INTEGER REFERENCES students("Id") ON DELETE CASCADE,
    lessonsection INTEGER REFERENCES lesson_sections("Id"),
    score INTEGER DEFAULT 0,
    subject INTEGER REFERENCES subjects("Id"),
    lesson INTEGER REFERENCES lessons("Id"),
    standard INTEGER REFERENCES standards("Id"),
    school INTEGER REFERENCES schools("Id")
);

-- ══════════════════════════════════════════════════════════════
-- AI-GENERATED CONTENT (from Dip-Project/)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lesson_hierarchy (
    path TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    parent_path TEXT
);

CREATE TABLE IF NOT EXISTS ai_lesson_sections (
    path TEXT PRIMARY KEY,
    content TEXT
);

CREATE TABLE IF NOT EXISTS ai_lesson_scores (
    path TEXT PRIMARY KEY,
    quiz_score INTEGER DEFAULT 0,
    truefalse_score INTEGER DEFAULT 0,
    shortquestion_score INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ai_lesson_contents (
    id SERIAL PRIMARY KEY,
    path TEXT UNIQUE,
    paragraph TEXT,
    explanation TEXT,
    summary TEXT,
    examples TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_quizzes (
    id SERIAL PRIMARY KEY,
    path TEXT UNIQUE,
    questions_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_truefalse (
    id SERIAL PRIMARY KEY,
    path TEXT UNIQUE,
    questions_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_short_questions (
    id SERIAL PRIMARY KEY,
    path TEXT UNIQUE,
    questions_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════
-- GAMIFICATION (from Dip-Project/)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_gamification (
    user_id INTEGER PRIMARY KEY REFERENCES users("Id") ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE DEFAULT CURRENT_DATE,
    total_sections_completed INTEGER DEFAULT 0,
    total_quizzes_taken INTEGER DEFAULT 0,
    total_perfect_quizzes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    user_id INTEGER REFERENCES users("Id") ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users("Id") ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    details TEXT,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school);
CREATE INDEX IF NOT EXISTS idx_students_standard ON students(standard);
CREATE INDEX IF NOT EXISTS idx_subjects_standard ON subjects(standard);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_lesson ON lesson_sections(lesson);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student);
CREATE INDEX IF NOT EXISTS idx_progress_lessonsection ON progress(lessonsection);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_adhaar ON users(adhaar);
