import { Bed, Plus, Trash2, X } from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useI18n } from '@/i18n/I18nContext'
import type { Doc, WidgetNode } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'

interface BedGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Doc
  onDocumentChange: (doc: Doc) => void
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
]

export const BedGroupModal: React.FC<BedGroupModalProps> = ({
  open,
  onOpenChange,
  document,
  onDocumentChange,
}) => {
  const { t } = useI18n()

  const bedGroups =
    (document.data?.bedGroups as Array<{ id: string; name: string; color: string }>) || []
  const beds = document.nodes.filter(
    (n) => n.t === 'widget' && (n as WidgetNode).widget === 'bed'
  ) as WidgetNode[]

  const handleAddGroup = () => {
    // Find a unique name like "New Group 1", "New Group 2"...
    const baseName = t('properties_new_group', 'New Group')
    let counter = 1
    let newName = `${baseName} ${counter}`

    // Ensure the name is unique among existing groups
    while (bedGroups.some((g) => g.name === newName)) {
      counter++
      newName = `${baseName} ${counter}`
    }

    // Use the next preset color based on the number of existing groups
    const presetColor = PRESET_COLORS[bedGroups.length % PRESET_COLORS.length]
    const newGroup = {
      id: generateUUID(),
      name: newName,
      color: presetColor,
    }
    onDocumentChange({
      ...document,
      data: {
        ...document.data,
        bedGroups: [...bedGroups, newGroup],
      },
    })
  }

  const handleUpdateGroup = (
    id: string,
    updates: Partial<{ id: string; name: string; color: string }>
  ) => {
    const updatedGroups = bedGroups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    onDocumentChange({
      ...document,
      data: {
        ...document.data,
        bedGroups: updatedGroups,
      },
    })
  }

  const handleDeleteGroup = (id: string) => {
    // Deletion guard: checked in UI as well
    const bedsInGroup = beds.filter((b) => b.data?.groupId === id)
    if (bedsInGroup.length > 0) return

    const updatedGroups = bedGroups.filter((g) => g.id !== id)
    onDocumentChange({
      ...document,
      data: {
        ...document.data,
        bedGroups: updatedGroups,
      },
    })
  }

  const handleUnassignBed = (bedId: string) => {
    const updatedNodes = document.nodes.map((node) => {
      if (node.id === bedId) {
        return {
          ...node,
          data: { ...node.data, groupId: undefined },
        }
      }
      return node
    })
    onDocumentChange({
      ...document,
      nodes: updatedNodes,
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('properties_bed_groups', 'Bed Groups')}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleAddGroup} icon={Plus}>
            {t('add', 'Add')}
          </Button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {bedGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic">
              {t('msg_no_bed_groups', 'No bed groups defined.')}
            </div>
          ) : (
            bedGroups.map((group) => {
              const bedsInThisGroup = beds.filter((b) => b.data?.groupId === group.id)
              const hasBeds = bedsInThisGroup.length > 0

              return (
                <div key={group.id} className="p-4 border border-border rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="color"
                      value={group.color}
                      onChange={(e) => handleUpdateGroup(group.id, { color: e.target.value })}
                      className="w-10 h-10 p-0.5 border border-border bg-background cursor-pointer rounded overflow-hidden shadow-sm"
                    />
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                        placeholder={t('properties_group_name', 'Group Name')}
                      />
                      <Button
                        variant="ghost"
                        size="circle"
                        onClick={() => {
                          if (hasBeds) {
                            alert(
                              t(
                                'msg_cannot_delete_group_with_beds',
                                'Cannot delete group with assigned beds.'
                              )
                            )
                            return
                          }
                          handleDeleteGroup(group.id)
                        }}
                        disabled={hasBeds}
                        className={
                          hasBeds
                            ? 'opacity-50 cursor-not-allowed'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                        }
                        title={
                          hasBeds
                            ? t('msg_group_not_empty', 'Group not empty')
                            : t('delete', 'Delete')
                        }
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>

                  {/* Bed list in this group */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Bed size={14} />
                      {t('assigned_beds', 'Assigned Beds')} ({bedsInThisGroup.length})
                    </div>
                    {bedsInThisGroup.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic pl-5">
                        {t('msg_no_beds_assigned', 'No beds assigned to this group.')}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {bedsInThisGroup.map((bed) => (
                          <div
                            key={bed.id}
                            className="flex items-center justify-between gap-2 px-2 py-1 bg-background border border-border rounded text-xs"
                          >
                            <span className="truncate flex-1">{bed.name || t('bed', 'Bed')}</span>
                            <button
                              onClick={() => handleUnassignBed(bed.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title={t('unassign', 'Unassign')}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {t('close', 'Close')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
