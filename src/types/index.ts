import type { Ref } from 'vue'

export interface Column {
    name: string
    label: string
    field: string
    align?: 'left' | 'right' | 'center'
    sort?: any
    sortable?: boolean
}

interface Row {
    ver: string
    release_date: string,
    type: number
}

interface InstallRow extends Row {
    use: number
    uninstall: number
}

interface ArchiveRow extends Row {
    install: number
}

export type Rows = Ref<(InstallRow | ArchiveRow)[]>

export type Data = Ref<{ installedData: InstallRow [], archiveData: ArchiveRow [] }>

export interface Schema {
    schemaVersion?: string
    config: object
}
