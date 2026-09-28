import { contextBridge, ipcRenderer } from 'electron'
// import { createSchema, getSchema } from '../../utils/storage'

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel: any, data: any) => {
        const validChannels = ['runCommand', 'quit', 'minimize', 'maximize', 'showNotification', 'setConfig', 'relaunch', 'checkAvailableModes', 'setMode', 'runNpmCommand']

        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },
    receive: (channel: any, func: any) => {
        const validChannels = ['resCommand', 'setPlatform', 'getConfig', 'streamCommand', 'availableModes', 'resNpmCommand']

        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
        }
    }
})

window.addEventListener('DOMContentLoaded', () => {
    // createSchema()
    //
    // const config = getSchema()


})
