import { and, eq } from 'drizzle-orm'
import { db, schema } from './db'
import { loadReportTemplateSeeds } from './report-template-seed'

// --- Seed Function ---
export const seed = async () => {
  const user = 'anonymous'
  const now = Date.now()
  const s = schema as any
  const {
    documents,
    doctorInstructions,
    dialysisConditions,
    deviceInfo,
    oxygenInfo,
    medicineInfo,
    treatmentComments,
  } = s

  console.log('Seeding database...')

  // Seed documents
  try {
    const reportTemplates = await loadReportTemplateSeeds()

    for (const item of reportTemplates) {
      await db
        .delete(documents)
        .where(and(eq(documents.user, user), eq(documents.title, item.title)))

      await db.insert(documents).values({
        id: crypto.randomUUID(),
        user,
        type: item.type || 'report',
        title: item.title,
        payload: JSON.stringify(item.payload),
        createdAt: now,
        updatedAt: now,
      } as any)
    }
  } catch (e) {
    console.warn('Failed to seed documents:', e)
  }

  // Seed doctor_instructions
  try {
    const doctorInstructionsData = [
      {
        id: crypto.randomUUID(),
        drInstructionSeq: '0001',
        patientNo: 'P001',
        patientName: '山田 太郎',
        patientNameFurigana: 'ヤマダ タロウ',
        birthday: '1980/01/01',
        instructionDate: '2024/12/13',
        instructionTime: '10:00',
        instructionContents: '安静にしてください。',
        drAssignedCd: 'D001',
        personAssignedNameDrAssigned: '佐藤 医師',
        directedByCd: 'N001',
        modiBeforePersonAssignedNameDirectedBy: '鈴木 看護師',
        alreadySettledCheck: '済',
        alreadySettledCheck2: '',
        drInstructionCompleted1: 'DONE',
        drInstructionCompleted2: '',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const data of doctorInstructionsData) {
      await db.insert(doctorInstructions).values(data as any)
    }
  } catch (e) {
    console.warn('Failed to seed doctor instructions:', e)
  }

  // Seed dialysis_conditions
  try {
    const conditionData = [
      {
        id: crypto.randomUUID(),
        patientNo: 'P001',
        dialysisDate: '2024/12/13',
        patientName: '山田 太郎',
        gender: '男',
        karteNo: '123456',
        dialyzerName: 'FX-180',
        dw: '62.0',
        prevWeight: '65.0',
        dialysisTime: '4.0',
        prevPostWeight: '63.0',
        preWeight: '65.5',
        postWeight: '63.0',
        anticoagulantName: 'ヘパリン',
        anticoagulantInitial: '1000',
        anticoagulantContinuous: '500',
        targetUfw: '2.5',
        staffName1: 'スタッフA',
        staffName2: 'スタッフB',
        staffName3: 'スタッフC',
        memo1: '良好',
        memo2: '特記事項なし',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const data of conditionData) {
      await db.insert(dialysisConditions).values(data as any)
    }
  } catch (e) {
    console.warn('Failed to seed dialysis conditions:', e)
  }

  // Seed device_info
  try {
    const deviceInfoData = [
      {
        id: crypto.randomUUID(),
        measureTime: '09:00',
        bloodFlow: '200',
        venousPressure: '100',
        dialysatePressure: '150',
        ufRate: '0.6',
        currentUfAmount: '0.0',
        anticoagulantTotal: '1000',
        index: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        measureTime: '10:00',
        bloodFlow: '200',
        venousPressure: '110',
        dialysatePressure: '160',
        ufRate: '0.6',
        currentUfAmount: '0.6',
        anticoagulantTotal: '1500',
        index: 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        measureTime: '11:00',
        bloodFlow: '210',
        venousPressure: '105',
        dialysatePressure: '155',
        ufRate: '0.6',
        currentUfAmount: '1.2',
        anticoagulantTotal: '2000',
        index: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        measureTime: '12:00',
        bloodFlow: '190',
        venousPressure: '95',
        dialysatePressure: '145',
        ufRate: '0.6',
        currentUfAmount: '1.8',
        anticoagulantTotal: '2500',
        index: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        measureTime: '13:00',
        bloodFlow: '150',
        venousPressure: '80',
        dialysatePressure: '120',
        ufRate: '0.1',
        currentUfAmount: '2.4',
        anticoagulantTotal: '3000',
        index: 5,
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const data of deviceInfoData) {
      await db.insert(deviceInfo).values(data as any)
    }
  } catch (e) {
    console.warn('Failed to seed device info:', e)
  }

  // Seed oxygen_info
  try {
    await db.insert(oxygenInfo).values({
      id: crypto.randomUUID(),
      oxygenAmount: '2',
      startTime: '09:00',
      endTime: '13:00',
      totalTime: '4',
      createdAt: now,
      updatedAt: now,
    } as any)
  } catch (e) {
    console.warn('Failed to seed oxygen info:', e)
  }

  // Seed medicine_info
  try {
    const medicines = [
      { id: crypto.randomUUID(), medicineName: '薬A', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), medicineName: '薬B', createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), medicineName: '薬C', createdAt: now, updatedAt: now },
    ]
    for (const data of medicines) {
      await db.insert(medicineInfo).values(data as any)
    }
  } catch (e) {
    console.warn('Failed to seed medicine info:', e)
  }

  // Seed treatment_comments
  try {
    await db.insert(treatmentComments).values({
      id: crypto.randomUUID(),
      comment: 'バイタル安定。透析中トラブルなし。',
      createdAt: now,
      updatedAt: now,
    } as any)
  } catch (e) {
    console.warn('Failed to seed treatment comments:', e)
  }

  console.log('Seeding complete.')
}
