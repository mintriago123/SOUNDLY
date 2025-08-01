-- =====================================================
-- SCRIPT DE MIGRACIÓN SEGURO PARA BASE DE DATOS EXISTENTE
-- SOUNDLY Music Platform - Actualización Paso a Paso
-- =====================================================
-- Este script es más seguro y maneja diferentes estructuras de BD
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== VERIFICANDO ESTRUCTURA ACTUAL ===';
  
  -- Verificar tabla usuarios
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
    RAISE NOTICE '✓ Tabla usuarios existe';
  ELSE
    RAISE EXCEPTION 'ERROR: Tabla usuarios no encontrada';
  END IF;
  
  -- Verificar tabla artistas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artistas') THEN
    RAISE NOTICE '✓ Tabla artistas existe - se migrará';
  ELSE
    RAISE NOTICE '- Tabla artistas no existe - se omitirá migración';
  END IF;
  
  RAISE NOTICE '=========================================';
END $$;

-- =====================================================
-- PASO 2: CREAR TABLA DE RESPALDO
-- =====================================================

CREATE TABLE IF NOT EXISTS temp_migration_backup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_origen varchar(100),
  datos_json jsonb,
  created_at timestamp DEFAULT now()
);

-- Respaldar usuarios existentes
DO $$
BEGIN
  INSERT INTO temp_migration_backup (tabla_origen, datos_json)
  SELECT 'usuarios_backup', row_to_json(u.*)::jsonb
  FROM public.usuarios u;
  
  RAISE NOTICE 'Respaldo de usuarios creado';
END $$;

-- =====================================================
-- PASO 3: ACTUALIZAR TABLA USUARIOS PASO A PASO
-- =====================================================

-- Agregar campo fecha_registro si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'fecha_registro') THEN
    ALTER TABLE public.usuarios ADD COLUMN fecha_registro timestamp with time zone DEFAULT now();
    RAISE NOTICE '✓ Campo fecha_registro agregado';
  ELSE
    RAISE NOTICE '- Campo fecha_registro ya existe';
  END IF;
END $$;

-- Actualizar constraint de rol de forma segura
DO $$
BEGIN
  -- Verificar roles actuales en la tabla
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE rol NOT IN ('admin', 'premium', 'artista', 'usuario')) THEN
    RAISE NOTICE 'ADVERTENCIA: Existen roles no reconocidos en la tabla usuarios';
  END IF;
  
  -- Actualizar constraint
  ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
  ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol::text = ANY (ARRAY['admin'::character varying, 'premium'::character varying, 'artista'::character varying, 'usuario'::character varying]::text[]));
  
  RAISE NOTICE '✓ Constraint de roles actualizado';
END $$;

-- Actualizar fecha_registro basado en created_at
DO $$
BEGIN
  UPDATE public.usuarios 
  SET fecha_registro = created_at 
  WHERE fecha_registro IS NULL;
  
  RAISE NOTICE '✓ Fechas de registro actualizadas';
END $$;

-- =====================================================
-- PASO 4: ELIMINAR CAMPOS OBSOLETOS DE USUARIOS
-- =====================================================

DO $$
DECLARE
  campos_eliminados text[] := ARRAY[]::text[];
BEGIN
  -- Eliminar apellido si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'apellido') THEN
    ALTER TABLE public.usuarios DROP COLUMN apellido;
    campos_eliminados := array_append(campos_eliminados, 'apellido');
  END IF;
  
  -- Eliminar fecha_nacimiento si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'fecha_nacimiento') THEN
    ALTER TABLE public.usuarios DROP COLUMN fecha_nacimiento;
    campos_eliminados := array_append(campos_eliminados, 'fecha_nacimiento');
  END IF;
  
  -- Eliminar avatar_url si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.usuarios DROP COLUMN avatar_url;
    campos_eliminados := array_append(campos_eliminados, 'avatar_url');
  END IF;
  
  -- Eliminar plan si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'plan') THEN
    ALTER TABLE public.usuarios DROP COLUMN plan;
    campos_eliminados := array_append(campos_eliminados, 'plan');
  END IF;
  
  IF array_length(campos_eliminados, 1) > 0 THEN
    RAISE NOTICE '✓ Campos eliminados: %', array_to_string(campos_eliminados, ', ');
  ELSE
    RAISE NOTICE '- No había campos obsoletos que eliminar';
  END IF;
END $$;

-- =====================================================
-- PASO 5: CREAR TABLA PERFILES_ARTISTA
-- =====================================================

DO $$
BEGIN
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

  RAISE NOTICE '✓ Tabla perfiles_artista creada';
END $$;

-- =====================================================
-- PASO 6: MIGRAR DATOS DE TABLA ARTISTAS (FLEXIBLE)
-- =====================================================

DO $$
DECLARE
  artistas_migrados integer := 0;
  columnas_artistas text;
BEGIN
  -- Verificar si existe la tabla artistas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'artistas') THEN
    
    -- Obtener lista de columnas disponibles
    SELECT string_agg(column_name, ', ') INTO columnas_artistas
    FROM information_schema.columns 
    WHERE table_name = 'artistas';
    
    RAISE NOTICE 'Tabla artistas encontrada con columnas: %', columnas_artistas;
    
    -- Crear usuarios básicos para artistas (solo con campos obligatorios)
    EXECUTE format('
      INSERT INTO public.usuarios (id, email, rol, estado, nombre, fecha_registro)
      SELECT 
        a.id,
        a.nombre || ''@soundly.local'',
        ''artista'',
        ''activo'',
        a.nombre,
        COALESCE(a.created_at, now())
      FROM public.artistas a
      WHERE NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id)
      ON CONFLICT (id) DO NOTHING
    ');
    
    GET DIAGNOSTICS artistas_migrados = ROW_COUNT;
    
    -- Crear perfiles de artista básicos
    EXECUTE format('
      INSERT INTO public.perfiles_artista (usuario_id, nombre_artistico, biografia, pais, created_at, updated_at)
      SELECT 
        a.id,
        a.nombre,
        COALESCE(a.biografia, ''''),
        COALESCE(a.pais, ''''),
        COALESCE(a.created_at, now()),
        COALESCE(a.updated_at, now())
      FROM public.artistas a
      WHERE EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = a.id)
      ON CONFLICT (usuario_id) DO UPDATE SET
        nombre_artistico = EXCLUDED.nombre_artistico,
        biografia = EXCLUDED.biografia,
        pais = EXCLUDED.pais
    ');
    
    -- Actualizar roles de usuarios existentes que deberían ser artistas
    UPDATE public.usuarios 
    SET rol = 'artista' 
    WHERE id IN (SELECT id FROM public.artistas)
    AND rol != 'artista';
    
    RAISE NOTICE '✓ % artistas migrados desde tabla artistas', artistas_migrados;
    
  ELSE
    RAISE NOTICE '- No se encontró tabla artistas para migrar';
  END IF;
END $$;

-- =====================================================
-- PASO 7: ACTUALIZAR TABLA CANCIONES
-- =====================================================

-- Agregar nuevos campos
DO $$
DECLARE
  campos_agregados text[] := ARRAY[]::text[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'favoritos') THEN
    ALTER TABLE public.canciones ADD COLUMN favoritos integer DEFAULT 0;
    campos_agregados := array_append(campos_agregados, 'favoritos');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'descargas') THEN
    ALTER TABLE public.canciones ADD COLUMN descargas integer DEFAULT 0;
    campos_agregados := array_append(campos_agregados, 'descargas');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'estado') THEN
    ALTER TABLE public.canciones ADD COLUMN estado character varying DEFAULT 'activa'::character varying 
      CHECK (estado::text = ANY (ARRAY['activa'::character varying, 'inactiva'::character varying, 'borrador'::character varying]::text[]));
    campos_agregados := array_append(campos_agregados, 'estado');
  END IF;
  
  IF array_length(campos_agregados, 1) > 0 THEN
    RAISE NOTICE '✓ Campos agregados a canciones: %', array_to_string(campos_agregados, ', ');
  END IF;
END $$;

-- Migrar artista_id a usuario_subida_id si existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'canciones' AND column_name = 'artista_id') THEN
    
    -- Actualizar usuario_subida_id basado en artista_id
    UPDATE public.canciones 
    SET usuario_subida_id = artista_id 
    WHERE usuario_subida_id IS NULL AND artista_id IS NOT NULL;
    
    -- Eliminar referencias a artista_id
    ALTER TABLE public.canciones DROP CONSTRAINT IF EXISTS canciones_artista_id_fkey;
    ALTER TABLE public.canciones DROP COLUMN IF EXISTS artista_id;
    
    RAISE NOTICE '✓ Campo artista_id migrado a usuario_subida_id';
  END IF;
END $$;

-- =====================================================
-- PASO 8: ACTUALIZAR TABLA ALBUMES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'albumes' AND column_name = 'artista_id') THEN
    
    -- Agregar usuario_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'albumes' AND column_name = 'usuario_id') THEN
      ALTER TABLE public.albumes ADD COLUMN usuario_id uuid;
    END IF;
    
    -- Migrar datos
    UPDATE public.albumes 
    SET usuario_id = artista_id 
    WHERE usuario_id IS NULL AND artista_id IS NOT NULL;
    
    -- Eliminar referencias antiguas
    ALTER TABLE public.albumes DROP CONSTRAINT IF EXISTS albumes_artista_id_fkey;
    ALTER TABLE public.albumes DROP COLUMN IF EXISTS artista_id;
    
    -- Agregar nueva constraint
    ALTER TABLE public.albumes ADD CONSTRAINT albumes_usuario_id_fkey 
      FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);
    
    RAISE NOTICE '✓ Campo artista_id migrado a usuario_id en álbumes';
  END IF;
  
  -- Agregar campo estado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'albumes' AND column_name = 'estado') THEN
    ALTER TABLE public.albumes ADD COLUMN estado character varying DEFAULT 'borrador'::character varying 
      CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'publicado'::character varying]::text[]));
    RAISE NOTICE '✓ Campo estado agregado a álbumes';
  END IF;
END $$;

-- =====================================================
-- PASO 9: CREAR NUEVAS TABLAS
-- =====================================================

DO $$
BEGIN
  -- Tabla seguimientos
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

  -- Tabla descargas
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

  -- Tabla notificaciones
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

  RAISE NOTICE '✓ Nuevas tablas creadas';
END $$;

-- =====================================================
-- PASO 10: ACTUALIZAR ESTADÍSTICAS Y FINALIZAR
-- =====================================================

-- Calcular favoritos basado en tabla existente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favoritos') THEN
    UPDATE public.canciones 
    SET favoritos = (
      SELECT COUNT(*)
      FROM public.favoritos f 
      WHERE f.cancion_id = canciones.id
    )
    WHERE favoritos = 0;
    RAISE NOTICE '✓ Contadores de favoritos actualizados';
  END IF;
END $$;

-- Crear índices básicos
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
  CREATE INDEX IF NOT EXISTS idx_canciones_usuario_subida ON public.canciones(usuario_subida_id);

  RAISE NOTICE '✓ Índices básicos creados';
END $$;

-- =====================================================
-- RESUMEN FINAL
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
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===';
  RAISE NOTICE 'Total usuarios: %', total_usuarios;
  RAISE NOTICE 'Artistas: %', total_artistas;
  RAISE NOTICE 'Premium: %', total_premium;
  RAISE NOTICE 'Administradores: %', total_admin;
  RAISE NOTICE 'Usuarios regulares: %', total_usuarios - total_artistas - total_premium - total_admin;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SIGUIENTE PASO: Verificar que la aplicación funcione correctamente';
  RAISE NOTICE 'OPCIONAL: Ejecutar "DROP TABLE public.artistas CASCADE;" cuando esté seguro';
  RAISE NOTICE 'OPCIONAL: Ejecutar "DROP TABLE temp_migration_backup;" para limpiar';
END $$;

COMMIT;

-- Script completado exitosamente
