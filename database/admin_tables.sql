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

-- Tabla para configuración del sistema
CREATE TABLE public.configuracion_sistema (
  id integer NOT NULL DEFAULT 1,
  max_file_size integer DEFAULT 50, -- MB
  allowed_formats text[] DEFAULT ARRAY['mp3', 'wav', 'flac'],
  max_uploads_per_day integer DEFAULT 10,
  maintenance_mode boolean DEFAULT false,
  registration_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  featured_content_slots integer DEFAULT 5,
  premium_price numeric(10,2) DEFAULT 9.99,
  upload_approval_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT configuracion_sistema_id_check CHECK (id = 1)
);

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
