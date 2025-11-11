import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cycbwbiszlojxhyovpfu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y2J3YmlzemxvanhoeW92cGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mzg2MjYsImV4cCI6MjA3MjUxNDYyNn0.Te2ty2rF7weR1c8HiW98NYXHhfwDg6ReF4WX6TtxOhY';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('Consultando vista public.productos...');
    const { data, error, status } = await supabase.from('productos').select('*').limit(10);
    if (error) {
      console.error('Error al consultar productos:', error, 'status:', status);
      process.exitCode = 2;
      return;
    }
    console.log('Filas obtenidas:', Array.isArray(data) ? data.length : 0);
    console.dir(data, { depth: 2 });
  } catch (e) {
    console.error('Excepción al consultar Supabase:', e);
    process.exitCode = 3;
  }
})();
