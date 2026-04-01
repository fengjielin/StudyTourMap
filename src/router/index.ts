import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MapContainer from '@/components/Map/MapContainer.vue';
import BaseDetailPage from '@/views/BaseDetailPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: MapContainer,
  },
  {
    path: '/base/:id',
    name: 'BaseDetail',
    component: BaseDetailPage,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
