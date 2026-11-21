export interface ParsedImportRow {
  raw: Record<string, string>;
  mapped: {
    dni: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    phone?: string;
    email?: string;
    disciplineName?: string;
    categoryName?: string;
    monthlyFee?: number;
  };
  isValid: boolean;
  validationErrors: string[];
  isDuplicateInFile: boolean;
  isDuplicateInClub: boolean;
  conflictDetails?: string;
}

export interface ImportAnalysisResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateDniCount: number;
  headers: string[];
  rows: ParsedImportRow[];
}

export function parseCsvContent(
  text: string,
  existingDnis: Set<string>
): ImportAnalysisResult {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { totalRows: 0, validRows: 0, invalidRows: 0, duplicateDniCount: 0, headers: [], rows: [] };
  }

  // Detect delimiter (, or ;)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows: ParsedImportRow[] = [];
  const seenDnisInFile = new Set<string>();

  // Detect default column mappings
  const dniIdx = headers.findIndex(h => /dni|documento|cedula|identificacion/i.test(h));
  const nameIdx = headers.findIndex(h => /nombre|nombres/i.test(h) && !/apellido/i.test(h));
  const lastNameIdx = headers.findIndex(h => /apellido|apellidos/i.test(h));
  const fullNameIdx = headers.findIndex(h => /nombre y apellido|apellido y nombre|alumno|jugador/i.test(h));
  const birthIdx = headers.findIndex(h => /nacimiento|fecha_nac|cumple/i.test(h));
  const phoneIdx = headers.findIndex(h => /telefono|celular|movil|tel/i.test(h));
  const emailIdx = headers.findIndex(h => /email|correo/i.test(h));
  const feeIdx = headers.findIndex(h => /cuota|arancel|importe/i.test(h));
  const catIdx = headers.findIndex(h => /categoria|division/i.test(h));
  const discIdx = headers.findIndex(h => /disciplina|deporte/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = cols[idx] || '';
    });

    const dni = dniIdx >= 0 ? cols[dniIdx] || '' : '';
    let firstName = nameIdx >= 0 ? cols[nameIdx] || '' : '';
    let lastName = lastNameIdx >= 0 ? cols[lastNameIdx] || '' : '';

    if (!firstName && !lastName && fullNameIdx >= 0 && cols[fullNameIdx]) {
      const parts = cols[fullNameIdx].split(' ');
      if (parts.length >= 2) {
        lastName = parts[0];
        firstName = parts.slice(1).join(' ');
      } else {
        firstName = cols[fullNameIdx];
        lastName = '';
      }
    }

    const birthDate = birthIdx >= 0 ? cols[birthIdx] : '';
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : '';
    const email = emailIdx >= 0 ? cols[emailIdx] : '';
    const feeStr = feeIdx >= 0 ? cols[feeIdx]?.replace(/[^0-9.]/g, '') : '';
    const monthlyFee = feeStr ? parseFloat(feeStr) : undefined;
    const categoryName = catIdx >= 0 ? cols[catIdx] : '';
    const disciplineName = discIdx >= 0 ? cols[discIdx] : '';

    const validationErrors: string[] = [];
    if (!dni) validationErrors.push('DNI requerido');
    if (!firstName) validationErrors.push('Nombre requerido');
    if (!lastName) validationErrors.push('Apellido requerido');

    const cleanDni = dni.replace(/\D/g, '');
    const isDuplicateInFile = cleanDni ? seenDnisInFile.has(cleanDni) : false;
    if (cleanDni) seenDnisInFile.add(cleanDni);

    const isDuplicateInClub = cleanDni ? existingDnis.has(cleanDni) : false;

    let conflictDetails: string | undefined;
    if (isDuplicateInClub) conflictDetails = 'DNI ya existente en la base del club.';
    if (isDuplicateInFile) conflictDetails = (conflictDetails ? conflictDetails + ' ' : '') + 'DNI duplicado en el mismo archivo.';

    const isValid = validationErrors.length === 0;

    rows.push({
      raw,
      mapped: {
        dni: cleanDni || dni,
        firstName,
        lastName,
        birthDate,
        phone,
        email,
        monthlyFee,
        categoryName,
        disciplineName
      },
      isValid,
      validationErrors,
      isDuplicateInFile,
      isDuplicateInClub,
      conflictDetails
    });
  }

  const validRows = rows.filter(r => r.isValid).length;
  const invalidRows = rows.filter(r => !r.isValid).length;
  const duplicateDniCount = rows.filter(r => r.isDuplicateInClub || r.isDuplicateInFile).length;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateDniCount,
    headers,
    rows
  };
}

export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const keys = Object.keys(data[0]);
  const csvRows: string[] = [];
  
  // Header
  csvRows.push(keys.map(k => `"${k}"`).join(';'));

  // Rows
  for (const row of data) {
    const values = keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(';'));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // BOM for Excel UTF-8
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
