# Report Template Seeding (Load Presets)

`Load` メニューに出すレポートテンプレートは、以下の順序で seed されます。

1. `REPORT_TEMPLATE_SEED_FILE` で指定した JSON
2. `./template/local/report-templates.seed.json`
3. `REPORT_TEMPLATE_XLS_DIR` で指定した Excel (`doctor_order.*`, `standard_record.*`)
4. `./template/local` の Excel (`doctor_order.*`, `standard_record.*`)
5. `./template` の Excel（後方互換）

## 1) 元 Excel をリポジトリに載せない運用

- ローカル専用ディレクトリに配置してください: `example/backend/template/local/`
- このディレクトリは `.gitignore` 済みです。

例:

- `example/backend/template/local/doctor_order.xlsm`
- `example/backend/template/local/standard_record.xlsm`

その状態で backend を起動すると seed が実行され、`Load` から選べます。

## 2) JSON で seed する運用

`report-templates.seed.json` の例:

```json
[
  {
    "title": "医師指示テンプレート",
    "type": "report",
    "payload": { "v": 1, "id": "doc-1", "unit": "mm", "surfaces": [], "nodes": [] }
  },
  {
    "title": "透析記録テンプレート",
    "type": "report",
    "payload": { "v": 1, "id": "doc-2", "unit": "mm", "surfaces": [], "nodes": [] }
  }
]
```

環境変数で場所を変える場合:

```bash
REPORT_TEMPLATE_SEED_FILE=/absolute/path/report-templates.seed.json bun run dev
```

## 3) 既存 DB へ再投入

```bash
cd example/backend
bun run templates:reimport
```

