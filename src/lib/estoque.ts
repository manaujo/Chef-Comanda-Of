import { supabase } from './supabase';

// Re-export services from database.ts for compatibility
export { 
  insumosService as insumosEstoqueService,
  entradasEstoqueService,
  saidasEstoqueService,
  produtoInsumosService,
  historicoTurnosService
} from './database';
// Type exports for compatibility
export type { Insumo } from '../types/database';