import { createNuxtApp, defineNuxtPlugin } from 'nuxt/app'
import { getContext } from 'unctx'

import type { App } from 'vue'
import { logger } from '../composables/logger'

// @ts-expect-error virtual file
import plugins from '#build/plugins'

const globalWindow = window as any

export default defineNuxtPlugin({
  name: 'storybook-nuxt-plugin',
  enforce: 'pre', // or 'post'

  setup(nuxtApp: any) {
    if (nuxtApp.globalName !== 'nuxt')
      return
    const applyNuxtPlugins = async (vueApp: App, storyContext: any) => {
      const nuxt = createNuxtApp({ vueApp, globalName: `nuxt-${storyContext.id}` })
      getContext('nuxt-app').set(nuxt, true)
      nuxt.$router = nuxtApp.$router
      getContext(nuxt.globalName).set(nuxt, true)

      nuxt.hooks.callHook('app:created', vueApp)
      for (const plugin of plugins) {
        try {
          if (typeof plugin === 'function' && !plugin.toString().includes('definePayloadReviver'))
            await vueApp.runWithContext(() => plugin(nuxt))
        }
        catch (e) {
          logger.info('error in plugin', e)
        }
      }
      logger.info('applyNuxtPlugins nuxt.router:', nuxt.$router)
      return nuxt
    }

    globalWindow.STORYBOOK_VUE_GLOBAL_PLUGINS = []
    globalWindow.APPLY_PLUGINS_FUNC = applyNuxtPlugins
  },

  hooks: {
    'app:created': function () {
    },
  },
})
