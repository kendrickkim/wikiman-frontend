const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: 'posts/new', component: () => import('@/pages/PostEditPage.vue'), meta: { requiresWriter: true } },
      { path: 'posts/:id/edit', component: () => import('@/pages/PostEditPage.vue'), meta: { requiresWriter: true } },
      { path: 'posts/:id', component: () => import('@/pages/PostViewPage.vue') },
      { path: 'trash', component: () => import('@/pages/TrashPage.vue'), meta: { requiresAuth: true } },
      { path: 'settings', component: () => import('@/pages/SettingsPage.vue'), meta: { requiresWriter: true } },
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
