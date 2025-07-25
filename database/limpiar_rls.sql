-- SCRIPT DE LIMPIEZA Y RESETEO PARA SOUNDLY
-- Ejecuta este script ANTES del setup_completo.sql si ya tienes tablas creadas

-- =====================================================
-- ELIMINAR POLÍTICAS RLS EXISTENTES
-- =====================================================

-- Eliminar todas las políticas que puedan existir
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete_policy" ON usuarios;
DROP POLICY IF EXISTS "playlists_select_policy" ON playlists;
DROP POLICY IF EXISTS "playlists_insert_policy" ON playlists;
DROP POLICY IF EXISTS "playlists_update_policy" ON playlists;
DROP POLICY IF EXISTS "playlists_delete_policy" ON playlists;
DROP POLICY IF EXISTS "favoritos_select_policy" ON favoritos;
DROP POLICY IF EXISTS "favoritos_insert_policy" ON favoritos;
DROP POLICY IF EXISTS "favoritos_delete_policy" ON favoritos;
DROP POLICY IF EXISTS "historial_select_policy" ON historial_reproduccion;
DROP POLICY IF EXISTS "historial_insert_policy" ON historial_reproduccion;
DROP POLICY IF EXISTS "configuraciones_select_policy" ON configuraciones_usuario;
DROP POLICY IF EXISTS "configuraciones_insert_policy" ON configuraciones_usuario;
DROP POLICY IF EXISTS "configuraciones_update_policy" ON configuraciones_usuario;
DROP POLICY IF EXISTS "canciones_select_policy" ON canciones;
DROP POLICY IF EXISTS "canciones_insert_policy" ON canciones;
DROP POLICY IF EXISTS "canciones_update_policy" ON canciones;

-- =====================================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artistas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS albumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS canciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS playlist_canciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favoritos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historial_reproduccion DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuraciones_usuario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estadisticas_sistema DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONFIGURAR PERMISOS COMPLETOS
-- =====================================================

-- Para usuarios autenticados
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Para usuarios anónimos (solo lectura)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

-- Este script ha:
-- 1. Eliminado todas las políticas RLS
-- 2. Deshabilitado RLS en todas las tablas
-- 3. Configurado permisos completos para desarrollo
-- 
-- Ahora puedes ejecutar setup_completo.sql sin problemas de RLS
