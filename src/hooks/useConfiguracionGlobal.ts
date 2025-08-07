'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseCLient';

export interface ConfiguracionGlobal {
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

export interface FeatureConfig {
  feature_name: string;
  enabled: boolean;
  config_data: any;
  description: string;
  requires_premium: boolean;
}

const defaultConfig: ConfiguracionGlobal = {
  // Archivos y uploads
  max_file_size: 50,
  allowed_formats: ['mp3', 'wav', 'flac'],
  max_uploads_per_day: 10,
  upload_approval_required: true,
  max_audio_bitrate: 320,
  min_audio_duration: 30,
  max_audio_duration: 600,
  
  // Sistema
  maintenance_mode: false,
  maintenance_message: 'El sistema está en mantenimiento. Volveremos pronto.',
  registration_enabled: true,
  email_notifications: true,
  featured_content_slots: 5,
  
  // Precios y suscripciones
  premium_price_monthly: 9.99,
  premium_price_yearly: 99.99,
  premium_discount_yearly: 17,
  artist_verification_fee: 0.00,
  commission_percentage: 15.00,
  
  // Usuarios y artistas
  max_playlists_free: 10,
  max_playlists_premium: -1,
  max_followers_free: 100,
  max_followers_premium: -1,
  artist_min_tracks: 3,
  artist_verification_enabled: true,
  
  // Contenido
  auto_approve_verified_artists: true,
  content_moderation_enabled: true,
  explicit_content_allowed: true,
  min_age_explicit_content: 18,
  copyright_protection_enabled: true,
  
  // Funcionalidades
  download_enabled: true,
  social_features_enabled: true,
  comments_enabled: true,
  sharing_enabled: true,
  analytics_enabled: true,
  
  // Notificaciones
  push_notifications_enabled: true,
  email_marketing_enabled: true,
  newsletter_enabled: true,
  
  // Seguridad
  max_login_attempts: 5,
  session_timeout_minutes: 480,
  password_min_length: 8,
  require_email_verification: true,
  two_factor_auth_enabled: false,
  
  // API y límites
  api_rate_limit_per_minute: 100,
  max_search_results: 50,
  max_related_tracks: 10,
  
  // Información de la plataforma
  platform_name: 'Soundly',
  platform_description: 'Tu plataforma de streaming musical',
  support_email: 'support@soundly.com',
  terms_url: '/terms',
  privacy_url: '/privacy'
};

const defaultFeatures: FeatureConfig[] = [
  { 
    feature_name: 'high_quality_audio', 
    enabled: true, 
    config_data: { max_bitrate: 320 }, 
    description: 'Audio de alta calidad', 
    requires_premium: true 
  },
  { 
    feature_name: 'offline_downloads', 
    enabled: true, 
    config_data: { max_downloads: 100 }, 
    description: 'Descargas offline', 
    requires_premium: true 
  },
  { 
    feature_name: 'advanced_analytics', 
    enabled: true, 
    config_data: { detailed_stats: true }, 
    description: 'Analíticas avanzadas', 
    requires_premium: false 
  },
  { 
    feature_name: 'live_streaming', 
    enabled: false, 
    config_data: { max_streams: 10 }, 
    description: 'Transmisiones en vivo', 
    requires_premium: true 
  },
  { 
    feature_name: 'collaborative_playlists', 
    enabled: true, 
    config_data: { max_collaborators: 10 }, 
    description: 'Playlists colaborativas', 
    requires_premium: false 
  },
  { 
    feature_name: 'custom_equalizer', 
    enabled: true, 
    config_data: { presets: ['rock', 'pop', 'jazz'] }, 
    description: 'Ecualizador personalizado', 
    requires_premium: true 
  },
  { 
    feature_name: 'lyrics_display', 
    enabled: true, 
    config_data: { sync_lyrics: true }, 
    description: 'Mostrar letras', 
    requires_premium: false 
  },
  { 
    feature_name: 'social_sharing', 
    enabled: true, 
    config_data: { platforms: ['twitter', 'facebook'] }, 
    description: 'Compartir en redes', 
    requires_premium: false 
  }
];

export function useConfiguracionGlobal() {
  const [config, setConfig] = useState<ConfiguracionGlobal>(defaultConfig);
  const [features, setFeatures] = useState<FeatureConfig[]>(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener configuración principal usando la función SQL
      const { data: configData, error: configError } = await supabase
        .rpc('get_system_config');

      if (configError) {
        console.warn('Error fetching config via RPC, using default:', configError);
        // Fallback: usar tabla directamente
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('configuracion_sistema')
          .select('*')
          .eq('id', 1)
          .single();

        if (fallbackError) {
          console.warn('Error fetching fallback config:', fallbackError);
          setConfig(defaultConfig);
        } else {
          setConfig({ ...defaultConfig, ...fallbackData });
        }
      } else {
        setConfig({ ...defaultConfig, ...configData });
      }

      // Obtener configuración de features
      const { data: featuresData, error: featuresError } = await supabase
        .from('configuraciones_features')
        .select('*')
        .order('feature_name');

      if (featuresError) {
        console.warn('Error fetching features:', featuresError);
        setFeatures(defaultFeatures);
      } else {
        setFeatures(featuresData || defaultFeatures);
      }

    } catch (err) {
      console.error('Error in fetchConfig:', err);
      setError('Error al cargar la configuración');
      setConfig(defaultConfig);
      setFeatures(defaultFeatures);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<ConfiguracionGlobal>) => {
    try {
      setError(null);
      
      // Actualizar configuración usando la función SQL
      const { error: updateError } = await supabase
        .rpc('update_system_config', { config_updates: newConfig });

      if (updateError) {
        console.warn('Error updating config via RPC, using fallback:', updateError);
        // Fallback: actualizar tabla directamente
        const { error: fallbackError } = await supabase
          .from('configuracion_sistema')
          .upsert({ 
            id: 1, 
            ...config, 
            ...newConfig, 
            updated_at: new Date().toISOString() 
          });

        if (fallbackError) {
          throw fallbackError;
        }
      }

      setConfig(prev => ({ ...prev, ...newConfig }));
      return true;
    } catch (err) {
      console.error('Error updating config:', err);
      setError('Error al actualizar la configuración');
      return false;
    }
  }, [config]);

  const updateFeature = useCallback(async (featureName: string, updates: Partial<FeatureConfig>) => {
    try {
      setError(null);
      
      const feature = features.find(f => f.feature_name === featureName);
      if (!feature) {
        throw new Error(`Feature ${featureName} not found`);
      }

      const updatedFeature = { ...feature, ...updates };

      const { error } = await supabase
        .from('configuraciones_features')
        .upsert({
          ...updatedFeature,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setFeatures(prev => prev.map(f => 
        f.feature_name === featureName ? updatedFeature : f
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating feature:', err);
      setError('Error al actualizar la característica');
      return false;
    }
  }, [features]);

  const getFeatureConfig = useCallback((featureName: string) => {
    return features.find(f => f.feature_name === featureName);
  }, [features]);

  const isFeatureEnabled = useCallback((featureName: string) => {
    const feature = getFeatureConfig(featureName);
    return feature?.enabled || false;
  }, [getFeatureConfig]);

  const isFeaturePremium = useCallback((featureName: string) => {
    const feature = getFeatureConfig(featureName);
    return feature?.requires_premium || false;
  }, [getFeatureConfig]);

  const getPremiumPricing = useCallback(() => {
    const monthlyPrice = config.premium_price_monthly;
    const yearlyPrice = config.premium_price_yearly;
    const discount = config.premium_discount_yearly;
    
    const yearlyEquivalent = monthlyPrice * 12;
    const savings = yearlyEquivalent - yearlyPrice;
    const actualDiscount = (savings / yearlyEquivalent) * 100;

    return {
      monthly: monthlyPrice,
      yearly: yearlyPrice,
      discount: discount,
      actualDiscount: Math.round(actualDiscount),
      savings: savings,
      yearlyEquivalent
    };
  }, [config.premium_price_monthly, config.premium_price_yearly, config.premium_discount_yearly]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    features,
    loading,
    error,
    updateConfig,
    updateFeature,
    getFeatureConfig,
    isFeatureEnabled,
    isFeaturePremium,
    getPremiumPricing,
    refreshConfig: fetchConfig
  };
}

// Hook para verificar si una característica está disponible para un usuario
export function useFeatureAccess() {
  const { isFeatureEnabled, isFeaturePremium } = useConfiguracionGlobal();

  const canAccessFeature = useCallback((featureName: string, userIsPremium: boolean = false) => {
    if (!isFeatureEnabled(featureName)) {
      return false;
    }

    if (isFeaturePremium(featureName) && !userIsPremium) {
      return false;
    }

    return true;
  }, [isFeatureEnabled, isFeaturePremium]);

  return { canAccessFeature };
}

export default useConfiguracionGlobal;
