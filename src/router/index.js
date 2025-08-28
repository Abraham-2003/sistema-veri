import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Admin/Dashboard.vue'
import GerentePanel from '../views/Gerente/Dashboard.vue'
import CoordinadorPanel from '../views/Coordinador/Dashboard.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/Administrador',
    component: Dashboard,
    meta: { requiresAuth: true, role: 'Administrador' },
    children: [
      {
        path: '',
        name: 'AdminHome',
        component: () => import('../views/Admin/AdminHome.vue')
      },
      {
        path: 'Gestion',
        component: () => import('../views/Admin/GestionUsurios.vue')
      },
      {
        path: 'Gestion Lab',
        component: () => import('../views/Admin/GestionLaboratiorios.vue')
      },
      {
        path: 'Gestion Provedores',
        component: () => import('../views/Admin/GestionProvedores.vue')
      },
      {
        path: 'Gestion Centros',
        component: () => import('../views/Admin/GestionCentros.vue')
      },
      {
        path: 'Reportes',
        component: () => import('../views/Admin/AdminReportes.vue')
      },
      {
        path: 'ReportesLab',
        component: () => import('../views/Admin/ReportesLab.vue')
      },
      {
        path: '/reportes/:ubicacion',
        name: 'ReporteVeri',
        component: () => import('../views/Admin/ReporteVeri.vue')
      },
      {
        path: 'Solicitudes',
        component: () => import('../views/Admin/AdminSolicitudes.vue')
      },
      {
        path: 'Infraestructura',
        component: () => import('../views/Admin/AdminInfraestructura.vue')
      }
    ]
  },
  {
    path: '/Gerente',
    component: GerentePanel,
    meta: { requiresAuth: true, role: 'Gerente' },
    children: [
      {
        path: '',
        name: 'GerenteHome',
        component: () => import('../views/Gerente/GerenteHome.vue')
      },
      {
        path: 'Reporte',
        component: () => import('../views/Gerente/ReporteGerente.vue'),
      },
      {
        path: 'ReporteLab',
        component: () => import('../views/Gerente/ReporteLaboratorio.vue'),
      },
      {
        path: 'Solicitudes',
        component: () => import('../views/Gerente/SolicitudesGerente.vue'),
      },
      {
        path: 'Infraestructura',
        component: () => import('../views/Gerente/InfraestructuraGerente.vue'),
      }
    ]
  },
  {
    path: '/Coordinador',
    component: CoordinadorPanel,
    meta: { requiresAuth: true, role: 'Coordinador' },
    children: [
      {
        path: '',
        name: 'CoordinadorHome',
        component: () => import('../views/Coordinador/CoordinadorHome.vue')
      },
      {
        path: 'Usuarios',
        component: () => import('../views/Coordinador/GestionUsuarios.vue'),
      },
      {
        path: 'Infraestructura',
        component: () => import('../views/Coordinador/CoordinadorInfraestructura.vue'),
      },
      {
        path: 'Gestion Lab',
        component: () => import('../views/Coordinador/GestionLaboratiorios.vue')
      },
      {
        path: 'Gestion Provedores',
        component: () => import('../views/Coordinador/GestionProvedores.vue')
      },
      {
        path: 'Gestion Centros',
        component: () => import('../views/Coordinador/GestionCentros.vue')
      },
      {
        path: 'Solicitudes',
        component: () => import('../views/Coordinador/CoordinadorSolicitudes.vue')
      },
      
    ]
  },
  {
    path: '/login',
    component: Login
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))

  if (to.meta.requiresAuth) {
    if (!user) {
      return next('/login')
    }

    if (to.meta.role && to.meta.role !== user.rol) {
      return next('/login')
    }
  }

  next()
})


export default router
