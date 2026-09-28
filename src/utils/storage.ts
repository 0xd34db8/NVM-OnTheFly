import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

import { Schema } from '../types'

const fileName: string = 'config.json'
const dirPath: string = join(app.getPath('appData'), 'nvm-onthefly', 'storage')

const defaultSchema: Schema = {
    schemaVersion: '1.0.0',
    config: {
        dark: true
    }
}

export function createSchema() {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath)
    }

    if (!existsSync(join(dirPath, fileName))) {
        setSchema(defaultSchema)
    }
}

export function getSchema() {
    try {
        const data = readFileSync(join(dirPath, fileName))

        return JSON.parse(String(data))
    } catch (err) {
        console.error('[getSchema]: ', err)
    }
}

export function setSchema(schema: Schema) {
    try {
        const mergeSchema = Object.assign(defaultSchema, schema)
        writeFileSync(join(dirPath, fileName), JSON.stringify(mergeSchema), 'utf8')
    } catch (err) {
        console.error('[setSchema]: ', err)
    }
}



