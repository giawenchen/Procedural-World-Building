import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const agentsCapturePath = resolve(import.meta.dirname, '../docs/tutorials/images/2026-11-03/01-agents-island.png')

function saveAgentsCapture(): Plugin {
  return {
    name: 'save-agents-capture',
    configureServer(server) {
      server.middlewares.use('/__agents-capture', (request, response, next) => {
        if (request.method !== 'POST') return next()
        const chunks: Buffer[] = []
        let size = 0
        request.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > 5_000_000) {
            response.statusCode = 413
            response.end('Image is larger than 5 MB')
            request.destroy()
            return
          }
          chunks.push(chunk)
        })
        request.on('end', async () => {
          try {
            const image = Buffer.concat(chunks)
            if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
              response.statusCode = 415
              response.end('Expected a PNG image')
              return
            }
            const frame = new URL(request.url ?? '/', 'http://localhost').searchParams.get('frame')
            const outputPath = frame === 'runoff'
              ? resolve(import.meta.dirname, '../docs/tutorials/images/2026-11-03/02-runoff-and-recovery.png')
              : agentsCapturePath
            await mkdir(dirname(outputPath), { recursive: true })
            await writeFile(outputPath, image)
            response.setHeader('Content-Type', 'text/plain')
            response.end('Saved the current Agents scene capture')
          } catch {
            response.statusCode = 500
            response.end('Could not save the scene capture')
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), saveAgentsCapture()],
})
