import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    user: text('user').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    payload: text('payload').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    userTitleUnique: uniqueIndex('documents_user_title_idx').on(table.user, table.title),
    typeUpdated: index('documents_type_updated_at_idx').on(table.type, table.updatedAt),
  })
)

export const doctorInstructions = sqliteTable('doctor_instructions', {
  id: text('id').primaryKey(),
  drInstructionSeq: text('dr_instruction_seq').notNull(),
  patientNo: text('patient_no').notNull(),
  patientName: text('patient_name').notNull(),
  patientNameFurigana: text('patient_name_furigana'),
  birthday: text('birthday'),
  instructionDate: text('instruction_date').notNull(),
  instructionTime: text('instruction_time').notNull(),
  instructionContents: text('instruction_contents'),
  drAssignedCd: text('dr_assigned_cd'),
  personAssignedNameDrAssigned: text('person_assigned_name_dr_assigned'),
  directedByCd: text('directed_by_cd'),
  modiBeforePersonAssignedNameDirectedBy: text('modi_before_person_assigned_name_directed_by'),
  alreadySettledCheck: text('already_settled_check'),
  alreadySettledCheck2: text('already_settled_check_2'),
  drInstructionCompleted1: text('dr_instruction_completed_1'),
  drInstructionCompleted2: text('dr_instruction_completed_2'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const dialysisRecords = sqliteTable('dialysis_records', {
  id: text('id').primaryKey(),
  patientNo: text('patient_no').notNull(),
  patientName: text('patient_name').notNull(),
  dialysisDate: text('dialysis_date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  preWeight: text('pre_weight'),
  postWeight: text('post_weight'),
  totalUfw: text('total_ufw'),
  dialyzer: text('dialyzer'),
  bp: text('bp'),
  pulse: text('pulse'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const dialysisConditions = sqliteTable('dialysis_conditions', {
  id: text('id').primaryKey(),
  patientNo: text('patient_no').notNull(),
  dialysisDate: text('dialysis_date').notNull(),
  patientName: text('patient_name'),
  gender: text('gender'),
  karteNo: text('karte_no'),
  dialyzerName: text('dialyzer_name'),
  dw: text('dw'),
  prevWeight: text('prev_weight'),
  dialysisTime: text('dialysis_time'),
  prevPostWeight: text('prev_post_weight'),
  preWeight: text('pre_weight'),
  postWeight: text('post_weight'),
  anticoagulantName: text('anticoagulant_name'),
  anticoagulantInitial: text('anticoagulant_initial'),
  anticoagulantContinuous: text('anticoagulant_continuous'),
  targetUfw: text('target_ufw'),
  staffName1: text('staff_name1'),
  staffName2: text('staff_name2'),
  staffName3: text('staff_name3'),
  memo1: text('memo1'),
  memo2: text('memo2'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const deviceInfo = sqliteTable('device_info', {
  id: text('id').primaryKey(),
  dialysisRecordId: text('dialysis_record_id'),
  measureTime: text('measure_time'),
  bloodFlow: text('blood_flow'),
  venousPressure: text('venous_pressure'),
  dialysatePressure: text('dialysate_pressure'),
  ufRate: text('uf_rate'),
  currentUfAmount: text('current_uf_amount'),
  anticoagulantTotal: text('anticoagulant_total'),
  index: integer('index'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const oxygenInfo = sqliteTable('oxygen_info', {
  id: text('id').primaryKey(),
  oxygenAmount: text('oxygen_amount'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  totalTime: text('total_time'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const medicineInfo = sqliteTable('medicine_info', {
  id: text('id').primaryKey(),
  medicineName: text('medicine_name'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const treatmentComments = sqliteTable('treatment_comments', {
  id: text('id').primaryKey(),
  comment: text('comment'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})
