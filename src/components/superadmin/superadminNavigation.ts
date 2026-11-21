export type SuperadminSection = 
  | 'inicio' // Centro de Control FRAOVIA
  | 'clubes' // Lista y gestión de instituciones
  | 'club_detalle' // Vista profunda de un club específico
  | 'editor_visual' // Editor Visual de Clubes (Canva / Figma)
  // Plataforma:
  | 'plataforma_versiones'
  | 'plataforma_funciones'
  | 'plataforma_config'
  // Monitoreo:
  | 'monitoreo_actividad'
  | 'monitoreo_errores'
  | 'monitoreo_uso'
  | 'monitoreo_conexiones'
  // Sistema:
  | 'sistema_planes'
  | 'sistema_usuarios'
  | 'sistema_config'
  // Seguridad:
  | 'seguridad_auditoria'
  | 'seguridad_permisos'
  | 'seguridad_accesos'
  // Backups:
  | 'backups';
