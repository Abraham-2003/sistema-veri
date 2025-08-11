import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboard from '../views/Admin/Dashboard.vue'
import GerenteReportes from '../views/Gerente/Reportes.vue'

const routes = [
  { path: '/admin', component: AdminDashboard },
  { path: '/gerente', component: GerenteReportes }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
