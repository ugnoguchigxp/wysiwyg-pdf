import { customType, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

// Helper for bigint to number mapping if we use milliseconds
const bigint = customType<{ data: number; driverData: string }>({
  dataType() {
    return 'bigint'
  },
  fromDriver(value: string) {
    return Number(value)
  },
  toDriver(value: number) {
    return value.toString()
  },
})

export const documents = pgTable(
  'documents',
  {
    id: text('id').primaryKey(),
    user: text('user').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    payload: text('payload').notNull(),
    createdAt: bigint('created_at').notNull(),
    updatedAt: bigint('updated_at').notNull(),
  },
  (table) => ({
    userTitleUnique: uniqueIndex('documents_user_title_idx').on(table.user, table.title),
    typeUpdated: index('documents_type_updated_at_idx').on(table.type, table.updatedAt),
  })
)

export const doctorInstructions = pgTable('doctor_instructions', {
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
  createdAt: bigint('created_at').notNull(),
  updatedAt: bigint('updated_at').notNull(),
})

export const dialysisRecords = pgTable('dialysis_records', {
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
  createdAt: bigint('created_at').notNull(),
  updatedAt: bigint('updated_at').notNull(),
})
