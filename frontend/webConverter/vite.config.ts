import { fileURLToPath, URL } from 'node:url'

// vite.config.js/ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next'

export default defineConfig({
    base: "/WebConverter/",
    plugins: [
        vue(),
        Components({
            resolvers: [BootstrapVueNextResolver()],
        }),
    ],
})