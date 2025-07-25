-- SCRIPT ÚNICO COMPLETO PARA SOUNDLY
-- Ejecutar todo de una vez en Supabase SQL Editor

-- =====================================================
-- PARTE 1: CREAR TODAS LAS TABLAS
-- =====================================================

-- 1. TABLA DE USUARIOS
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    avatar_url TEXT,
    plan VARCHAR(20) DEFAULT 'gratuito' CHECK (plan IN ('gratuito', 'premium', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE ARTISTAS
CREATE TABLE artistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    biografia TEXT,
    imagen_url TEXT,
    genero VARCHAR(100),
    pais VARCHAR(100),
    fecha_inicio DATE,
    sitio_web TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE ÁLBUMES
CREATE TABLE albumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    artista_id UUID REFERENCES artistas(id) ON DELETE CASCADE,
    descripcion TEXT,
    fecha_lanzamiento DATE,
    genero VARCHAR(100),
    imagen_portada_url TEXT,
    duracion_total INTEGER,
    numero_canciones INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE CANCIONES
CREATE TABLE canciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    artista_id UUID REFERENCES artistas(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albumes(id) ON DELETE SET NULL,
    duracion INTEGER NOT NULL,
    numero_pista INTEGER,
    genero VARCHAR(100),
    año INTEGER,
    archivo_audio_url TEXT NOT NULL,
    imagen_url TEXT,
    letra TEXT,
    reproducciones INTEGER DEFAULT 0,
    es_publica BOOLEAN DEFAULT true,
    usuario_subida_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE PLAYLISTS
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    es_publica BOOLEAN DEFAULT false,
    imagen_url TEXT,
    duracion_total INTEGER DEFAULT 0,
    numero_canciones INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE CANCIONES EN PLAYLISTS
CREATE TABLE playlist_canciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    cancion_id UUID REFERENCES canciones(id) ON DELETE CASCADE,
    posicion INTEGER NOT NULL,
    agregada_por UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_agregada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, cancion_id)
);

-- 7. TABLA DE FAVORITOS
CREATE TABLE favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    cancion_id UUID REFERENCES canciones(id) ON DELETE CASCADE,
    fecha_agregada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, cancion_id)
);

-- 8. TABLA DE HISTORIAL DE REPRODUCCIÓN
CREATE TABLE historial_reproduccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    cancion_id UUID REFERENCES canciones(id) ON DELETE CASCADE,
    fecha_reproduccion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duracion_escuchada INTEGER,
    dispositivo VARCHAR(100),
    ip_address INET
);

-- 9. TABLA DE GÉNEROS MUSICALES
CREATE TABLE generos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA DE CONFIGURACIONES DE USUARIO
CREATE TABLE configuraciones_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    calidad_audio VARCHAR(20) DEFAULT 'alta' CHECK (calidad_audio IN ('baja', 'media', 'alta', 'sin_perdida')),
    volumen_default INTEGER DEFAULT 80 CHECK (volumen_default BETWEEN 0 AND 100),
    reproduccion_automatica BOOLEAN DEFAULT true,
    notificaciones_email BOOLEAN DEFAULT true,
    notificaciones_push BOOLEAN DEFAULT true,
    tema VARCHAR(20) DEFAULT 'claro' CHECK (tema IN ('claro', 'oscuro', 'auto')),
    idioma VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLA DE ESTADÍSTICAS
CREATE TABLE estadisticas_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    usuarios_activos INTEGER DEFAULT 0,
    nuevos_usuarios INTEGER DEFAULT 0,
    reproducciones_totales INTEGER DEFAULT 0,
    canciones_subidas INTEGER DEFAULT 0,
    playlists_creadas INTEGER DEFAULT 0,
    tiempo_escucha_total INTEGER DEFAULT 0,
    UNIQUE(fecha)
);

-- =====================================================
-- PARTE 2: CREAR ÍNDICES
-- =====================================================

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_canciones_artista ON canciones(artista_id);
CREATE INDEX idx_canciones_album ON canciones(album_id);
CREATE INDEX idx_canciones_usuario ON canciones(usuario_subida_id);
CREATE INDEX idx_playlists_usuario ON playlists(usuario_id);
CREATE INDEX idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX idx_historial_usuario ON historial_reproduccion(usuario_id);
CREATE INDEX idx_historial_fecha ON historial_reproduccion(fecha_reproduccion);

-- =====================================================
-- PARTE 3: CREAR FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
CREATE TRIGGER tr_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER tr_canciones_updated_at
    BEFORE UPDATE ON canciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER tr_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER tr_configuraciones_updated_at
    BEFORE UPDATE ON configuraciones_usuario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- Función para crear usuario automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO usuarios (id, email, rol, estado)
    VALUES (NEW.id, NEW.email, 'usuario', 'activo')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO configuraciones_usuario (usuario_id)
    VALUES (NEW.id)
    ON CONFLICT (usuario_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Función para actualizar contadores de playlist
CREATE OR REPLACE FUNCTION actualizar_contadores_playlist()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE playlists 
        SET numero_canciones = numero_canciones + 1,
            duracion_total = duracion_total + (
                SELECT duracion FROM canciones WHERE id = NEW.cancion_id
            )
        WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE playlists 
        SET numero_canciones = numero_canciones - 1,
            duracion_total = duracion_total - (
                SELECT duracion FROM canciones WHERE id = OLD.cancion_id
            )
        WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_playlist_contadores
    AFTER INSERT OR DELETE ON playlist_canciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_contadores_playlist();

-- Función para incrementar reproducciones
CREATE OR REPLACE FUNCTION incrementar_reproducciones()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE canciones 
    SET reproducciones = reproducciones + 1
    WHERE id = NEW.cancion_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_incrementar_reproducciones
    AFTER INSERT ON historial_reproduccion
    FOR EACH ROW
    EXECUTE FUNCTION incrementar_reproducciones();

-- =====================================================
-- PARTE 4: FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener canciones populares
CREATE OR REPLACE FUNCTION obtener_canciones_populares(limite INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR,
    artista_nombre VARCHAR,
    reproducciones INTEGER,
    duracion INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.titulo,
        a.nombre as artista_nombre,
        c.reproducciones,
        c.duracion
    FROM canciones c
    LEFT JOIN artistas a ON c.artista_id = a.id
    WHERE c.es_publica = true
    ORDER BY c.reproducciones DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar contenido
CREATE OR REPLACE FUNCTION buscar_contenido(termino_busqueda TEXT)
RETURNS TABLE (
    tipo VARCHAR,
    id UUID,
    titulo VARCHAR,
    subtitulo VARCHAR,
    imagen_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'cancion'::VARCHAR as tipo,
        c.id,
        c.titulo,
        a.nombre as subtitulo,
        c.imagen_url
    FROM canciones c
    LEFT JOIN artistas a ON c.artista_id = a.id
    WHERE c.es_publica = true
    AND (
        c.titulo ILIKE '%' || termino_busqueda || '%' OR 
        a.nombre ILIKE '%' || termino_busqueda || '%'
    )
    
    UNION ALL
    
    SELECT 
        'artista'::VARCHAR as tipo,
        a.id,
        a.nombre as titulo,
        a.genero as subtitulo,
        a.imagen_url
    FROM artistas a
    WHERE a.nombre ILIKE '%' || termino_busqueda || '%'
    
    UNION ALL
    
    SELECT 
        'playlist'::VARCHAR as tipo,
        p.id,
        p.nombre as titulo,
        CONCAT(p.numero_canciones, ' canciones') as subtitulo,
        p.imagen_url
    FROM playlists p
    WHERE p.es_publica = true
    AND p.nombre ILIKE '%' || termino_busqueda || '%';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: DATOS INICIALES
-- =====================================================

-- Insertar géneros musicales básicos
INSERT INTO generos (nombre, descripcion) VALUES
('Rock', 'Género musical caracterizado por el uso de guitarras eléctricas'),
('Pop', 'Música popular contemporánea'),
('Jazz', 'Género musical nacido en Estados Unidos'),
('Classical', 'Música clásica occidental'),
('Electronic', 'Música creada con instrumentos electrónicos'),
('Hip Hop', 'Género musical y cultura urbana'),
('Reggae', 'Género musical originario de Jamaica'),
('Blues', 'Género musical afroamericano'),
('Country', 'Música country americana'),
('Folk', 'Música folclórica tradicional')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- PARTE 6: DESHABILITAR COMPLETAMENTE RLS PARA DESARROLLO
-- =====================================================

-- DESHABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE artistas DISABLE ROW LEVEL SECURITY;
ALTER TABLE albumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE canciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_canciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE historial_reproduccion DISABLE ROW LEVEL SECURITY;
ALTER TABLE generos DISABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE estadisticas_sistema DISABLE ROW LEVEL SECURITY;

-- ELIMINAR CUALQUIER POLÍTICA EXISTENTE SI HAY
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "playlists_select_policy" ON playlists;
DROP POLICY IF EXISTS "playlists_insert_policy" ON playlists;
DROP POLICY IF EXISTS "playlists_update_policy" ON playlists;
DROP POLICY IF EXISTS "favoritos_select_policy" ON favoritos;
DROP POLICY IF EXISTS "favoritos_insert_policy" ON favoritos;

-- CONFIGURAR PERMISOS DIRECTOS PARA DESARROLLO
GRANT ALL ON usuarios TO authenticated;
GRANT ALL ON artistas TO authenticated;
GRANT ALL ON albumes TO authenticated;
GRANT ALL ON canciones TO authenticated;
GRANT ALL ON playlists TO authenticated;
GRANT ALL ON playlist_canciones TO authenticated;
GRANT ALL ON favoritos TO authenticated;
GRANT ALL ON historial_reproduccion TO authenticated;
GRANT ALL ON generos TO authenticated;
GRANT ALL ON configuraciones_usuario TO authenticated;
GRANT ALL ON estadisticas_sistema TO authenticated;

-- PERMITIR ACCESO PÚBLICO TAMBIÉN (PARA DESARROLLO)
GRANT SELECT ON usuarios TO anon;
GRANT SELECT ON artistas TO anon;
GRANT SELECT ON albumes TO anon;
GRANT SELECT ON canciones TO anon;
GRANT SELECT ON playlists TO anon;
GRANT SELECT ON playlist_canciones TO anon;
GRANT SELECT ON favoritos TO anon;
GRANT SELECT ON historial_reproduccion TO anon;
GRANT SELECT ON generos TO anon;
GRANT SELECT ON configuraciones_usuario TO anon;
GRANT SELECT ON estadisticas_sistema TO anon;

-- =====================================================
-- 🎉 ¡LISTO! Tu base de datos Soundly está configurada
-- =====================================================

-- Configuración para DESARROLLO:
-- - RLS COMPLETAMENTE DESHABILITADO (sin restricciones)
-- - Permisos completos para authenticated y anon
-- - Triggers funcionando correctamente
-- - Datos iniciales cargados
-- - NO hay políticas de seguridad activas

-- Para crear un admin, después del registro ejecuta:
-- UPDATE usuarios SET rol = 'admin' WHERE email = 'tu-email@example.com';

-- IMPORTANTE PARA DESARROLLO:
-- - Todas las tablas son accesibles sin restricciones
-- - No hay problemas de permisos o RLS
-- - Funciona directamente con Supabase

-- Para PRODUCCIÓN (después de completar desarrollo):
-- 1. Habilita RLS en las tablas necesarias
-- 2. Configura políticas de seguridad apropiadas
-- 3. Restringe permisos según necesidades
-- 4. Testa que la seguridad funcione correctamente
