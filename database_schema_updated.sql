-- WARNING: This schema is for context only and is not meant to be run.
-- Updated schema for SOUNDLY music platform with artist role system
-- Table order and constraints may not be valid for execution.

-- =====================================================
-- TABLA USUARIOS (Actualizada con nuevo sistema de roles)
-- =====================================================
CREATE TABLE public.usuarios (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  rol character varying NOT NULL DEFAULT 'usuario'::character varying 
    CHECK (rol::text = ANY (ARRAY['admin'::character varying, 'premium'::character varying, 'artista'::character varying, 'usuario'::character varying]::text[])),
  estado character varying NOT NULL DEFAULT 'activo'::character varying 
    CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'inactivo'::character varying, 'suspendido'::character varying]::text[])),
  nombre character varying,
  fecha_registro timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- =====================================================
-- TABLA PERFILES_ARTISTA (Nueva - para información específica de artistas)
-- =====================================================
CREATE TABLE public.perfiles_artista (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE,
  nombre_artistico character varying NOT NULL,
  biografia text,
  generos character varying[] DEFAULT ARRAY[]::character varying[],
  pais character varying,
  ciudad character varying,
  website text,
  instagram character varying,
  twitter character varying,
  spotify character varying,
  foto_perfil_url text,
  portada_url text,
  verificado boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT perfiles_artista_pkey PRIMARY KEY (id),
  CONSTRAINT perfiles_artista_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA CANCIONES (Actualizada - simplificada sin tabla artistas separada)
-- =====================================================
CREATE TABLE public.canciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo character varying NOT NULL,
  usuario_subida_id uuid NOT NULL,
  album_id uuid,
  duracion integer NOT NULL,
  numero_pista integer,
  genero character varying,
  año integer,
  archivo_audio_url text NOT NULL,
  imagen_url text,
  letra text,
  reproducciones integer DEFAULT 0,
  favoritos integer DEFAULT 0,
  descargas integer DEFAULT 0,
  es_publica boolean DEFAULT true,
  estado character varying DEFAULT 'activa'::character varying 
    CHECK (estado::text = ANY (ARRAY['activa'::character varying, 'inactiva'::character varying, 'borrador'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT canciones_pkey PRIMARY KEY (id),
  CONSTRAINT canciones_usuario_subida_id_fkey FOREIGN KEY (usuario_subida_id) REFERENCES public.usuarios(id),
  CONSTRAINT canciones_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albumes(id)
);

-- =====================================================
-- TABLA ALBUMES (Actualizada - referencia directa a usuario)
-- =====================================================
CREATE TABLE public.albumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo character varying NOT NULL,
  usuario_id uuid NOT NULL,
  descripcion text,
  fecha_lanzamiento date,
  genero character varying,
  imagen_portada_url text,
  duracion_total integer DEFAULT 0,
  numero_canciones integer DEFAULT 0,
  estado character varying DEFAULT 'borrador'::character varying 
    CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'publicado'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT albumes_pkey PRIMARY KEY (id),
  CONSTRAINT albumes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- =====================================================
-- TABLA PLAYLISTS (Sin cambios significativos)
-- =====================================================
CREATE TABLE public.playlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL,
  descripcion text,
  usuario_id uuid NOT NULL,
  es_publica boolean DEFAULT false,
  imagen_url text,
  duracion_total integer DEFAULT 0,
  numero_canciones integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playlists_pkey PRIMARY KEY (id),
  CONSTRAINT playlists_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- =====================================================
-- TABLA PLAYLIST_CANCIONES (Sin cambios)
-- =====================================================
CREATE TABLE public.playlist_canciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL,
  cancion_id uuid NOT NULL,
  posicion integer NOT NULL,
  agregada_por uuid,
  fecha_agregada timestamp with time zone DEFAULT now(),
  CONSTRAINT playlist_canciones_pkey PRIMARY KEY (id),
  CONSTRAINT playlist_canciones_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE,
  CONSTRAINT playlist_canciones_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE,
  CONSTRAINT playlist_canciones_agregada_por_fkey FOREIGN KEY (agregada_por) REFERENCES public.usuarios(id)
);

-- =====================================================
-- TABLA FAVORITOS (Sin cambios)
-- =====================================================
CREATE TABLE public.favoritos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  cancion_id uuid NOT NULL,
  fecha_agregada timestamp with time zone DEFAULT now(),
  CONSTRAINT favoritos_pkey PRIMARY KEY (id),
  CONSTRAINT favoritos_usuario_cancion_unique UNIQUE (usuario_id, cancion_id),
  CONSTRAINT favoritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT favoritos_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA HISTORIAL_REPRODUCCION (Actualizada)
-- =====================================================
CREATE TABLE public.historial_reproduccion (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  cancion_id uuid NOT NULL,
  fecha_reproduccion timestamp with time zone DEFAULT now(),
  duracion_escuchada integer,
  dispositivo character varying,
  ip_address inet,
  completada boolean DEFAULT false,
  CONSTRAINT historial_reproduccion_pkey PRIMARY KEY (id),
  CONSTRAINT historial_reproduccion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT historial_reproduccion_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA SEGUIMIENTOS (Nueva - para seguir artistas)
-- =====================================================
CREATE TABLE public.seguimientos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seguidor_id uuid NOT NULL,
  artista_id uuid NOT NULL,
  fecha_seguimiento timestamp with time zone DEFAULT now(),
  CONSTRAINT seguimientos_pkey PRIMARY KEY (id),
  CONSTRAINT seguimientos_seguidor_artista_unique UNIQUE (seguidor_id, artista_id),
  CONSTRAINT seguimientos_seguidor_id_fkey FOREIGN KEY (seguidor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT seguimientos_artista_id_fkey FOREIGN KEY (artista_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA DESCARGAS (Nueva - para trackear descargas premium)
-- =====================================================
CREATE TABLE public.descargas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  cancion_id uuid NOT NULL,
  fecha_descarga timestamp with time zone DEFAULT now(),
  calidad character varying DEFAULT 'alta'::character varying 
    CHECK (calidad::text = ANY (ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'hd'::character varying]::text[])),
  CONSTRAINT descargas_pkey PRIMARY KEY (id),
  CONSTRAINT descargas_usuario_cancion_unique UNIQUE (usuario_id, cancion_id),
  CONSTRAINT descargas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT descargas_cancion_id_fkey FOREIGN KEY (cancion_id) REFERENCES public.canciones(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA CONFIGURACIONES_USUARIO (Actualizada - simplificada)
-- =====================================================
CREATE TABLE public.configuraciones_usuario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE,
  calidad_audio character varying DEFAULT 'alta'::character varying 
    CHECK (calidad_audio::text = ANY (ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'hd'::character varying]::text[])),
  volumen_default integer DEFAULT 80 CHECK (volumen_default >= 0 AND volumen_default <= 100),
  reproduccion_automatica boolean DEFAULT true,
  notificaciones_email boolean DEFAULT true,
  notificaciones_push boolean DEFAULT true,
  tema character varying DEFAULT 'claro'::character varying 
    CHECK (tema::text = ANY (ARRAY['claro'::character varying, 'oscuro'::character varying, 'auto'::character varying]::text[])),
  idioma character varying DEFAULT 'es'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuraciones_usuario_pkey PRIMARY KEY (id),
  CONSTRAINT configuraciones_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA GENEROS (Mantenida para referencia)
-- =====================================================
CREATE TABLE public.generos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  imagen_url text,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT generos_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLA ESTADISTICAS_SISTEMA (Actualizada)
-- =====================================================
CREATE TABLE public.estadisticas_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  usuarios_activos integer DEFAULT 0,
  nuevos_usuarios integer DEFAULT 0,
  nuevos_artistas integer DEFAULT 0,
  usuarios_premium integer DEFAULT 0,
  reproducciones_totales bigint DEFAULT 0,
  canciones_subidas integer DEFAULT 0,
  playlists_creadas integer DEFAULT 0,
  tiempo_escucha_total bigint DEFAULT 0,
  descargas_totales integer DEFAULT 0,
  CONSTRAINT estadisticas_sistema_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TABLA NOTIFICACIONES (Nueva)
-- =====================================================
CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  tipo character varying NOT NULL 
    CHECK (tipo::text = ANY (ARRAY['nuevo_seguidor'::character varying, 'nueva_cancion'::character varying, 'album_publicado'::character varying, 'sistema'::character varying]::text[])),
  titulo character varying NOT NULL,
  mensaje text NOT NULL,
  leida boolean DEFAULT false,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX idx_usuarios_estado ON public.usuarios(estado);
CREATE INDEX idx_canciones_usuario_subida ON public.canciones(usuario_subida_id);
CREATE INDEX idx_canciones_genero ON public.canciones(genero);
CREATE INDEX idx_canciones_es_publica ON public.canciones(es_publica);
CREATE INDEX idx_historial_usuario_fecha ON public.historial_reproduccion(usuario_id, fecha_reproduccion);
CREATE INDEX idx_favoritos_usuario ON public.favoritos(usuario_id);
CREATE INDEX idx_seguimientos_artista ON public.seguimientos(artista_id);
CREATE INDEX idx_playlists_usuario ON public.playlists(usuario_id);
CREATE INDEX idx_albumes_usuario ON public.albumes(usuario_id);

-- =====================================================
-- TRIGGERS PARA MANTENER ESTADÍSTICAS ACTUALIZADAS
-- =====================================================

-- Trigger para actualizar contador de reproducciones
CREATE OR REPLACE FUNCTION actualizar_reproducciones()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.canciones 
  SET reproducciones = reproducciones + 1 
  WHERE id = NEW.cancion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_reproducciones
  AFTER INSERT ON public.historial_reproduccion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_reproducciones();

-- Trigger para actualizar contador de favoritos
CREATE OR REPLACE FUNCTION actualizar_favoritos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.canciones 
    SET favoritos = favoritos + 1 
    WHERE id = NEW.cancion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.canciones 
    SET favoritos = favoritos - 1 
    WHERE id = OLD.cancion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_favoritos
  AFTER INSERT OR DELETE ON public.favoritos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_favoritos();

-- =====================================================
-- FUNCIONES PARA ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en las tablas principales
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_artista ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_reproduccion ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de ejemplo (deberían ser configuradas según necesidades específicas)
CREATE POLICY "Los usuarios pueden ver sus propios datos" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los artistas pueden gestionar su perfil" ON public.perfiles_artista
  FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY "Las canciones públicas son visibles para todos" ON public.canciones
  FOR SELECT USING (es_publica = true OR auth.uid() = usuario_subida_id);

-- =====================================================
-- DATOS INICIALES PARA GÉNEROS
-- =====================================================
INSERT INTO public.generos (nombre, descripcion) VALUES 
('Pop', 'Música popular contemporánea'),
('Rock', 'Música rock en todas sus variantes'),
('Hip Hop', 'Música hip hop y rap'),
('R&B', 'Rhythm and Blues'),
('Electronic', 'Música electrónica'),
('Jazz', 'Música jazz clásica y contemporánea'),
('Classical', 'Música clásica'),
('Reggaeton', 'Música reggaeton'),
('Salsa', 'Música salsa'),
('Bachata', 'Música bachata'),
('Cumbia', 'Música cumbia'),
('Folk', 'Música folk y tradicional'),
('Blues', 'Música blues'),
('Country', 'Música country'),
('Alternative', 'Música alternativa'),
('Indie', 'Música independiente'),
('Punk', 'Música punk'),
('Metal', 'Música metal'),
('Reggae', 'Música reggae')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- COMENTARIOS SOBRE CAMBIOS REALIZADOS
-- =====================================================

/*
CAMBIOS PRINCIPALES REALIZADOS:

1. ELIMINADAS:
   - Tabla 'artistas' separada (ahora los artistas son usuarios con rol 'artista')
   - Campos obsoletos en usuarios: apellido, fecha_nacimiento, avatar_url, plan
   - Referencias a tabla artistas en canciones y álbumes

2. ACTUALIZADAS:
   - Tabla usuarios: nuevo sistema de roles (admin, premium, artista, usuario)
   - Tabla canciones: referencia directa a usuario, nuevos campos para estadísticas
   - Tabla álbumes: referencia directa a usuario, campo de estado

3. AGREGADAS:
   - Tabla perfiles_artista: información específica para artistas
   - Tabla seguimientos: para seguir artistas
   - Tabla descargas: trackear descargas premium
   - Tabla notificaciones: sistema de notificaciones
   - Índices mejorados para rendimiento
   - Triggers para mantener estadísticas actualizadas
   - Políticas RLS básicas

4. MEJORADAS:
   - Constraints más específicos
   - ON DELETE CASCADE apropiados
   - Campos de estado en tablas relevantes
   - Estadísticas del sistema más completas

Este esquema está optimizado para el nuevo sistema de roles implementado
y elimina la complejidad innecesaria de tablas separadas para artistas.
*/
