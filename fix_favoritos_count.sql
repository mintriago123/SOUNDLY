-- Script para arreglar el problema de favoritos_count

-- Verificar si la columna favoritos_count existe en la tabla playlists
DO $$ 
BEGIN
    -- Agregar la columna favoritos_count a la tabla playlists si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'playlists' 
        AND column_name = 'favoritos_count'
    ) THEN
        ALTER TABLE playlists ADD COLUMN favoritos_count integer DEFAULT 0;
        RAISE NOTICE 'Columna favoritos_count agregada a la tabla playlists';
    ELSE
        RAISE NOTICE 'La columna favoritos_count ya existe en la tabla playlists';
    END IF;
END $$;

-- Actualizar el contador de favoritos para todas las playlists existentes
UPDATE playlists 
SET favoritos_count = (
    SELECT COUNT(*) 
    FROM playlist_favoritos 
    WHERE playlist_favoritos.playlist_id = playlists.id
);

-- Crear función para actualizar el contador automáticamente
CREATE OR REPLACE FUNCTION actualizar_favoritos_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementar contador cuando se agrega a favoritos
        UPDATE playlists 
        SET favoritos_count = favoritos_count + 1 
        WHERE id = NEW.playlist_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementar contador cuando se quita de favoritos
        UPDATE playlists 
        SET favoritos_count = favoritos_count - 1 
        WHERE id = OLD.playlist_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para mantener el contador actualizado
DROP TRIGGER IF EXISTS trigger_favoritos_count_insert ON playlist_favoritos;
DROP TRIGGER IF EXISTS trigger_favoritos_count_delete ON playlist_favoritos;

CREATE TRIGGER trigger_favoritos_count_insert
    AFTER INSERT ON playlist_favoritos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_favoritos_count();

CREATE TRIGGER trigger_favoritos_count_delete
    AFTER DELETE ON playlist_favoritos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_favoritos_count();

-- Verificación final
SELECT 
    'playlists' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'playlists' 
AND column_name = 'favoritos_count';
