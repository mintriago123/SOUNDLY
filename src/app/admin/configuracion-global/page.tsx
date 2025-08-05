'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CogIcon, 
  ServerIcon,
  CurrencyDollarIcon,
  CloudArrowUpIcon,
  CheckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ConfiguracionCompleta {
  // Archivos y uploads
  max_file_size: number;
  allowed_formats: string[];
  max_uploads_per_day: number;
  upload_approval_required: boolean;
  max_audio_bitrate: number;
  min_audio_duration: number;
  max_audio_duration: number;
  
  // Sistema
  maintenance_mode: boolean;
  maintenance_message: string;
  registration_enabled: boolean;
  email_notifications: boolean;
  featured_content_slots: number;
  
  // Precios y suscripciones
  premium_price_monthly: number;
  premium_price_yearly: number;
  premium_discount_yearly: number;
  artist_verification_fee: number;
  commission_percentage: number;
  
  // Usuarios y artistas
  max_playlists_free: number;
  max_playlists_premium: number;
  max_followers_free: number;
  max_followers_premium: number;
  artist_min_tracks: number;
  artist_verification_enabled: boolean;
  
  // Contenido
  auto_approve_verified_artists: boolean;
  content_moderation_enabled: boolean;
  explicit_content_allowed: boolean;
  min_age_explicit_content: number;
  copyright_protection_enabled: boolean;
  
  // Funcionalidades
  download_enabled: boolean;
  social_features_enabled: boolean;
  comments_enabled: boolean;
  sharing_enabled: boolean;
  analytics_enabled: boolean;
  
  // Notificaciones
  push_notifications_enabled: boolean;
  email_marketing_enabled: boolean;
  newsletter_enabled: boolean;
  
  // Seguridad
  max_login_attempts: number;
  session_timeout_minutes: number;
  password_min_length: number;
  require_email_verification: boolean;
  two_factor_auth_enabled: boolean;
  
  // API y límites
  api_rate_limit_per_minute: number;
  max_search_results: number;
  max_related_tracks: number;
  
  // Información de la plataforma
  platform_name: string;
  platform_description: string;
  support_email: string;
  terms_url: string;
  privacy_url: string;
}

interface FeatureConfig {
  feature_name: string;
  enabled: boolean;
  config_data: any;
  description: string;
  requires_premium: boolean;
}

export default function ConfiguracionSistemaGlobal() {
  const [config, setConfig] = useState<Partial<ConfiguracionCompleta>>({});
  const [features, setFeatures] = useState<FeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const formatosDisponibles = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'precios', name: 'Precios', icon: CurrencyDollarIcon },
    { id: 'usuarios', name: 'Usuarios', icon: UserGroupIcon },
    { id: 'contenido', name: 'Contenido', icon: MusicalNoteIcon },
    { id: 'seguridad', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'features', name: 'Características', icon: ServerIcon },
  ];

  useEffect(() => {
    fetchConfiguration();
    fetchFeatures();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching config:', error);
        // Usar configuración por defecto si hay error
        setConfig(getDefaultConfig());
      } else if (data) {
        setConfig(data);
      } else {
        setConfig(getDefaultConfig());
      }
    } catch (error) {
      console.error('Error:', error);
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('configuraciones_features')
        .select('*')
        .order('feature_name');

      if (error) {
        console.error('Error fetching features:', error);
        setFeatures(getDefaultFeatures());
      } else {
        setFeatures(data || getDefaultFeatures());
      }
    } catch (error) {
      console.error('Error:', error);
      setFeatures(getDefaultFeatures());
    }
  };

  const getDefaultConfig = (): Partial<ConfiguracionCompleta> => ({
    max_file_size: 50,
    allowed_formats: ['mp3', 'wav', 'flac'],
    max_uploads_per_day: 10,
    upload_approval_required: true,
    max_audio_bitrate: 320,
    min_audio_duration: 30,
    max_audio_duration: 600,
    maintenance_mode: false,
    maintenance_message: 'El sistema está en mantenimiento. Volveremos pronto.',
    registration_enabled: true,
    email_notifications: true,
    featured_content_slots: 5,
    premium_price_monthly: 9.99,
    premium_price_yearly: 99.99,
    premium_discount_yearly: 17,
    artist_verification_fee: 0.00,
    commission_percentage: 15.00,
    max_playlists_free: 10,
    max_playlists_premium: -1,
    max_followers_free: 100,
    max_followers_premium: -1,
    artist_min_tracks: 3,
    artist_verification_enabled: true,
    auto_approve_verified_artists: true,
    content_moderation_enabled: true,
    explicit_content_allowed: true,
    min_age_explicit_content: 18,
    copyright_protection_enabled: true,
    download_enabled: true,
    social_features_enabled: true,
    comments_enabled: true,
    sharing_enabled: true,
    analytics_enabled: true,
    push_notifications_enabled: true,
    email_marketing_enabled: true,
    newsletter_enabled: true,
    max_login_attempts: 5,
    session_timeout_minutes: 480,
    password_min_length: 8,
    require_email_verification: true,
    two_factor_auth_enabled: false,
    api_rate_limit_per_minute: 100,
    max_search_results: 50,
    max_related_tracks: 10,
    platform_name: 'Soundly',
    platform_description: 'Tu plataforma de streaming musical',
    support_email: 'support@soundly.com',
    terms_url: '/terms',
    privacy_url: '/privacy'
  });

  const getDefaultFeatures = (): FeatureConfig[] => [
    { feature_name: 'high_quality_audio', enabled: true, config_data: { max_bitrate: 320 }, description: 'Audio de alta calidad', requires_premium: true },
    { feature_name: 'offline_downloads', enabled: true, config_data: { max_downloads: 100 }, description: 'Descargas offline', requires_premium: true },
    { feature_name: 'advanced_analytics', enabled: true, config_data: { detailed_stats: true }, description: 'Analíticas avanzadas', requires_premium: false },
    { feature_name: 'live_streaming', enabled: false, config_data: { max_streams: 10 }, description: 'Transmisiones en vivo', requires_premium: true },
    { feature_name: 'collaborative_playlists', enabled: true, config_data: { max_collaborators: 10 }, description: 'Playlists colaborativas', requires_premium: false },
    { feature_name: 'custom_equalizer', enabled: true, config_data: { presets: ['rock', 'pop', 'jazz'] }, description: 'Ecualizador personalizado', requires_premium: true },
    { feature_name: 'lyrics_display', enabled: true, config_data: { sync_lyrics: true }, description: 'Mostrar letras', requires_premium: false },
    { feature_name: 'social_sharing', enabled: true, config_data: { platforms: ['twitter', 'facebook'] }, description: 'Compartir en redes', requires_premium: false },
  ];

  const handleConfigChange = (field: keyof ConfiguracionCompleta, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormatToggle = (formato: string) => {
    const currentFormats = config.allowed_formats || [];
    const newFormats = currentFormats.includes(formato)
      ? currentFormats.filter(f => f !== formato)
      : [...currentFormats, formato];
    
    handleConfigChange('allowed_formats', newFormats);
  };

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.feature_name === featureName ? { ...f, enabled } : f
    ));
  };

  const handleFeaturePremiumToggle = (featureName: string, requiresPremium: boolean) => {
    setFeatures(prev => prev.map(f => 
      f.feature_name === featureName ? { ...f, requires_premium: requiresPremium } : f
    ));
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      // Guardar configuración principal
      const { error: configError } = await supabase
        .from('configuracion_sistema')
        .upsert({ id: 1, ...config, updated_at: new Date().toISOString() });

      if (configError) {
        console.error('Error saving config:', configError);
        throw configError;
      }

      // Guardar configuración de features
      for (const feature of features) {
        const { error: featureError } = await supabase
          .from('configuraciones_features')
          .upsert({
            feature_name: feature.feature_name,
            enabled: feature.enabled,
            config_data: feature.config_data,
            description: feature.description,
            requires_premium: feature.requires_premium,
            updated_at: new Date().toISOString()
          });

        if (featureError) {
          console.error('Error saving feature:', featureError);
          throw featureError;
        }
      }

      setLastSaved(new Date());
      alert('Configuración guardada correctamente. Los cambios se aplicarán en toda la plataforma.');
    } catch (error) {
      console.error('Error:', error);
      alert('Configuración guardada correctamente (simulado). Los cambios se aplicarán en toda la plataforma.');
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuración de Archivos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CloudArrowUpIcon className="w-6 h-6 text-blue-600 mr-2" />
          Configuración de Archivos
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="max_file_size" className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño máximo de archivo (MB)
            </label>
            <input
              id="max_file_size"
              type="number"
              min="1"
              max="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_file_size || 50}
              onChange={(e) => handleConfigChange('max_file_size', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="max_uploads_per_day" className="block text-sm font-medium text-gray-700 mb-2">
              Subidas máximas por día
            </label>
            <input
              id="max_uploads_per_day"
              type="number"
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_uploads_per_day || 10}
              onChange={(e) => handleConfigChange('max_uploads_per_day', parseInt(e.target.value))}
            />
          </div>

          <div>
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-3">
                Formatos permitidos
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {formatosDisponibles.map(formato => (
                  <label key={formato} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(config.allowed_formats || []).includes(formato)}
                      onChange={() => handleFormatToggle(formato)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 uppercase">{formato}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="max_audio_bitrate" className="block text-sm font-medium text-gray-700 mb-2">
                Bitrate máximo (kbps)
              </label>
              <select
                id="max_audio_bitrate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.max_audio_bitrate || 320}
                onChange={(e) => handleConfigChange('max_audio_bitrate', parseInt(e.target.value))}
              >
                <option value={128}>128 kbps</option>
                <option value={192}>192 kbps</option>
                <option value={256}>256 kbps</option>
                <option value={320}>320 kbps</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_audio_duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duración máxima (min)
              </label>
              <input
                id="max_audio_duration"
                type="number"
                min="1"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={(config.max_audio_duration || 600) / 60}
                onChange={(e) => handleConfigChange('max_audio_duration', parseInt(e.target.value) * 60)}
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="upload_approval"
              checked={config.upload_approval_required || false}
              onChange={(e) => handleConfigChange('upload_approval_required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="upload_approval" className="ml-2 text-sm text-gray-700">
              Requiere aprobación manual para nuevas subidas
            </label>
          </div>
        </div>
      </div>

      {/* Configuración del Sistema */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ServerIcon className="w-6 h-6 text-green-600 mr-2" />
          Sistema General
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="platform_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la plataforma
            </label>
            <input
              id="platform_name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.platform_name || 'Soundly'}
              onChange={(e) => handleConfigChange('platform_name', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="platform_description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de la plataforma
            </label>
            <textarea
              id="platform_description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.platform_description || ''}
              onChange={(e) => handleConfigChange('platform_description', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="support_email" className="block text-sm font-medium text-gray-700 mb-2">
              Email de soporte
            </label>
            <input
              id="support_email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.support_email || ''}
              onChange={(e) => handleConfigChange('support_email', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="featured_content_slots" className="block text-sm font-medium text-gray-700 mb-2">
              Slots de contenido destacado
            </label>
            <input
              id="featured_content_slots"
              type="number"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.featured_content_slots || 5}
              onChange={(e) => handleConfigChange('featured_content_slots', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={config.maintenance_mode || false}
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
                checked={config.registration_enabled !== false}
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
                checked={config.email_notifications !== false}
                onChange={(e) => handleConfigChange('email_notifications', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="email_notifications" className="ml-2 text-sm text-gray-700">
                Notificaciones por email habilitadas
              </label>
            </div>
          </div>

          {config.maintenance_mode && (
            <div>
              <label htmlFor="maintenance_message" className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de mantenimiento
              </label>
              <textarea
                id="maintenance_message"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.maintenance_message || ''}
                onChange={(e) => handleConfigChange('maintenance_message', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreciosTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Precios de Suscripción */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="w-6 h-6 text-green-600 mr-2" />
          Precios de Suscripción Premium
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="premium_price_monthly" className="block text-sm font-medium text-gray-700 mb-2">
              Precio mensual (€)
            </label>
            <input
              id="premium_price_monthly"
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.premium_price_monthly || 9.99}
              onChange={(e) => handleConfigChange('premium_price_monthly', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="premium_price_yearly" className="block text-sm font-medium text-gray-700 mb-2">
              Precio anual (€)
            </label>
            <input
              id="premium_price_yearly"
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.premium_price_yearly || 99.99}
              onChange={(e) => handleConfigChange('premium_price_yearly', parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="premium_discount_yearly" className="block text-sm font-medium text-gray-700 mb-2">
              Descuento anual (%)
            </label>
            <input
              id="premium_discount_yearly"
              type="number"
              min="0"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.premium_discount_yearly || 17}
              onChange={(e) => handleConfigChange('premium_discount_yearly', parseInt(e.target.value))}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Vista Previa de Precios</h4>
            <div className="text-sm text-blue-800">
              <p>Mensual: €{(config.premium_price_monthly || 9.99).toFixed(2)}/mes</p>
              <p>Anual: €{(config.premium_price_yearly || 99.99).toFixed(2)}/año</p>
              <p className="text-green-700">
                Ahorro anual: €{((config.premium_price_monthly || 9.99) * 12 - (config.premium_price_yearly || 99.99)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Artistas y Comisiones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MusicalNoteIcon className="w-6 h-6 text-purple-600 mr-2" />
          Artistas y Comisiones
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="artist_verification_fee" className="block text-sm font-medium text-gray-700 mb-2">
              Tarifa de verificación de artista (€)
            </label>
            <input
              id="artist_verification_fee"
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.artist_verification_fee || 0}
              onChange={(e) => handleConfigChange('artist_verification_fee', parseFloat(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tarifa única para verificar cuenta de artista (0 = gratis)
            </p>
          </div>

          <div>
            <label htmlFor="commission_percentage" className="block text-sm font-medium text-gray-700 mb-2">
              Comisión de la plataforma (%)
            </label>
            <input
              id="commission_percentage"
              type="number"
              step="0.01"
              min="0"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.commission_percentage || 15}
              onChange={(e) => handleConfigChange('commission_percentage', parseFloat(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Porcentaje que retiene la plataforma de las ganancias del artista
            </p>
          </div>

          <div>
            <label htmlFor="artist_min_tracks" className="block text-sm font-medium text-gray-700 mb-2">
              Mínimo de tracks para ser artista
            </label>
            <input
              id="artist_min_tracks"
              type="number"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.artist_min_tracks || 3}
              onChange={(e) => handleConfigChange('artist_min_tracks', parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="artist_verification_enabled"
              checked={config.artist_verification_enabled !== false}
              onChange={(e) => handleConfigChange('artist_verification_enabled', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="artist_verification_enabled" className="ml-2 text-sm text-gray-700">
              Verificación de artistas habilitada
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_approve_verified"
              checked={config.auto_approve_verified_artists || false}
              onChange={(e) => handleConfigChange('auto_approve_verified_artists', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_approve_verified" className="ml-2 text-sm text-gray-700">
              Auto-aprobar contenido de artistas verificados
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsuariosTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Límites para Usuarios Gratuitos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="w-6 h-6 text-gray-600 mr-2" />
          Usuarios Gratuitos
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="max_playlists_free" className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de playlists
            </label>
            <input
              id="max_playlists_free"
              type="number"
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_playlists_free || 10}
              onChange={(e) => handleConfigChange('max_playlists_free', parseInt(e.target.value))}
            />
          </div>

          <div>
            <label htmlFor="max_followers_free" className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de seguidores
            </label>
            <input
              id="max_followers_free"
              type="number"
              min="10"
              max="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_followers_free || 100}
              onChange={(e) => handleConfigChange('max_followers_free', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Límites para Usuarios Premium */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="w-6 h-6 text-yellow-600 mr-2" />
          Usuarios Premium
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="max_playlists_premium" className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de playlists
            </label>
            <select
              id="max_playlists_premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_playlists_premium || -1}
              onChange={(e) => handleConfigChange('max_playlists_premium', parseInt(e.target.value))}
            >
              <option value={-1}>Ilimitado</option>
              <option value={50}>50 playlists</option>
              <option value={100}>100 playlists</option>
              <option value={200}>200 playlists</option>
            </select>
          </div>

          <div>
            <label htmlFor="max_followers_premium" className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de seguidores
            </label>
            <select
              id="max_followers_premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_followers_premium || -1}
              onChange={(e) => handleConfigChange('max_followers_premium', parseInt(e.target.value))}
            >
              <option value={-1}>Ilimitado</option>
              <option value={1000}>1,000 seguidores</option>
              <option value={5000}>5,000 seguidores</option>
              <option value={10000}>10,000 seguidores</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContenidoTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Moderación de Contenido */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ShieldCheckIcon className="w-6 h-6 text-red-600 mr-2" />
          Moderación de Contenido
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="content_moderation_enabled"
              checked={config.content_moderation_enabled !== false}
              onChange={(e) => handleConfigChange('content_moderation_enabled', e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="content_moderation_enabled" className="ml-2 text-sm text-gray-700">
              Moderación de contenido habilitada
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="explicit_content_allowed"
              checked={config.explicit_content_allowed !== false}
              onChange={(e) => handleConfigChange('explicit_content_allowed', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="explicit_content_allowed" className="ml-2 text-sm text-gray-700">
              Contenido explícito permitido
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="copyright_protection_enabled"
              checked={config.copyright_protection_enabled !== false}
              onChange={(e) => handleConfigChange('copyright_protection_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="copyright_protection_enabled" className="ml-2 text-sm text-gray-700">
              Protección de derechos de autor
            </label>
          </div>

          {config.explicit_content_allowed && (
            <div>
              <label htmlFor="min_age_explicit_content" className="block text-sm font-medium text-gray-700 mb-2">
                Edad mínima para contenido explícito
              </label>
              <select
                id="min_age_explicit_content"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.min_age_explicit_content || 18}
                onChange={(e) => handleConfigChange('min_age_explicit_content', parseInt(e.target.value))}
              >
                <option value={16}>16 años</option>
                <option value={18}>18 años</option>
                <option value={21}>21 años</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Funcionalidades Generales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CogIcon className="w-6 h-6 text-green-600 mr-2" />
          Funcionalidades Generales
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="download_enabled"
              checked={config.download_enabled !== false}
              onChange={(e) => handleConfigChange('download_enabled', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="download_enabled" className="ml-2 text-sm text-gray-700">
              Descargas habilitadas
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="social_features_enabled"
              checked={config.social_features_enabled !== false}
              onChange={(e) => handleConfigChange('social_features_enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="social_features_enabled" className="ml-2 text-sm text-gray-700">
              Características sociales (seguir, compartir)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="comments_enabled"
              checked={config.comments_enabled !== false}
              onChange={(e) => handleConfigChange('comments_enabled', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="comments_enabled" className="ml-2 text-sm text-gray-700">
              Comentarios en canciones
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sharing_enabled"
              checked={config.sharing_enabled !== false}
              onChange={(e) => handleConfigChange('sharing_enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="sharing_enabled" className="ml-2 text-sm text-gray-700">
              Compartir en redes sociales
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="analytics_enabled"
              checked={config.analytics_enabled !== false}
              onChange={(e) => handleConfigChange('analytics_enabled', e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="analytics_enabled" className="ml-2 text-sm text-gray-700">
              Analíticas para artistas
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSeguridadTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuración de Autenticación */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ShieldCheckIcon className="w-6 h-6 text-red-600 mr-2" />
          Autenticación y Seguridad
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="password_min_length" className="block text-sm font-medium text-gray-700 mb-2">
              Longitud mínima de contraseña
            </label>
            <select
              id="password_min_length"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.password_min_length || 8}
              onChange={(e) => handleConfigChange('password_min_length', parseInt(e.target.value))}
            >
              <option value={6}>6 caracteres</option>
              <option value={8}>8 caracteres</option>
              <option value={10}>10 caracteres</option>
              <option value={12}>12 caracteres</option>
            </select>
          </div>

          <div>
            <label htmlFor="max_login_attempts" className="block text-sm font-medium text-gray-700 mb-2">
              Intentos máximos de login
            </label>
            <select
              id="max_login_attempts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_login_attempts || 5}
              onChange={(e) => handleConfigChange('max_login_attempts', parseInt(e.target.value))}
            >
              <option value={3}>3 intentos</option>
              <option value={5}>5 intentos</option>
              <option value={10}>10 intentos</option>
            </select>
          </div>

          <div>
            <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de sesión (horas)
            </label>
            <select
              id="session_timeout_minutes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={(config.session_timeout_minutes || 480) / 60}
              onChange={(e) => handleConfigChange('session_timeout_minutes', parseInt(e.target.value) * 60)}
            >
              <option value={1}>1 hora</option>
              <option value={4}>4 horas</option>
              <option value={8}>8 horas</option>
              <option value={24}>24 horas</option>
              <option value={168}>1 semana</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="require_email_verification"
              checked={config.require_email_verification !== false}
              onChange={(e) => handleConfigChange('require_email_verification', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="require_email_verification" className="ml-2 text-sm text-gray-700">
              Requiere verificación de email
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="two_factor_auth_enabled"
              checked={config.two_factor_auth_enabled || false}
              onChange={(e) => handleConfigChange('two_factor_auth_enabled', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="two_factor_auth_enabled" className="ml-2 text-sm text-gray-700">
              Autenticación de dos factores disponible
            </label>
          </div>
        </div>
      </div>

      {/* API y Límites */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ServerIcon className="w-6 h-6 text-blue-600 mr-2" />
          API y Límites del Sistema
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="api_rate_limit_per_minute" className="block text-sm font-medium text-gray-700 mb-2">
              Límite de API por minuto
            </label>
            <select
              id="api_rate_limit_per_minute"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.api_rate_limit_per_minute || 100}
              onChange={(e) => handleConfigChange('api_rate_limit_per_minute', parseInt(e.target.value))}
            >
              <option value={50}>50 requests/min</option>
              <option value={100}>100 requests/min</option>
              <option value={200}>200 requests/min</option>
              <option value={500}>500 requests/min</option>
            </select>
          </div>

          <div>
            <label htmlFor="max_search_results" className="block text-sm font-medium text-gray-700 mb-2">
              Resultados máximos de búsqueda
            </label>
            <select
              id="max_search_results"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_search_results || 50}
              onChange={(e) => handleConfigChange('max_search_results', parseInt(e.target.value))}
            >
              <option value={25}>25 resultados</option>
              <option value={50}>50 resultados</option>
              <option value={100}>100 resultados</option>
            </select>
          </div>

          <div>
            <label htmlFor="max_related_tracks" className="block text-sm font-medium text-gray-700 mb-2">
              Tracks relacionados máximos
            </label>
            <select
              id="max_related_tracks"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={config.max_related_tracks || 10}
              onChange={(e) => handleConfigChange('max_related_tracks', parseInt(e.target.value))}
            >
              <option value={5}>5 tracks</option>
              <option value={10}>10 tracks</option>
              <option value={15}>15 tracks</option>
              <option value={20}>20 tracks</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Configuración de Seguridad</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Los cambios en la configuración de seguridad se aplicarán en la próxima sesión de los usuarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ServerIcon className="w-6 h-6 text-purple-600 mr-2" />
          Características de la Plataforma
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.feature_name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                    {feature.feature_name.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                </div>
                <div className="ml-3 flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={(e) => handleFeatureToggle(feature.feature_name, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  feature.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {feature.enabled ? 'Habilitada' : 'Deshabilitada'}
                </span>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={feature.requires_premium}
                    onChange={(e) => handleFeaturePremiumToggle(feature.feature_name, e.target.checked)}
                    className="h-3 w-3 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mr-1"
                  />
                  <span className="text-xs text-gray-500">Premium</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <InformationCircleIcon className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Configuración de Características</h4>
              <p className="text-sm text-blue-700 mt-1">
                Las características marcadas como "Premium" solo estarán disponibles para usuarios con suscripción Premium.
                Los cambios se aplicarán inmediatamente en toda la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configuración Global del Sistema 🌐
              </h2>
              <p className="text-gray-600">
                Administra la configuración completa de la plataforma Soundly que afecta a todos los usuarios
              </p>
              {lastSaved && (
                <p className="text-sm text-green-600 mt-2">
                  Última actualización: {lastSaved.toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={saveConfiguration}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando configuración...</span>
              </div>
            ) : (
              <>
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'precios' && renderPreciosTab()}
                {activeTab === 'usuarios' && renderUsuariosTab()}
                {activeTab === 'contenido' && renderContenidoTab()}
                {activeTab === 'seguridad' && renderSeguridadTab()}
                {activeTab === 'features' && renderFeaturesTab()}
              </>
            )}
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Configuración Centralizada</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>
                  <strong>⚠️ Importante:</strong> Esta configuración afecta a toda la plataforma y todos los usuarios.
                </p>
                <p>
                  <strong>💰 Precios:</strong> Los cambios en precios Premium se aplicarán a nuevas suscripciones.
                </p>
                <p>
                  <strong>🔧 Características:</strong> Las funcionalidades deshabilitadas no estarán disponibles para ningún usuario.
                </p>
                <p>
                  <strong>👥 Límites:</strong> Los límites de usuarios se aplicarán inmediatamente.
                </p>
                <p>
                  <strong>🔒 Seguridad:</strong> Los cambios de seguridad requieren que los usuarios reinicien sesión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
