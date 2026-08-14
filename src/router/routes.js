const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: 'category/:categoryId', component: () => import('@/pages/IndexPage.vue') },
      { path: 'posts/new', component: () => import('@/pages/PostEditPage.vue'), meta: { requiresWriter: true } },
      { path: 'posts/:id/edit', component: () => import('@/pages/PostEditPage.vue'), meta: { requiresWriter: true } },
      { path: 'posts/:id', component: () => import('@/pages/PostViewPage.vue') },
      { path: 'keywords', component: () => import('@/pages/KeywordsPage.vue') },
      { path: 'keyword/:keyword', component: () => import('@/pages/IndexPage.vue') },
      { path: 'trash', component: () => import('@/pages/TrashPage.vue'), meta: { requiresWriter: true } },
      {
        path: 'settings',
        component: () => import('@/pages/settings/SettingsLayout.vue'),
        meta: { requiresWriter: true },
        children: [
          { path: '', redirect: '/settings/general' },
          { path: 'general', component: () => import('@/pages/settings/GeneralSettingsPage.vue') },
          { path: 'top-menu', component: () => import('@/pages/settings/TopMenuSettingsPage.vue') },
          { path: 'categories', component: () => import('@/pages/settings/CategoriesSettingsPage.vue') },
          { path: 'homepage', component: () => import('@/pages/settings/HomepageSettingsPage.vue') },
          { path: 'attachments', component: () => import('@/pages/settings/AttachmentsSettingsPage.vue') },
          { path: 'backup', component: () => import('@/pages/settings/BackupSettingsPage.vue') }
        ]
      },
      { path: 'login', component: () => import('@/pages/LoginPage.vue') },
      { path: 'register', component: () => import('@/pages/RegisterPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
