/**
 * Patient Types
 * Based on nephroflow-api patient serializers
 */

/**
 * 患者カード情報
 */
export interface IPatientCard {
  id: string
  identifier: string
  externalIdentifier?: string
  machineId?: string
  firstName?: string
  lastName?: string
  birthdate?: string
  sex?: string
  centerIds: string[]
}

/**
 * 患者基本情報
 */
export interface IPatient {
  id: string
  caseId: string
  firstName: string
  lastName: string
  sex: 'male' | 'female' | 'other' | 'unknown'
  birthdate: string
  admissionId?: string
  avatarUrl?: string
  avatarThumbUrl?: string
  lastUnenrollmentDate?: string
  lastUnenrollmentReason?: string
  lastUnenrollmentNote?: string
  enrollmentStatus: 'enrolled' | 'unenrolled' | 'pending'
  centerIds: string[]
  residenceType: 'resident' | 'tourist' | 'external'
  anonymous: boolean
  allergiesKnown?: boolean
  primaryIdentifier?: string
  patientCards: IPatientCard[]
  displayResidenceType?: string
  isEmergencyPatient: boolean
  isEverEnrolled: boolean
}

/**
 * 患者検索結果
 */
export interface IPatientSearch {
  id: string
  firstName: string
  lastName: string
  sex: string
  birthdate: string
  avatarUrl?: string
  avatarThumbUrl?: string
  enrollmentStatus: string
  position?: {
    id: string
    name: string
    room?: {
      id: string
      name: string
    }
  }
}

/**
 * 患者一覧リクエストパラメータ
 */
export interface IPatientsQueryParams {
  scope?: 'enrolled' | 'unenrolled' | 'machine_created'
  sortKeys?: string
  page?: number
  perPage?: number
}

/**
 * 患者詳細情報（患者プロフィール画面用）
 */
export interface IPatientDetail extends IPatient {
  title?: string
  contactNotes?: string
  enrolledAt?: string
  createdAt: string
  updatedAt: string
  referrerType?: 'private' | 'government'
  addresses?: IAddress[]
  disorder?: 'renal' | 'other'
  renalFailureType?: 'chronic' | 'acute'
  dialysisInitiated?: boolean
  dialysisSince?: string
  dialysisUntil?: string
  bodyHeight?: number
  bloodType?: string
  designatedCareType?: string
  receivesHomeNursing?: boolean
  transplantationNote?: string
  remarksCount?: number
  ongoingDiagnosesCount?: number
  ongoingConcernsCount?: number
  ongoingInfectionsCount?: number
}

/**
 * 住所情報
 */
export interface IAddress {
  id: string
  addressLine?: string
  zipCode?: string
  municipality?: string
  state?: string
  country?: string
  note?: string
  addressTypes?: string[]
}

/**
 * 患者添付ファイル
 */
export interface IPatientAttachment {
  id: string
  patient_id: string
  title: string
  note: string
  date: string
  created_at: string
  updated_at: string
  url: string
  thumbnail_url?: string
  file_content_type: string
  file_name: string
  uploaded_by: {
    id: string
    name: string
    email: string
  }
}
