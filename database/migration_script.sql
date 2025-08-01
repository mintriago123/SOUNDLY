-- =====================================================
-- SCRIPT DE MIGRACIÓN PARA BASE DE DATOS EXISTENTE
-- SOUNDLY Music Platform - Actualización al Sistema de Roles con Artistas
-- =====================================================
-- ADVERTENCIA: Haz un backup completo de tu base de datos antes de ejecutar este script
-- Este script actualiza la estructura existente al nuevo sistema de roles
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: CREAR TABLA DE RESPALDO TEMPORAL
-- =====================================================
-- Crear tabla temporal para respaldar datos importantes
CREATE TABLE IF NOT EXISTS temp_migration_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_origen varchar(100),
  datos_json jsonb,
  created_at timestamp DEFAULT now()
);

-- =====================================================
-- PASO 2: ACTUALIZAR TABLA USUARIOS
-- =====================================================

-- Respaldar datos actuales de usuarios
INSERT INTO temp_migration_backup (tabla_origen, datos_json)
SELECT 'usuarios_original', row_to_json(u.*)::jsonb
FROM public.usuarios u;

-- Agregar nuevas columnas si no existen
DO $$
BEGIN
  -- Agregar campo fecha_registro si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'fecha_registro') THEN
    ALTER TABLE public.usuarios ADD COLUMN fecha_registro timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Actualizar el constraint del rol para incluir los nuevos roles
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
  CHECK (rol::text = ANY (ARRAY['admin'::character varying, 'premium'::character varying, 'artista'::character varying, 'usuario'::character varying]::text[]));

-- Eliminar columnas obsoletas de forma segura
DO $$
BEGIN
  -- Eliminar apellido si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'apellido') THEN
    ALTER TABLE public.usuarios DROP COLUMN apellido;
  END IF;
  
  -- Eliminar fecha_nacimiento si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'fecha_nacimiento') THEN
    ALTER TABLE public.usuarios DROP COLUMN fecha_nacimiento;
  END IF;
  
  -- Eliminar avatar_url si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.usuarios DROP COLUMN avatar_url;
  END IF;
  
  -- Eliminar plan si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'plan') THEN
    ALTER TABLE public.usuarios DROP COLUMN plan;
  END IF;
END $$;

-- Actualizar fecha_registro basado en created_at existente
UPDATE public.usuarios 
SET fecha_registro = created_at 
WHERE fecha_registro IS NULL;

-- =====================================================
-- PASO 3: CREAR TABLA PERFILES_ARTISTA
-- =====================================================

-- Crear tabla de perfiles de artista si no existe
CREATE TABLE IF NOT EXISTS public.perfiles_artista (
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
-- PASO 4: MIGRAR DATOS DE TABLA ARTISTAS (SI EXISTE)
-- =====================================================

DO $$
DECLARE
  has_email_column boolean;
  has_sitio_web_column boolean;
BEGIN
  -- Si existe la tabla artistas, migrar los datos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artistas') THEN
    
    -- Verificar qué columnas existen en la tabla artistas
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artistas' AND column_name = 'email'
    ) INTO has_email_column;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'artistas' AND column_name = 'sitio_web'
    ) INTO has_sitio_web_column;
    
    -- Crear usuarios para artistas que no tengan cuenta de usuario
    IF has_email_column THEN
      -- Si tiene columna email, usarla
      INSERT INTO public.usuarios (id, email, rol, estado, nombre, fecha_registro)
      SELECT 
        a.id,
        COALESCE(a.email, a.nombre || '@soundly.local'),
        'artista',
        'activo',
        a.nombre,
        COALESCE(a.created_at, now())
      FROM public.artistas a
      WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id)
      ON CONFLICT (id) DO NOTHING;
    ELSE
      -- Si no tiene columna email, generar email basado en nombre
      INSERT INTO public.usuarios (id, email, rol, estado, nombre, fecha_registro)
      SELECT 
        a.id,
        a.nombre || '@soundly.local',
        'artista',
        'activo',
        a.nombre,
        COALESCE(a.created_at, now())
      FROM public.artistas a
      WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id)
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Migrar datos de artistas a perfiles_artista
    IF has_sitio_web_column THEN
      -- Si tiene columna sitio_web, usarla
      INSERT INTO public.perfiles_artista (
        usuario_id, nombre_artistico, biografia, pais, website, created_at, updated_at
      )
      SELECT 
        a.id,
        a.nombre,
        a.biografia,
        a.pais,
        a.sitio_web,
        a.created_at,
        a.updated_at
      FROM public.artistas a
      WHERE EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id AND u.rol = 'artista')
      ON CONFLICT (usuario_id) DO UPDATE SET
        nombre_artistico = EXCLUDED.nombre_artistico,
        biografia = EXCLUDED.biografia,
        pais = EXCLUDED.pais,
        website = EXCLUDED.website;
    ELSE
      -- Si no tiene columna sitio_web, omitirla
      INSERT INTO public.perfiles_artista (
        usuario_id, nombre_artistico, biografia, pais, created_at, updated_at
      )
      SELECT 
        a.id,
        a.nombre,
        a.biografia,
        a.pais,
        a.created_at,
        a.updated_at
      FROM public.artistas a
      WHERE EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id AND u.rol = 'artista')
      ON CONFLICT (usuario_id) DO UPDATE SET
        nombre_artistico = EXCLUDED.nombre_artistico,
        biografia = EXCLUDED.biografia,
        pais = EXCLUDED.pais;
    END IF;
    
    -- Actualizar usuarios que deberían ser artistas
    UPDATE public.usuarios 
    SET rol = 'artista' 
    WHERE id IN (SELECT id FROM public.artistas)
    AND rol = 'usuario';
    
  END IF;
END $$;

-- =====================================================
-- PASO 5: ACTUALIZAR TABLA CANCIONES
-- =====================================================

-- Agregar nuevos campos a canciones si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'favoritos') THEN
    ALTER TABLE public.canciones ADD COLUMN favoritos integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'descargas') THEN
    ALTER TABLE public.canciones ADD COLUMN descargas integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'estado') THEN
    ALTER TABLE public.canciones ADD COLUMN estado character varying DEFAULT 'activa'::character varying 
      CHECK (estado::text = ANY (ARRAY['activa'::character varying, 'inactiva'::character varying, 'borrador'::character varying]::text[]));
  END IF;
END $$;

-- Actualizar constraint de artista_id si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'artista_id') THEN
    
    -- Actualizar usuario_subida_id basado en artista_id si es necesario
    UPDATE public.canciones 
    SET usuario_subida_id = artista_id 
    WHERE usuario_subida_id IS NULL AND artista_id IS NOT NULL;
    
    -- Eliminar la referencia a artista_id
    ALTER TABLE public.canciones DROP CONSTRAINT IF EXISTS canciones_artista_id_fkey;
    ALTER TABLE public.canciones DROP COLUMN IF EXISTS artista_id;
  END IF;
END $$;

-- Calcular favoritos basado en tabla favoritos existente
UPDATE public.canciones 
SET favoritos = (
  SELECT COUNT(*)
  FROM public.favoritos f 
  WHERE f.cancion_id = canciones.id
)
WHERE favoritos = 0;

-- =====================================================
-- PASO 6: ACTUALIZAR TABLA ALBUMES
-- =====================================================

-- Actualizar constraint de artista_id en álbumes si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'albumes' AND column_name = 'artista_id') THEN
    
    -- Agregar columna usuario_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'albumes' AND column_name = 'usuario_id') THEN
      ALTER TABLE public.albumes ADD COLUMN usuario_id uuid;
    END IF;
    
    -- Actualizar usuario_id basado en artista_id
    UPDATE public.albumes 
    SET usuario_id = artista_id 
    WHERE usuario_id IS NULL AND artista_id IS NOT NULL;
    
    -- Eliminar la referencia a artista_id
    ALTER TABLE public.albumes DROP CONSTRAINT IF EXISTS albumes_artista_id_fkey;
    ALTER TABLE public.albumes DROP COLUMN IF EXISTS artista_id;
    
    -- Agregar nueva constraint
    ALTER TABLE public.albumes ADD CONSTRAINT albumes_usuario_id_fkey 
      FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
  END IF;
END $$;

-- Agregar campo estado a álbumes si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'albumes' AND column_name = 'estado') THEN
    ALTER TABLE public.albumes ADD COLUMN estado character varying DEFAULT 'borrador'::character varying 
      CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'publicado'::character varying]::text[]));
  END IF;
END $$;

-- =====================================================
-- PASO 7: CREAR NUEVAS TABLAS DE FUNCIONALIDADES
-- =====================================================

-- Tabla de seguimientos
CREATE TABLE IF NOT EXISTS public.seguimientos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  seguidor_id uuid NOT NULL,
  artista_id uuid NOT NULL,
  fecha_seguimiento timestamp with time zone DEFAULT now(),
  CONSTRAINT seguimientos_pkey PRIMARY KEY (id),
  CONSTRAINT seguimientos_seguidor_artista_unique UNIQUE (seguidor_id, artista_id),
  CONSTRAINT seguimientos_seguidor_id_fkey FOREIGN KEY (seguidor_id) REFERENCES public.usuarios(id) ON DELETE CASCADE,
  CONSTRAINT seguimientos_artista_id_fkey FOREIGN KEY (artista_id) REFERENCES public.usuarios(id) ON DELETE CASCADE
);

-- Tabla de descargas
CREATE TABLE IF NOT EXISTS public.descargas (
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

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
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
-- PASO 8: ACTUALIZAR TABLA CONFIGURACIONES_USUARIO
-- =====================================================

-- Actualizar constraint de calidad_audio para incluir HD
DO $$
BEGIN
  ALTER TABLE public.configuraciones_usuario DROP CONSTRAINT IF EXISTS configuraciones_usuario_calidad_audio_check;
  ALTER TABLE public.configuraciones_usuario ADD CONSTRAINT configuraciones_usuario_calidad_audio_check 
    CHECK (calidad_audio::text = ANY (ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'hd'::character varying]::text[]));
END $$;

-- =====================================================
-- PASO 9: ACTUALIZAR TABLA ESTADISTICAS_SISTEMA
-- =====================================================

-- Agregar nuevos campos a estadísticas si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estadisticas_sistema' AND column_name = 'nuevos_artistas') THEN
    ALTER TABLE public.estadisticas_sistema ADD COLUMN nuevos_artistas integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estadisticas_sistema' AND column_name = 'usuarios_premium') THEN
    ALTER TABLE public.estadisticas_sistema ADD COLUMN usuarios_premium integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estadisticas_sistema' AND column_name = 'descargas_totales') THEN
    ALTER TABLE public.estadisticas_sistema ADD COLUMN descargas_totales integer DEFAULT 0;
  END IF;
  
  -- Cambiar reproducciones_totales y tiempo_escucha_total a bigint si son integer
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estadisticas_sistema' AND column_name = 'reproducciones_totales' AND data_type = 'integer') THEN
    ALTER TABLE public.estadisticas_sistema ALTER COLUMN reproducciones_totales TYPE bigint;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'estadisticas_sistema' AND column_name = 'tiempo_escucha_total' AND data_type = 'integer') THEN
    ALTER TABLE public.estadisticas_sistema ALTER COLUMN tiempo_escucha_total TYPE bigint;
  END IF;
END $$;

-- =====================================================
-- PASO 10: ACTUALIZAR TABLA HISTORIAL_REPRODUCCION
-- =====================================================

-- Agregar campo completada si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'historial_reproduccion' AND column_name = 'completada') THEN
    ALTER TABLE public.historial_reproduccion ADD COLUMN completada boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- PASO 11: AGREGAR CONSTRAINT UNIQUE A FAVORITOS
-- =====================================================

-- Agregar constraint único a favoritos si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'favoritos_usuario_cancion_unique') THEN
    ALTER TABLE public.favoritos ADD CONSTRAINT favoritos_usuario_cancion_unique UNIQUE (usuario_id, cancion_id);
  END IF;
END $$;

-- =====================================================
-- PASO 12: ACTUALIZAR TABLA GENEROS
-- =====================================================

-- Agregar campo activo a géneros si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'generos' AND column_name = 'activo') THEN
    ALTER TABLE public.generos ADD COLUMN activo boolean DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- PASO 13: CREAR ÍNDICES MEJORADOS
-- =====================================================

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON public.usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_canciones_usuario_subida ON public.canciones(usuario_subida_id);
CREATE INDEX IF NOT EXISTS idx_canciones_genero ON public.canciones(genero);
CREATE INDEX IF NOT EXISTS idx_canciones_es_publica ON public.canciones(es_publica);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_fecha ON public.historial_reproduccion(usuario_id, fecha_reproduccion);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON public.favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_artista ON public.seguimientos(artista_id);
CREATE INDEX IF NOT EXISTS idx_playlists_usuario ON public.playlists(usuario_id);
CREATE INDEX IF NOT EXISTS idx_albumes_usuario ON public.albumes(usuario_id);

-- =====================================================
-- PASO 14: CREAR TRIGGERS PARA ESTADÍSTICAS
-- =====================================================

-- Función para actualizar reproducciones
CREATE OR REPLACE FUNCTION actualizar_reproducciones()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.canciones 
  SET reproducciones = reproducciones + 1 
  WHERE id = NEW.cancion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_actualizar_reproducciones ON public.historial_reproduccion;
CREATE TRIGGER trigger_actualizar_reproducciones
  AFTER INSERT ON public.historial_reproduccion
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_reproducciones();

-- Función para actualizar favoritos
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

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_actualizar_favoritos ON public.favoritos;
CREATE TRIGGER trigger_actualizar_favoritos
  AFTER INSERT OR DELETE ON public.favoritos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_favoritos();

-- =====================================================
-- PASO 15: ELIMINAR TABLA ARTISTAS ANTIGUA (OPCIONAL)
-- =====================================================

-- DESCOMENTA ESTAS LÍNEAS SOLO DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUE EXITOSA
-- DROP TABLE IF EXISTS public.artistas CASCADE;

-- =====================================================
-- PASO 16: INSERTAR DATOS INICIALES DE GÉNEROS
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
-- VERIFICACIONES FINALES
-- =====================================================

-- Verificar que no haya datos huérfanos
DO $$
DECLARE
  huerfanos_count integer;
BEGIN
  -- Verificar canciones sin usuario válido
  SELECT COUNT(*) INTO huerfanos_count
  FROM public.canciones c
  WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = c.usuario_subida_id);
  
  IF huerfanos_count > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % canciones tienen usuario_subida_id inválido', huerfanos_count;
  END IF;
  
  -- Verificar álbumes sin usuario válido
  SELECT COUNT(*) INTO huerfanos_count
  FROM public.albumes a
  WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.usuario_id);
  
  IF huerfanos_count > 0 THEN
    RAISE NOTICE 'ADVERTENCIA: % álbumes tienen usuario_id inválido', huerfanos_count;
  END IF;
END $$;

-- =====================================================
-- RESUMEN DE LA MIGRACIÓN
-- =====================================================

DO $$
DECLARE
  total_usuarios integer;
  total_artistas integer;
  total_premium integer;
  total_admin integer;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM public.usuarios;
  SELECT COUNT(*) INTO total_artistas FROM public.usuarios WHERE rol = 'artista';
  SELECT COUNT(*) INTO total_premium FROM public.usuarios WHERE rol = 'premium';
  SELECT COUNT(*) INTO total_admin FROM public.usuarios WHERE rol = 'admin';
  
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===';
  RAISE NOTICE 'Total usuarios: %', total_usuarios;
  RAISE NOTICE 'Artistas: %', total_artistas;
  RAISE NOTICE 'Premium: %', total_premium;
  RAISE NOTICE 'Administradores: %', total_admin;
  RAISE NOTICE 'Usuarios regulares: %', total_usuarios - total_artistas - total_premium - total_admin;
  RAISE NOTICE '=============================================';
END $$;

COMMIT;

-- =====================================================
-- INSTRUCCIONES POST-MIGRACIÓN
-- =====================================================

/*
DESPUÉS DE EJECUTAR ESTA MIGRACIÓN:

1. VERIFICAR LOS DATOS:
   - Revisa que todos los usuarios tengan el rol correcto
   - Verifica que las canciones estén correctamente asociadas
   - Confirma que los perfiles de artista se crearon bien

2. PRUEBAS RECOMENDADAS:
   - Loguea con diferentes tipos de usuario
   - Verifica que el sistema de roles funcione
   - Prueba las nuevas funcionalidades de artista

3. LIMPIAR DATOS TEMPORALES:
   - Una vez confirmado que todo funciona, puedes eliminar:
     DROP TABLE temp_migration_backup;
     DROP TABLE public.artistas; (si existe)

4. CONFIGURAR RLS:
   - Revisa y ajusta las políticas de Row Level Security según tus necesidades

5. ACTUALIZAR LA APLICACIÓN:
   - Asegúrate de que el código de la aplicación esté actualizado
   - Verifica las queries y referencias a las nuevas tablas

¡La migración ha sido completada exitosamente!
*/
