import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores por los de tu proyecto Supabase
const supabaseUrl = 'https://cycbwbiszlojxhyovpfu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y2J3YmlzemxvanhoeW92cGZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mzg2MjYsImV4cCI6MjA3MjUxNDYyNn0.Te2ty2rF7weR1c8HiW98NYXHhfwDg6ReF4WX6TtxOhY';

// URL que usaremos como destino del botón de restablecer contraseña en producción
// Cambia esto por tu dominio de producción (ej. https://misitio.com/reset-password)
export const RESET_PASSWORD_REDIRECT = 'http://gestiongymlaroca.netlify.app/reset-password';

export const supabase = createClient(supabaseUrl, supabaseKey);
