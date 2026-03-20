CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS documents_user_title_idx
    ON documents(user, title);
  CREATE INDEX IF NOT EXISTS documents_type_updated_at_idx
    ON documents(type, updated_at);

CREATE TABLE IF NOT EXISTS doctor_instructions (
  id TEXT PRIMARY KEY,
  dr_instruction_seq TEXT NOT NULL,
  patient_no TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_name_furigana TEXT,
  birthday TEXT,
  instruction_date TEXT NOT NULL,
  instruction_time TEXT NOT NULL,
  instruction_contents TEXT,
  dr_assigned_cd TEXT,
  person_assigned_name_dr_assigned TEXT,
  directed_by_cd TEXT,
  modi_before_person_assigned_name_directed_by TEXT,
  already_settled_check TEXT,
  already_settled_check_2 TEXT,
  dr_instruction_completed_1 TEXT,
  dr_instruction_completed_2 TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dialysis_records (
  id TEXT PRIMARY KEY,
  patient_no TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  dialysis_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  pre_weight TEXT,
  post_weight TEXT,
  total_ufw TEXT,
  dialyzer TEXT,
  bp TEXT,
  pulse TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dialysis_conditions (
  id TEXT PRIMARY KEY,
  patient_no TEXT NOT NULL,
  dialysis_date TEXT NOT NULL,
  patient_name TEXT,
  gender TEXT,
  karte_no TEXT,
  dialyzer_name TEXT,
  dw TEXT,
  prev_weight TEXT,
  dialysis_time TEXT,
  prev_post_weight TEXT,
  pre_weight TEXT,
  post_weight TEXT,
  anticoagulant_name TEXT,
  anticoagulant_initial TEXT,
  anticoagulant_continuous TEXT,
  target_ufw TEXT,
  staff_name1 TEXT,
  staff_name2 TEXT,
  staff_name3 TEXT,
  memo1 TEXT,
  memo2 TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS device_info (
  id TEXT PRIMARY KEY,
  dialysis_record_id TEXT,
  measure_time TEXT,
  blood_flow TEXT,
  venous_pressure TEXT,
  dialysate_pressure TEXT,
  uf_rate TEXT,
  current_uf_amount TEXT,
  anticoagulant_total TEXT,
  "index" INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oxygen_info (
  id TEXT PRIMARY KEY,
  oxygen_amount TEXT,
  start_time TEXT,
  end_time TEXT,
  total_time TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS medicine_info (
  id TEXT PRIMARY KEY,
  medicine_name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS treatment_comments (
  id TEXT PRIMARY KEY,
  comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
