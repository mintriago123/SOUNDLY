import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseCLient';

export async function POST() {
  try {
    const supabase = await createClient();

    // Verificar que la tabla subscriptions existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscriptions');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return NextResponse.json({
        success: false,
        error: 'No se puede verificar la estructura de la base de datos',
        details: tablesError.message
      });
    }

    const hasSubscriptionsTable = tables && tables.length > 0;

    // Verificar que los usuarios tienen las columnas necesarias para Stripe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'usuarios')
      .in('column_name', ['stripe_customer_id', 'subscription_status', 'subscription_tier']);

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
    }

    const existingColumns = columns?.map(col => col.column_name) || [];

    interface Recommendation {
      type: 'critical' | 'warning' | 'info';
      issue: string;
      solution: string;
    }

    const report = {
      timestamp: new Date().toISOString(),
      database: {
        subscriptionsTable: hasSubscriptionsTable ? '✅ Existe' : '❌ Faltante',
        userColumns: {
          stripe_customer_id: existingColumns.includes('stripe_customer_id') ? '✅ Existe' : '❌ Faltante',
          subscription_status: existingColumns.includes('subscription_status') ? '✅ Existe' : '❌ Faltante',
          subscription_tier: existingColumns.includes('subscription_tier') ? '✅ Existe' : '❌ Faltante',
        }
      },
      recommendations: [] as Recommendation[]
    };

    // Generar recomendaciones
    if (!hasSubscriptionsTable) {
      report.recommendations.push({
        type: 'critical',
        issue: 'Tabla subscriptions no existe',
        solution: 'Ejecutar el script database/subscriptions_table.sql en Supabase'
      });
    }

    if (!existingColumns.includes('stripe_customer_id')) {
      report.recommendations.push({
        type: 'warning',
        issue: 'Columna stripe_customer_id faltante en usuarios',
        solution: 'ALTER TABLE usuarios ADD COLUMN stripe_customer_id TEXT;'
      });
    }

    if (!existingColumns.includes('subscription_status')) {
      report.recommendations.push({
        type: 'warning',
        issue: 'Columna subscription_status faltante en usuarios',
        solution: 'ALTER TABLE usuarios ADD COLUMN subscription_status TEXT DEFAULT \'free\';'
      });
    }

    // Test básico de conectividad
    const { data: testQuery, error: testError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);

    if (testError) {
      report.recommendations.push({
        type: 'critical',
        issue: 'No se puede conectar a la base de datos',
        solution: 'Verificar configuración de Supabase y permisos'
      });
    }

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error verificando base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
