import { schema } from '../db'

/**
 * データバインディング翻訳マップ
 * テンプレート内の日本語名 (タグ) を DB の物理名に変換します
 * db.ts で選択された現在のスキーマ (Postgres/SQLite) を使用します
 */
export const TABLE_MAP: Record<string, any> = {
  医師指示情報: schema.doctorInstructions,
  透析記録情報: schema.dialysisRecords,
}

export const FIELD_MAP: Record<string, Record<string, string>> = {
  医師指示情報: {
    医師指示シーケンス: 'drInstructionSeq',
    患者番号: 'patientNo',
    患者名: 'patientName',
    '患者名（フリガナ）': 'patientNameFurigana',
    生年月日: 'birthday',
    指示日: 'instructionDate',
    指示時刻: 'instructionTime',
    指示内容: 'instructionContents',
    '担当者コード（担当医）': 'drAssignedCd',
    '担当者名称(担当医)': 'personAssignedNameDrAssigned',
    '担当者コード（指示受け）': 'directedByCd',
    '担当者名（指示受け）': 'modiBeforePersonAssignedNameDirectedBy',
    済欄1: 'drInstructionCompleted1',
    済欄2: 'drInstructionCompleted2',
  },
  透析記録情報: {
    患者番号: 'patientNo',
    患者名: 'patientName',
    透析日: 'dialysisDate',
    開始時間: 'startTime',
    終了時間: 'endTime',
    開始時体重: 'preWeight',
    終了時体重: 'postWeight',
    除水量: 'totalUfw',
    透析器: 'dialyzer',
    血圧: 'bp',
    脈拍: 'pulse',
  },
}
