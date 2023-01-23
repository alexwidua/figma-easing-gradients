import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
	root: './ui/',
	plugins: [viteSingleFile()],
	build: {
		outDir: '../dist'
	}
})
