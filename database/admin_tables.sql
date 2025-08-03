-- Tabla para reportes de usuarios
CREATE TABLE public.reportes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY[
    'contenido_inapropiado'::character varying, 
    'spam'::character varying, 
    'copyright'::character varying, 
    'acoso'::character varying, 
    'otro'::character varying
  ]::text[])),
  descripcion text NOT NULL,
  estado character varying NOT NULL DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY[
    'pendiente'::character varying, 
    'resuelto'::character varying, 
    'rechazado'::character varying
  ]::text[])),
  usuario_reporta_id uuid NOT NULL,
  usuario_reportado_id uuid,
  cancion_id uuid,
  accion_tomada text,
  resuelto_por character varying,
  fecha_resolucion timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reportes_pkey PRIMARY KEY (id),
  CONSTRAINT reportes_usuario_reporta_id_fkey FOREIGN KEY (usuario_reporta_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT reportes_usuario_reportado_id_fkey FOREIGN KEY (usuario_reportado_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT reportes_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE
);

-- Tabla para configuración del sistema (centralizada para toda la plataforma)
CREATE TABLE public.configuracion_sistema (
  id integer NOT NULL DEFAULT 1,
  
  -- Configuración de archivos y uploads
  max_file_size integer DEFAULT 50, -- MB
  allowed_formats text[] DEFAULT ARRAY['mp3', 'wav', 'flac', 'aac', 'ogg'],
  max_uploads_per_day integer DEFAULT 10,
  upload_approval_required boolean DEFAULT true,
  max_audio_bitrate integer DEFAULT 320, -- kbps
  min_audio_duration integer DEFAULT 30, -- segundos
  max_audio_duration integer DEFAULT 600, -- segundos (10 minutos)
  
  -- Configuración del sistema
  maintenance_mode boolean DEFAULT false,
  maintenance_message text DEFAULT 'El sistema está en mantenimiento. Volveremos pronto.',
  registration_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  featured_content_slots integer DEFAULT 5,
  
  -- Configuración de precios y suscripciones
  premium_price_monthly numeric(10,2) DEFAULT 9.99,
  premium_price_yearly numeric(10,2) DEFAULT 99.99,
  premium_discount_yearly integer DEFAULT 17, -- porcentaje de descuento anual
  artist_verification_fee numeric(10,2) DEFAULT 0.00, -- tarifa de verificación para artistas
  commission_percentage numeric(5,2) DEFAULT 15.00, -- comisión de la plataforma
  
  -- Configuración de usuarios y artistas
  max_playlists_free integer DEFAULT 10,
  max_playlists_premium integer DEFAULT -1, -- -1 = ilimitado
  max_followers_free integer DEFAULT 100,
  max_followers_premium integer DEFAULT -1, -- -1 = ilimitado
  artist_min_tracks integer DEFAULT 3, -- mínimo de tracks para ser artista
  artist_verification_enabled boolean DEFAULT true,
  
  -- Configuración de contenido
  auto_approve_verified_artists boolean DEFAULT true,
  content_moderation_enabled boolean DEFAULT true,
  explicit_content_allowed boolean DEFAULT true,
  min_age_explicit_content integer DEFAULT 18,
  copyright_protection_enabled boolean DEFAULT true,
  
  -- Configuración de funcionalidades
  download_enabled boolean DEFAULT true,
  social_features_enabled boolean DEFAULT true,
  comments_enabled boolean DEFAULT true,
  sharing_enabled boolean DEFAULT true,
  analytics_enabled boolean DEFAULT true,
  
  -- Configuración de notificaciones
  push_notifications_enabled boolean DEFAULT true,
  email_marketing_enabled boolean DEFAULT true,
  newsletter_enabled boolean DEFAULT true,
  
  -- Configuración de seguridad
  max_login_attempts integer DEFAULT 5,
  session_timeout_minutes integer DEFAULT 480, -- 8 horas
  password_min_length integer DEFAULT 8,
  require_email_verification boolean DEFAULT true,
  two_factor_auth_enabled boolean DEFAULT false,
  
  -- Configuración de API y límites
  api_rate_limit_per_minute integer DEFAULT 100,
  max_search_results integer DEFAULT 50,
  max_related_tracks integer DEFAULT 10,
  
  -- Metadatos del sistema
  platform_name text DEFAULT 'Soundly',
  platform_description text DEFAULT 'Tu plataforma de streaming musical',
  support_email text DEFAULT 'support@soundly.com',
  terms_url text DEFAULT '/terms',
  privacy_url text DEFAULT '/privacy',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT configuracion_sistema_id_check CHECK (id = 1)
);

-- Tabla para configuraciones específicas por feature
CREATE TABLE public.configuraciones_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feature_name character varying NOT NULL UNIQUE,
  enabled boolean DEFAULT true,
  config_data jsonb DEFAULT '{}',
  description text,
  requires_premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuraciones_features_pkey PRIMARY KEY (id)
);

-- Insertar configuraciones de features iniciales
INSERT INTO public.configuraciones_features (feature_name, enabled, config_data, description, requires_premium) VALUES
('high_quality_audio', true, '{"max_bitrate": 320, "formats": ["flac", "wav"]}', 'Audio de alta calidad', true),
('offline_downloads', true, '{"max_downloads": 100}', 'Descargas offline', true),
('advanced_analytics', true, '{"detailed_stats": true}', 'Analíticas avanzadas para artistas', false),
('live_streaming', false, '{"max_concurrent_streams": 10}', 'Transmisiones en vivo', true),
('collaborative_playlists', true, '{"max_collaborators": 10}', 'Playlists colaborativas', false),
('custom_equalizer', true, '{"presets": ["rock", "pop", "jazz", "classical"]}', 'Ecualizador personalizado', true),
('lyrics_display', true, '{"sync_lyrics": true}', 'Mostrar letras de canciones', false),
('social_sharing', true, '{"platforms": ["twitter", "facebook", "instagram"]}', 'Compartir en redes sociales', false),
('recommendations', true, '{"algorithm": "collaborative_filtering"}', 'Sistema de recomendaciones', false),
('crossfade', true, '{"default_duration": 3}', 'Crossfade entre canciones', true);

-- Tabla para banners destacados
CREATE TABLE public.banners_destacados (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo character varying NOT NULL,
  descripcion text,
  imagen_url text,
  enlace_url text,
  activo boolean DEFAULT true,
  orden_prioridad integer DEFAULT 0,
  fecha_inicio timestamp with time zone,
  fecha_fin timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT banners_destacados_pkey PRIMARY KEY (id)
);

-- Tabla para estadísticas de reproducciones
CREATE TABLE public.estadisticas_reproducciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cancion_id uuid NOT NULL,
  usuario_id uuid,
  fecha_reproduccion timestamp with time zone DEFAULT now(),
  duracion_reproducida integer, -- segundos
  dispositivo character varying,
  ip_address inet,
  pais character varying,
  ciudad character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estadisticas_reproducciones_pkey PRIMARY KEY (id),
  CONSTRAINT estadisticas_reproducciones_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE,
  CONSTRAINT estadisticas_reproducciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- Tabla para notificaciones del sistema
CREATE TABLE public.notificaciones_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY[
    'nueva_cancion'::character varying,
    'nuevo_seguidor'::character varying,
    'cancion_aprobada'::character varying,
    'cancion_rechazada'::character varying,
    'reporte_resuelto'::character varying,
    'sistema'::character varying
  ]::text[])),
  titulo character varying NOT NULL,
  mensaje text NOT NULL,
  usuario_id uuid NOT NULL,
  leida boolean DEFAULT false,
  enlace_url text,
  metadatos jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notificaciones_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- Tabla para logs de actividad del admin
CREATE TABLE public.logs_admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  accion character varying NOT NULL,
  tabla_afectada character varying,
  registro_id character varying,
  detalles jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT logs_admin_pkey PRIMARY KEY (id),
  CONSTRAINT logs_admin_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- Agregar campos adicionales a la tabla usuarios para suspensión
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS razon_suspension text,
ADD COLUMN IF NOT EXISTS fecha_suspension timestamp with time zone,
ADD COLUMN IF NOT EXISTS ultimo_acceso timestamp with time zone;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON public.reportes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON public.reportes(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON public.reportes(created_at);
CREATE INDEX IF NOT EXISTS idx_estadisticas_fecha ON public.estadisticas_reproducciones(fecha_reproduccion);
CREATE INDEX IF NOT EXISTS idx_estadisticas_cancion ON public.estadisticas_reproducciones(cancion_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.notificaciones_sistema(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones_sistema(leida);
CREATE INDEX IF NOT EXISTS idx_logs_admin_fecha ON public.logs_admin(created_at);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON public.usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_canciones_estado ON public.canciones(estado);

-- Insertar configuración inicial
INSERT INTO public.configuracion_sistema (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) policies
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners_destacados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estadisticas_reproducciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_admin ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para administradores
CREATE POLICY "Admin can manage all reportes" ON public.reportes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
  )
);

CREATE POLICY "Admin can manage system config" ON public.configuracion_sistema FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
  )
);

CREATE POLICY "Everyone can view active banners" ON public.banners_destacados FOR SELECT USING (activo = true);
CREATE POLICY "Admin can manage banners" ON public.banners_destacados FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
  )
);

CREATE POLICY "Users can create their own play stats" ON public.estadisticas_reproducciones FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can view their own notifications" ON public.notificaciones_sistema FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Admin can view all logs" ON public.logs_admin FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() AND usuarios.rol = 'admin'
  )
);

-- Función para obtener configuración del sistema
CREATE OR REPLACE FUNCTION get_system_config(config_key text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  IF config_key IS NULL THEN
    -- Retornar toda la configuración
    SELECT to_jsonb(cs.*) INTO result FROM public.configuracion_sistema cs WHERE id = 1;
  ELSE
    -- Retornar configuración específica
    EXECUTE format('SELECT to_jsonb(%I) FROM public.configuracion_sistema WHERE id = 1', config_key) INTO result;
  END IF;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar configuración del sistema
CREATE OR REPLACE FUNCTION update_system_config(config_updates jsonb)
RETURNS boolean AS $$
DECLARE
  update_query text;
  key text;
  value jsonb;
BEGIN
  -- Verificar que el usuario sea admin
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden actualizar la configuración del sistema';
  END IF;
  
  -- Construir query de actualización dinámicamente
  update_query := 'UPDATE public.configuracion_sistema SET updated_at = now()';
  
  FOR key, value IN SELECT * FROM jsonb_each(config_updates)
  LOOP
    update_query := update_query || format(', %I = %L', key, value #>> '{}');
  END LOOP;
  
  update_query := update_query || ' WHERE id = 1';
  
  EXECUTE update_query;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener configuración de feature
CREATE OR REPLACE FUNCTION get_feature_config(feature_name text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'enabled', enabled,
    'config', config_data,
    'requires_premium', requires_premium
  ) INTO result 
  FROM public.configuraciones_features 
  WHERE feature_name = get_feature_config.feature_name;
  
  RETURN COALESCE(result, '{"enabled": false}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario puede acceder a una feature
CREATE OR REPLACE FUNCTION user_can_access_feature(user_id uuid, feature_name text)
RETURNS boolean AS $$
DECLARE
  feature_config jsonb;
  user_role text;
  is_premium boolean := false;
BEGIN
  -- Obtener configuración de la feature
  SELECT get_feature_config(feature_name) INTO feature_config;
  
  -- Si la feature no está habilitada, nadie puede acceder
  IF NOT (feature_config->>'enabled')::boolean THEN
    RETURN false;
  END IF;
  
  -- Si no requiere premium, todos pueden acceder
  IF NOT (feature_config->>'requires_premium')::boolean THEN
    RETURN true;
  END IF;
  
  -- Verificar si el usuario es premium o admin
  SELECT rol INTO user_role FROM public.usuarios WHERE id = user_id;
  
  IF user_role IN ('premium', 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar timestamp cuando se modifica la configuración
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Crear notificación para admins sobre cambio de configuración
  INSERT INTO public.notificaciones_sistema (tipo, titulo, mensaje, usuario_id)
  SELECT 
    'sistema',
    'Configuración Actualizada',
    'La configuración del sistema ha sido modificada por ' || u.nombre,
    u.id
  FROM public.usuarios u 
  WHERE u.rol = 'admin' AND u.id != auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_config_timestamp
  BEFORE UPDATE ON public.configuracion_sistema
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

CREATE TRIGGER trigger_feature_config_timestamp
  BEFORE UPDATE ON public.configuraciones_features
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

-- Función para crear notificaciones automáticas
CREATE OR REPLACE FUNCTION crear_notificacion_automatica()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar cuando se aprueba una canción
  IF TG_TABLE_NAME = 'canciones' AND OLD.estado = 'borrador' AND NEW.estado = 'activa' THEN
    INSERT INTO public.notificaciones_sistema (tipo, titulo, mensaje, usuario_id)
    VALUES (
      'cancion_aprobada',
      'Canción Aprobada',
      'Tu canción "' || NEW.titulo || '" ha sido aprobada y está disponible públicamente.',
      NEW.usuario_subida_id
    );
  END IF;
  
  -- Notificar cuando se rechaza una canción
  IF TG_TABLE_NAME = 'canciones' AND OLD.estado = 'borrador' AND NEW.estado = 'inactiva' THEN
    INSERT INTO public.notificaciones_sistema (tipo, titulo, mensaje, usuario_id)
    VALUES (
      'cancion_rechazada',
      'Canción Rechazada',
      'Tu canción "' || NEW.titulo || '" ha sido rechazada. Contacta al administrador para más información.',
      NEW.usuario_subida_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificaciones automáticas
CREATE TRIGGER trigger_notificaciones_canciones
  AFTER UPDATE ON public.canciones
  FOR EACH ROW
  EXECUTE FUNCTION crear_notificacion_automatica();

-- Función para registrar actividad de admin
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar para administradores
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin') THEN
    INSERT INTO public.logs_admin (admin_id, accion, tabla_afectada, registro_id, detalles)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para logging de actividad admin
CREATE TRIGGER log_usuarios_changes
  AFTER UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_canciones_changes
  AFTER UPDATE OR DELETE ON public.canciones
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_reportes_changes
  AFTER UPDATE ON public.reportes
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_activity();
