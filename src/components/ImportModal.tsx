import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import { parseCsvContent, ImportAnalysisResult } from '../services/importExport';
import { Category, Club, Discipline, Player, User } from '../types/fraovia';
import { fraoviaDB } from '../services/fraoviaStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  disciplines: Discipline[];
  categories: Category[];
  existingPlayers: Player[];
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  disciplines,
  categories,
  existingPlayers,
  onImportComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>(disciplines[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'flag'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    restricted: number;
  } | null>(null);

  if (!isOpen) return null;

  // Pre-loaded realistic sports club padrón demo
  const sampleCsvData = `DNI;Nombre;Apellido;Fecha_Nacimiento;Telefono;Email;Cuota
48901234;Mateo;González;2009-04-12;11-9876-5432;padre.gonzalez@gmail.com;22000
51098112;Ignacio;Sosa;2010-03-15;11-4433-2211;ignacio.sosa@gmail.com;22000
52334901;Valentín;Romero;2010-07-22;11-5566-7788;vromero.padres@hotmail.com;22000
52889012;Felipe;Alvarez;2010-11-04;11-9988-1122;alvarez.flia@gmail.com;22000
53112098;Santino;Carrizo;2011-01-30;11-3322-9988;carrizo.santino@yahoo.com;20000`;

  const handleLoadSample = () => {
    setRawText(sampleCsvData);
    processText(sampleCsvData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setRawText(text);
      processText(text);
    };
    reader.readAsText(file);
  };

  const processText = (text: string) => {
    const existingDnis = new Set(existingPlayers.map(p => p.dni));
    const result = parseCsvContent(text, existingDnis);
    setAnalysis(result);
    setStep(2);
  };

  const handleExecuteImport = () => {
    if (!analysis) return;
    setIsProcessing(true);

    const playersToImport = analysis.rows
      .filter(r => r.isValid)
      .map(r => ({
        dni: r.mapped.dni,
        firstName: r.mapped.firstName,
        lastName: r.mapped.lastName,
        birthDate: r.mapped.birthDate,
        phone: r.mapped.phone,
        email: r.mapped.email,
        disciplineId: selectedDisciplineId,
        categoryId: selectedCategoryId,
        monthlyFeeDue: r.mapped.monthlyFee || 22000
      }));

    try {
      const result = fraoviaDB.importPlayers(
        currentClub.id,
        playersToImport,
        duplicateStrategy,
        currentUser
      );
      setImportResult(result);
      setStep(6);
      onImportComplete();
    } catch (err: any) {
      alert(err.message || 'Error durante la importación');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Asistente de Importación de Jugadores
              </h2>
              <p className="text-xs text-slate-400">
                Paso {step} de 6 · {currentClub.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Tracker */}
        <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-950/40 text-center text-[10px] font-semibold">
          {['1. Archivo', '2. Análisis', '3. Relación', '4. Vista Previa', '5. Duplicados', '6. Confirmar'].map((label, idx) => (
            <div 
              key={label}
              className={`py-2 px-1 border-r border-slate-800/40 last:border-r-0 truncate ${
                step === idx + 1 ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400' : 'text-slate-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: Archivo */}
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-6 sm:p-8 transition bg-slate-950/30">
                <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Arrastra o selecciona tu planilla Excel (.xlsx, .csv)
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Soporta planillas de federaciones, ligas locales o registros históricos con columnas de DNI, Nombre, Apellido y Contacto.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <label className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20">
                    Seleccionar Archivo
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleLoadSample}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    Cargar Padrón de Ejemplo
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-left text-xs text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">Garantía de integridad FRAOVIA:</p>
                <p>
                  Si la importación excede el límite de jugadores del plan ({currentClub.contractedPlayersQuota}), los registros excedentes pasarán a modo <strong>Solo Lectura</strong> sin perderse ni borrarse.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Análisis */}
          {step === 2 && analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-center">
                  <div className="text-xl font-bold text-slate-100">{analysis.totalRows}</div>
                  <div className="text-[11px] text-slate-400">Filas Detectadas</div>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                  <div className="text-xl font-bold text-emerald-400">{analysis.validRows}</div>
                  <div className="text-[11px] text-emerald-300">Válidas para Importar</div>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                  <div className="text-xl font-bold text-amber-400">{analysis.duplicateDniCount}</div>
                  <div className="text-[11px] text-amber-300">DNI en Conflicto</div>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
                  <div className="text-xl font-bold text-rose-400">{analysis.invalidRows}</div>
                  <div className="text-[11px] text-rose-300">Incompletas / Error</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-300">Encabezados identificados: </span>
                <span className="text-emerald-400 font-mono">{analysis.headers.join(', ')}</span>
              </div>
            </div>
          )}

          {/* STEP 3: Relacionar Columnas & Destino */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Selecciona la disciplina y categoría destino para asignar este grupo de deportistas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Disciplina Asignada
                  </label>
                  <select
                    value={selectedDisciplineId}
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Categoría / División
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    {categories
                      .filter(c => !selectedDisciplineId || c.disciplineId === selectedDisciplineId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} · {c.gender}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Vista Previa */}
          {step === 4 && analysis && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Primeras filas procesadas:</span>
                <span>{analysis.rows.length} registros listos</span>
              </div>
              <div className="overflow-x-auto max-h-60 border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400">
                    <tr>
                      <th className="p-2.5">DNI</th>
                      <th className="p-2.5">Nombre y Apellido</th>
                      <th className="p-2.5">Nacimiento</th>
                      <th className="p-2.5">Teléfono</th>
                      <th className="p-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {analysis.rows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-850/50">
                        <td className="p-2.5 font-mono text-emerald-400">{r.mapped.dni}</td>
                        <td className="p-2.5 font-medium">{r.mapped.firstName} {r.mapped.lastName}</td>
                        <td className="p-2.5 text-slate-400">{r.mapped.birthDate || '-'}</td>
                        <td className="p-2.5 text-slate-400">{r.mapped.phone || '-'}</td>
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> OK
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: Detección y Resolución de Duplicados */}
          {step === 5 && analysis && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Conflictos de DNI detectados: {analysis.duplicateDniCount}</div>
                  <div>
                    Uno o más DNI en el archivo coinciden con deportistas ya registrados en {currentClub.name}. ¿Cómo deseas proceder?
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                  <input
                    type="radio"
                    name="dupStrategy"
                    checked={duplicateStrategy === 'skip'}
                    onChange={() => setDuplicateStrategy('skip')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Omitir registros existentes (Recomendado)</div>
                    <div className="text-[11px] text-slate-400">Conserva la ficha actual del club y solo añade a los nuevos jugadores.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-850 rounded-xl border border-slate-700/60 cursor-pointer">
                  <input
                    type="radio"
                    name="dupStrategy"
                    checked={duplicateStrategy === 'update'}
                    onChange={() => setDuplicateStrategy('update')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Actualizar datos de existentes</div>
                    <div className="text-[11px] text-slate-400">Sobrescribe teléfono, email y datos personales del DNI coincidente.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmación & Resultado */}
          {step === 6 && importResult && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                ¡Importación Completada con Éxito!
              </h3>
              <p className="text-xs text-slate-400">
                Los registros han sido procesados y sincronizados bajo la política RLS del club.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-3 bg-slate-800/80 rounded-xl text-center">
                  <div className="text-lg font-bold text-emerald-400">+{importResult.imported}</div>
                  <div className="text-[10px] text-slate-400">Nuevos Inscriptos</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl text-center">
                  <div className="text-lg font-bold text-blue-400">{importResult.updated}</div>
                  <div className="text-[10px] text-slate-400">Actualizados</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl text-center">
                  <div className="text-lg font-bold text-amber-400">{importResult.skipped}</div>
                  <div className="text-[10px] text-slate-400">Omitidos (Duplicados)</div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl text-center">
                  <div className="text-lg font-bold text-rose-400">{importResult.restricted}</div>
                  <div className="text-[10px] text-slate-400">Restringidos (Cupo)</div>
                </div>
              </div>

              {importResult.restricted > 0 && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 text-left flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atención:</strong> {importResult.restricted} jugadores superaron el cupo de {currentClub.contractedPlayersQuota} de su plan. Se encuentran almacenados en modo <strong>Solo Lectura</strong> hasta que se amplíe la capacidad contratada.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          {step > 1 && step < 6 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
          ) : <div />}

          {step < 5 && analysis && (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-xs transition"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Confirmar & Procesar Importación
            </button>
          )}

          {step === 6 && (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs transition ml-auto"
            >
              Cerrar y Ver Padrón
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
