'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseCLient';
import DashboardLayout from '@/components/DashboardLayout';
import {
  UserGroupIcon,
  MusicalNoteIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  FlagIcon,
  UserIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsuarios: number;
  totalCanciones: number;
  totalArtistas: number;
  totalReproduccionesHoy: number;
  nuevosUsuariosHoy: number;
  cancionesPendientes: number;
  reportesPendientes: number;
  ingresosMensuales: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsuarios: 0,
    totalCanciones: 0,
    totalArtistas: 0,
    totalReproduccionesHoy: 0,
    nuevosUsuariosHoy: 0,
    cancionesPendientes: 0,
    reportesPendientes: 0,
    ingresosMensuales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      const [
        { count: totalUsuarios },
        { count: totalCanciones },
        { count: totalArtistas },
        { count: cancionesPendientes },
        { count: reportesPendientes },
        { count: nuevosUsuariosHoy },
      ] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }),
        supabase.from('canciones').select('*', { count: 'exact', head: true }),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'artista'),
        supabase.from('canciones').select('*', { count: 'exact', head: true }).eq('estado', 'borrador'),
        supabase.from('reportes').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

      setStats({
        totalUsuarios: totalUsuarios || 0,
        totalCanciones: totalCanciones || 0,
        totalArtistas: totalArtistas || 0,
        totalReproduccionesHoy: 0, // A implementar
        nuevosUsuariosHoy: nuevosUsuariosHoy || 0,
        cancionesPendientes: cancionesPendientes || 0,
        reportesPendientes: reportesPendientes || 0,
        ingresosMensuales: 0, // A implementar
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center mb-2">
            <WrenchScrewdriverIcon className="w-8 h-8 mr-3" />
            <h2 className="text-3xl font-bold">Panel de Administración</h2>
          </div>
          <p className="text-purple-100">Gestiona usuarios, contenido y supervisa el rendimiento de la plataforma SOUNDLY</p>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Usuarios" value={stats.totalUsuarios} icon={<UserGroupIcon className="w-6 h-6" />} color="bg-blue-500" loading={loading} />
          <StatCard title="Total Canciones" value={stats.totalCanciones} icon={<MusicalNoteIcon className="w-6 h-6" />} color="bg-green-500" loading={loading} />
          <StatCard title="Artistas Verificados" value={stats.totalArtistas} icon={<CheckBadgeIcon className="w-6 h-6" />} color="bg-purple-500" loading={loading} />
          <StatCard title="Nuevos Usuarios Hoy" value={stats.nuevosUsuariosHoy} icon={<ArrowTrendingUpIcon className="w-6 h-6" />} color="bg-orange-500" loading={loading} />
        </div>

        {/* Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <AlertCard
            title="Contenido Pendiente"
            description={`${stats.cancionesPendientes} canciones esperan aprobación`}
            icon={<ClockIcon className="w-6 h-6" />}
            actionText="Revisar Contenido"
            actionLink="/admin/contenido"
            urgent={stats.cancionesPendientes > 10}
          /> */}
          {/* <AlertCard
            title="Reportes de Usuarios"
            description={`${stats.reportesPendientes} reportes requieren atención`}
            icon={<FlagIcon className="w-6 h-6" />}
            actionText="Ver Reportes"
            actionLink="/admin/moderacion"
            urgent={stats.reportesPendientes > 5}
          /> */}
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionButton title="Gestionar Usuarios" description="Ver, editar y administrar cuentas" icon={<UserIcon className="w-6 h-6" />} link="/admin/usuarios" />
            {/* <QuickActionButton title="Contenido Musical" description="Aprobar y gestionar música" icon={<MusicalNoteIcon className="w-6 h-6" />} link="/admin/biblioteca" /> */}
            <QuickActionButton title="Configuración" description="Ajustes del sistema" icon={<Cog6ToothIcon className="w-6 h-6" />} link="/admin/configuracion" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Componente de estadística
const StatCard = ({
  title,
  value,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`${color} text-white p-3 rounded-lg mr-4`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value.toLocaleString()}</p>
      </div>
    </div>
  </div>
);

// Componente de alerta
const AlertCard = ({
  title,
  description,
  icon,
  actionText,
  actionLink,
  urgent,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  actionLink: string;
  urgent: boolean;
}) => (
  <div className={`rounded-lg shadow p-6 ${urgent ? 'bg-red-50 border-l-4 border-red-500' : 'bg-white'}`}>
    <div className="flex items-start">
      <div className="mr-3 mt-1">{icon}</div>
      <div className="flex-1">
        <h4 className={`font-semibold ${urgent ? 'text-red-800' : 'text-gray-900'}`}>{title}</h4>
        <p className={`text-sm mt-1 ${urgent ? 'text-red-600' : 'text-gray-600'}`}>{description}</p>
        <a
          href={actionLink}
          className={`inline-block mt-3 px-4 py-2 rounded text-sm font-medium transition-colors ${
            urgent ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {actionText}
        </a>
      </div>
    </div>
  </div>
);

// Componente para acciones rápidas
const QuickActionButton = ({
  title,
  description,
  icon,
  link,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}) => (
  <a href={link} className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all">
    <div className="mb-2">{icon}</div>
    <h4 className="font-semibold text-gray-900">{title}</h4>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
  </a>
);
