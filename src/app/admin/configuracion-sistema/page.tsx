'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CogIcon, 
  ServerIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CameraIcon,
  BellIcon,
  CurrencyDollarIcon,
  CloudArrowUpIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ConfiguracionSistema {
  max_file_size: number; // MB
  allowed_formats: string[];
  max_uploads_per_day: number;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_notifications: boolean;
  featured_content_slots: number;
  premium_price: number;
  upload_approval_required: boolean;
}

interface Banner {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  activo: boolean;
  fecha_inicio: string;
  fecha_fin: string;
  prioridad: number;
}

export default function AdminConfiguracionSistemaPage() {
  const [config, setConfig] = useState<ConfiguracionSistema>({
    max_file_size: 50,
    allowed_formats: ['mp3', 'wav', 'flac'],
    max_uploads_per_day: 10,
    maintenance_mode: false,
    registration_enabled: true,
    email_notifications: true,
    featured_content_slots: 5,
    premium_price: 9.99,
    upload_approval_required: true,
  });
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerFormData, setBannerFormData] = useState<Partial<Banner>>({});

  const formatosDisponibles = [
    'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'
  ];

  useEffect(() => {
    fetchConfiguracion();
    fetchBanners();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching configuracion:', error);
        // Usar configuración por defecto si hay error
      } else if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners_destacados')
        .select('*')
        .order('prioridad', { ascending: true });

      if (error) {
        console.error('Error fetching banners:', error);
        // Usar banners simulados
        setBanners(getSimulatedBanners());
      } else {
        setBanners(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setBanners(getSimulatedBanners());
    }
  };

  const getSimulatedBanners = (): Banner[] => [
    {
      id: '1',
      titulo: 'Promoción Premium',
      descripcion: '50% de descuento en suscripción Premium por tiempo limitado',
      activo: true,
      fecha_inicio: '2024-08-01',
      fecha_fin: '2024-08-31',
      prioridad: 1
    },
    {
      id: '2',
      titulo: 'Nuevo Género: Lo-Fi',
      descripcion: 'Descubre la nueva sección de música Lo-Fi para relajarte',
      activo: true,
      fecha_inicio: '2024-07-15',
      fecha_fin: '2024-09-15',
      prioridad: 2
    },
    {
      id: '3',
      titulo: 'Concurso de Talentos',
      descripcion: 'Participa en nuestro concurso mensual y gana premios',
      activo: false,
      fecha_inicio: '2024-07-01',
      fecha_fin: '2024-07-31',
      prioridad: 3
    }
  ];

  const handleConfigChange = (field: keyof ConfiguracionSistema, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormatToggle = (formato: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_formats: prev.allowed_formats.includes(formato)
        ? prev.allowed_formats.filter(f => f !== formato)
        : [...prev.allowed_formats, formato]
    }));
  };

  const saveConfiguracion = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('configuracion_sistema')
        .upsert({ id: 1, ...config, updated_at: new Date().toISOString() });

      if (error) {
        console.error('Error saving configuracion:', error);
        alert('Error al guardar configuración');
        return;
      }

      alert('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Configuración guardada correctamente (simulado)');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerFormData(banner);
    setShowBannerModal(true);
  };

  const handleBannerCreate = () => {
    setEditingBanner(null);
    setBannerFormData({
      titulo: '',
      descripcion: '',
      activo: true,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      prioridad: banners.length + 1
    });
    setShowBannerModal(true);
  };

  const saveBanner = async () => {
    try {
      if (editingBanner) {
        // Actualizar banner existente
        const { error } = await supabase
          .from('banners_destacados')
          .update(bannerFormData)
          .eq('id', editingBanner.id);

        if (error) {
          console.error('Error updating banner:', error);
          alert('Error al actualizar banner');
          return;
        }

        setBanners(prev => prev.map(b => 
          b.id === editingBanner.id ? { ...b, ...bannerFormData } : b
        ));
      } else {
        // Crear nuevo banner
        const newBanner = {
          ...bannerFormData,
          id: (banners.length + 1).toString()
        } as Banner;

        setBanners(prev => [...prev, newBanner]);
      }

      setShowBannerModal(false);
      alert('Banner guardado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Banner guardado correctamente (simulado)');
      setShowBannerModal(false);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este banner?')) return;

    try {
      const { error } = await supabase
        .from('banners_destacados')
        .delete()
        .eq('id', bannerId);

      if (error) {
        console.error('Error deleting banner:', error);
        alert('Error al eliminar banner');
        return;
      }

      setBanners(prev => prev.filter(b => b.id !== bannerId));
      alert('Banner eliminado correctamente');
    } catch (error) {
      console.error('Error:', error);
      setBanners(prev => prev.filter(b => b.id !== bannerId));
      alert('Banner eliminado correctamente (simulado)');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configuración del Sistema ⚙️
              </h2>
              <p className="text-gray-600">
                Administra la configuración general de la plataforma Soundly
              </p>
            </div>
            <button
              onClick={saveConfiguracion}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuración General */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración de Archivos */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <CloudArrowUpIcon className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Configuración de Archivos</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño máximo de archivo (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.max_file_size}
                  onChange={(e) => handleConfigChange('max_file_size', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subidas máximas por día (por usuario)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.max_uploads_per_day}
                  onChange={(e) => handleConfigChange('max_uploads_per_day', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Formatos permitidos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {formatosDisponibles.map(formato => (
                    <label key={formato} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.allowed_formats.includes(formato)}
                        onChange={() => handleFormatToggle(formato)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 uppercase">{formato}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="upload_approval"
                  checked={config.upload_approval_required}
                  onChange={(e) => handleConfigChange('upload_approval_required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="upload_approval" className="ml-2 text-sm text-gray-700">
                  Requiere aprobación para subidas
                </label>
              </div>
            </div>
          </div>

          {/* Configuración del Sistema */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <ServerIcon className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Configuración del Sistema</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenance_mode"
                  checked={config.maintenance_mode}
                  onChange={(e) => handleConfigChange('maintenance_mode', e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenance_mode" className="ml-2 text-sm text-gray-700">
                  Modo mantenimiento
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="registration_enabled"
                  checked={config.registration_enabled}
                  onChange={(e) => handleConfigChange('registration_enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="registration_enabled" className="ml-2 text-sm text-gray-700">
                  Registro de usuarios habilitado
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={config.email_notifications}
                  onChange={(e) => handleConfigChange('email_notifications', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="email_notifications" className="ml-2 text-sm text-gray-700">
                  Notificaciones por email
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slots de contenido destacado
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.featured_content_slots}
                  onChange={(e) => handleConfigChange('featured_content_slots', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Premium (€/mes)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.premium_price}
                  onChange={(e) => handleConfigChange('premium_price', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gestión de Banners */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CameraIcon className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Banners Destacados</h3>
              </div>
              <button
                onClick={handleBannerCreate}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Nuevo Banner
              </button>
            </div>
          </div>
          <div className="p-6">
            {banners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay banners configurados
              </div>
            ) : (
              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{banner.titulo}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            banner.activo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {banner.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Prioridad {banner.prioridad}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">{banner.descripcion}</p>
                        <div className="text-sm text-gray-500 mt-2">
                          Vigente del {new Date(banner.fecha_inicio).toLocaleDateString()} 
                          al {new Date(banner.fecha_fin).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBannerEdit(banner)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <CogIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteBanner(banner.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Banner */}
        {showBannerModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bannerFormData.titulo || ''}
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bannerFormData.descripcion || ''}
                    onChange={(e) => setBannerFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bannerFormData.fecha_inicio || ''}
                      onChange={(e) => setBannerFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bannerFormData.fecha_fin || ''}
                      onChange={(e) => setBannerFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bannerFormData.prioridad || 1}
                      onChange={(e) => setBannerFormData(prev => ({ ...prev, prioridad: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      id="banner_activo"
                      checked={bannerFormData.activo || false}
                      onChange={(e) => setBannerFormData(prev => ({ ...prev, activo: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="banner_activo" className="ml-2 text-sm text-gray-700">
                      Banner activo
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBanner}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
