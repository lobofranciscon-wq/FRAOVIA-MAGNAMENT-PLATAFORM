import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  HelpCircle,
  RefreshCw,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Category, Club, Discipline, Player, User } from '../../types/fraovia';
import { fraoviaDB } from '../../services/fraoviaStore';
import { dataActions } from '../../services/dataActions';
import { useAppTheme } from '../../context/ThemeContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: User;
  categories: Category[];
  disciplines: Discipline[];
  onImportComplete: () => void;
}

interface ParsedPlayerRow {
  originalIndex: number;
  fullName: string;
  lastName: string;
  firstName: string;
  dni: string;
  rawDni: string;
  birthDate: string; // YYYY-MM-DD
  rawBirthDate: string;
  insurance: string; // e.g. "P", "A"
  months: Record<string, 'P' | 'A' | '-'>;
  unpaidMonthsCount: number;
  calculatedDebt: number;
  tutorName?: string;
  tutorEmail?: string;
  tutorPhone?: string;
  isValid: boolean;
  validationError?: string;
}

const MONTH_KEYS = ['FEB', 'MAR', 'ABRIL', 'MAYO', 'JUN', 'JUL', 'AGOS', 'SEPT', 'OCT', 'NOV', 'DIC'];

// Plantilla Rápida (3 Columnas mínimas indispensables)
const SAMPLE_EXCEL_MINIMAL_ROWS = [
  { 'DNI': '53.112.098', 'APELLIDO Y NOMBRE': 'CASTRO MATIAS NAHUEL', 'CELULAR': '+54 11 5566-7788' },
  { 'DNI': '52.889.012', 'APELLIDO Y NOMBRE': 'MEDINA JOAQUIN', 'CELULAR': '+54 11 9988-1122' },
  { 'DNI': '52.334.901', 'APELLIDO Y NOMBRE': 'HERRERA BENICIO', 'CELULAR': '+54 11 4433-2211' },
  { 'DNI': '51.098.112', 'APELLIDO Y NOMBRE': 'PERALTA THIAGO', 'CELULAR': '+54 11 3322-9988' },
  { 'DNI': '48.901.234', 'APELLIDO Y NOMBRE': 'LUCERO BAUTISTA', 'CELULAR': '+54 11 7788-9900' }
];

// Sample dataset accurately replicating the user's screenshot
const SAMPLE_EXCEL_ROWS = [
  { fullName: 'ALVARADO SANTINO JOAQUIN', dni: '52.579-338', birthDate: '16/9/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Mariana Alvarado', tutorPhone: '+54 11 4455-8801', tutorEmail: 'alvarado.familia@gmail.com' },
  { fullName: 'AGÜERO ROMANO MAXIMO', dni: '52384862', birthDate: '29/6/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: '', JUN: '', JUL: '', AGOS: '', tutorName: 'Sergio Agüero', tutorPhone: '+54 11 4455-8802', tutorEmail: 'aguero.maxi@gmail.com' },
  { fullName: 'BOURNOVILLE MATEO', dni: '52.390.887', birthDate: '16/9/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Claudio Bournoville', tutorPhone: '+54 11 4455-8803', tutorEmail: 'bournoville.m@gmail.com' },
  { fullName: 'BUSTOS ELIAS SANTIAGO', dni: '52.387.669', birthDate: '6/5/2012', insurance: 'P/1 -', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Patricia Bustos', tutorPhone: '+54 11 4455-8804', tutorEmail: 'patricia.bustos@gmail.com' },
  { fullName: 'CABEZA BAUTISTA ARON', dni: '52388177', birthDate: '06/06/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Lucas Cabeza', tutorPhone: '+54 11 4455-8805', tutorEmail: 'cabeza.bautista@gmail.com' },
  { fullName: 'CAJAL JOSE MATEO', dni: '52.578.257', birthDate: '27/7/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Ramiro Cajal', tutorPhone: '+54 11 4455-8806', tutorEmail: 'cajal.mateo@gmail.com' },
  { fullName: 'CANO SANTINO JONAS', dni: '52 384 780', birthDate: '6/8/2012', insurance: 'P', FEB: 'A', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'A', JUL: 'A', AGOS: '', tutorName: 'Esteban Cano', tutorPhone: '+54 11 4455-8807', tutorEmail: 'esteban.cano@gmail.com' },
  { fullName: 'CORDOBA TOMAS LUCIANO', dni: '52149335', birthDate: '14/2/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Hernán Córdoba', tutorPhone: '+54 11 4455-8808', tutorEmail: 'cordoba.tomas@gmail.com' },
  { fullName: 'FERREYRA DILAN MARCELO TIZIANO', dni: '52734908', birthDate: '5/11/2012', insurance: 'P', FEB: 'A', MAR: 'A', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Tiziana Ferreyra', tutorPhone: '+54 11 4455-8809', tutorEmail: 'ferreyra.dilan@gmail.com' },
  { fullName: 'FIGUEROA IAN ALEXANDER', dni: '52733702', birthDate: '21/9/2012', insurance: 'P', FEB: 'A', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Gonzalo Figueroa', tutorPhone: '+54 11 4455-8810', tutorEmail: 'figueroa.ian@gmail.com' },
  { fullName: 'GONZALES BAUTISTA GAEL', dni: '52388771', birthDate: '12/6/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Paula Gonzales', tutorPhone: '+54 11 4455-8811', tutorEmail: 'gonzales.bautista@gmail.com' },
  { fullName: 'GONZALES DILAN GABRIEL', dni: '52149787', birthDate: '7/3/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Paula Gonzales', tutorPhone: '+54 11 4455-8812', tutorEmail: 'gonzales.dilan@gmail.com' },
  { fullName: 'GUTIERREZ LAUTARO JONAS', dni: '52579672', birthDate: '10/03/2012', insurance: 'P/1 -', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Marcelo Gutierrez', tutorPhone: '+54 11 4455-8813', tutorEmail: 'gutierrez.lautaro@gmail.com' },
  { fullName: 'LUNA SANTINO GABRIEL', dni: '52572834', birthDate: '9/9/2012', insurance: 'P/1 -', FEB: 'A', MAR: 'A', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Natalia Luna', tutorPhone: '+54 11 4455-8814', tutorEmail: 'luna.santino@gmail.com' },
  { fullName: 'NIEVA BENJAMIN ALEJANDRO', dni: '52380476', birthDate: '12/03/2012', insurance: 'P', FEB: 'A', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Jorge Nieva', tutorPhone: '+54 11 4455-8815', tutorEmail: 'nieva.benjamin@gmail.com' },
  { fullName: 'PAZ FRANCO JAVIER', dni: '52 579 978', birthDate: '10/5/2012', insurance: 'P/1 -', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Susana Paz', tutorPhone: '+54 11 4455-8816', tutorEmail: 'paz.franco@gmail.com' },
  { fullName: 'SALINAS DYLAN BLAS', dni: '52.733.710', birthDate: '18/9/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Walter Salinas', tutorPhone: '+54 11 4455-8817', tutorEmail: 'salinas.dylan@gmail.com' },
  { fullName: 'SANTILLAN ALVARO JESUS', dni: '52383311', birthDate: '22/4/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Marta Santillan', tutorPhone: '+54 11 4455-8818', tutorEmail: 'santillan.alvaro@gmail.com' },
  { fullName: 'SANTUCHO MAXIMO ANGEL', dni: '52733545', birthDate: '6/9/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Rubén Santucho', tutorPhone: '+54 11 4455-8819', tutorEmail: 'santucho.maximo@gmail.com' },
  { fullName: 'SERCAN THIAGO MATEO', dni: '52391804', birthDate: '21/7/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Gisela Sercan', tutorPhone: '+54 11 4455-8820', tutorEmail: 'sercan.thiago@gmail.com' },
  { fullName: 'SILVA LUCIANO NICOLAS', dni: '52734100', birthDate: '7/10/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Cristian Silva', tutorPhone: '+54 11 4455-8821', tutorEmail: 'silva.luciano@gmail.com' },
  { fullName: 'VELARDES BRANDON LAUTARO', dni: '52382339', birthDate: '3/3/2012', insurance: 'P/1-', FEB: 'A', MAR: 'A', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Franco Velardes', tutorPhone: '+54 11 4455-8822', tutorEmail: 'velardes.brandon@gmail.com' },
  { fullName: 'VELAZQUEZ AXEL EZEQUIEL', dni: '52.578.371', birthDate: '26/7/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: '', tutorName: 'Héctor Velazquez', tutorPhone: '+54 11 4455-8823', tutorEmail: 'velazquez.axel@gmail.com' },
  { fullName: 'RUIZ MARCOS YUTIEL', dni: '52.149.913', birthDate: '28/1/2012', insurance: 'P', FEB: 'A', MAR: 'A', ABRIL: 'A', MAYO: 'A', JUN: 'A', JUL: 'P', AGOS: 'P', tutorName: 'Sabrina Ruiz', tutorPhone: '+54 11 4455-8824', tutorEmail: 'ruiz.marcos@gmail.com' },
  { fullName: 'BUSTOS JOAQUIEN DIEGO', dni: '52.387.670', birthDate: '6/5/2012', insurance: 'P', FEB: 'P', MAR: 'P', ABRIL: 'P', MAYO: 'P', JUN: 'P', JUL: 'P', AGOS: 'P', tutorName: 'Patricia Bustos', tutorPhone: '+54 11 4455-8825', tutorEmail: 'bustos.joaquin@gmail.com' }
];

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  categories,
  disciplines,
  onImportComplete
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatGender, setNewCatGender] = useState<'Masculino' | 'Femenino' | 'Mixto'>('Masculino');
  const [newCatDisciplineId, setNewCatDisciplineId] = useState<string>(disciplines[0]?.id || '');
  const [parsedRows, setParsedRows] = useState<ParsedPlayerRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [customFee, setCustomFee] = useState<number>(categories[0]?.monthlyFee || 22000);
  const [filterMode, setFilterMode] = useState<'all' | 'unpaid' | 'paid'>('all');

  const selectedCategory = categories.find(c => c.id === selectedCatId) || categories[0];
  const selectedDiscipline = disciplines.find(d => d.id === (isCreatingNewCat ? newCatDisciplineId : selectedCategory?.disciplineId));

  // Helper to normalize and split "APELLIDO Y NOMBRE"
  const splitFullName = (full: string): { lastName: string; firstName: string } => {
    const trimmed = (full || '').trim().replace(/\s+/g, ' ');
    const parts = trimmed.split(' ');
    if (parts.length === 1) return { lastName: parts[0], firstName: parts[0] };
    if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
    if (parts.length === 3) return { lastName: parts[0], firstName: `${parts[1]} ${parts[2]}` };
    // 4 or more words: e.g. "FERREYRA DILAN MARCELO TIZIANO" -> lastName: "FERREYRA", firstName: "DILAN MARCELO TIZIANO"
    return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
  };

  // Helper to normalize Argentine date format (DD/MM/YYYY or D/M/YYYY or 12703/2012)
  const normalizeBirthDate = (raw: string | number): string => {
    if (!raw) return '2012-06-15';
    if (typeof raw === 'number') {
      // Excel serial date number
      const date = new Date(Math.round((raw - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    const str = String(raw).trim().replace(/\./g, '/').replace(/-/g, '/');
    const parts = str.split('/');
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (day > 1000) day = day % 31 || 15; // Typo fix like 12703 -> 12
      if (month < 1 || month > 12) month = 6;
      if (year < 100) year += 2000;
      if (isNaN(year) || year < 1980 || year > 2026) year = 2012;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return '2012-06-15';
  };

  // Helper to normalize DNI (clean dots, dashes, spaces)
  const cleanDni = (raw: string | number): string => {
    return String(raw || '').replace(/[^\d]/g, '');
  };

  // Parse raw sheet data into typed rows (supports both 3-column minimal and full 15+ column sheets)
  const processRawData = (rows: any[], sourceName: string) => {
    const fee = customFee || selectedCategory?.monthlyFee || 22000;

    // Detect default birth year from selected category (e.g. "Categoría 2012" -> "2012-06-15")
    const categoryYearMatch = selectedCategory?.name?.match(/\b(19\d\d|20\d\d)\b/);
    const fallbackYear = categoryYearMatch ? categoryYearMatch[1] : '2012';
    const fallbackBirthDate = `${fallbackYear}-06-15`;

    const parsed: ParsedPlayerRow[] = rows.map((row, idx) => {
      const keys = Object.keys(row);

      // 1. Separate or combined names
      const lastNameKey = keys.find(k => /^apellido/i.test(k.trim()));
      const firstNameKey = keys.find(k => /^nombre/i.test(k.trim()) && !/apellido/i.test(k.trim()));
      
      let lastName = '';
      let firstName = '';
      let fullName = '';

      if (lastNameKey && firstNameKey && lastNameKey !== firstNameKey && row[lastNameKey] && row[firstNameKey]) {
        lastName = String(row[lastNameKey]).trim();
        firstName = String(row[firstNameKey]).trim();
        fullName = `${lastName} ${firstName}`;
      } else {
        const nameKey = keys.find(k => /apellido/i.test(k) || /nombre/i.test(k) || /jugador/i.test(k) || /socio/i.test(k) || /alumno/i.test(k) || /deportista/i.test(k)) || keys[0];
        fullName = String(row[nameKey] || '').trim();
        const split = splitFullName(fullName);
        lastName = split.lastName;
        firstName = split.firstName;
      }

      // 2. DNI
      const dniKey = keys.find(k => /dni/i.test(k) || /doc/i.test(k) || /cedula/i.test(k) || /matricula/i.test(k)) 
        || keys.find(k => k !== lastNameKey && k !== firstNameKey && cleanDni(row[k]).length >= 6) 
        || keys[1];
      const rawDni = String(row[dniKey] || '').trim();
      const dni = cleanDni(rawDni);

      // 3. Birth date (do NOT accidentally pick phone numbers)
      const birthKey = keys.find(k => (/fec/i.test(k) || /nac/i.test(k) || /cumple/i.test(k) || /edad/i.test(k)) && !/cel/i.test(k) && !/tel/i.test(k));
      const rawBirthDate = birthKey ? String(row[birthKey] || '').trim() : '';
      const birthDate = rawBirthDate ? normalizeBirthDate(rawBirthDate) : fallbackBirthDate;

      // 4. Contact / Tutor info
      const insKey = keys.find(k => /seguro/i.test(k));
      const insurance = insKey ? String(row[insKey] || 'P').trim() : 'P';
      const tutorKey = keys.find(k => /tutor/i.test(k) || /padre/i.test(k) || /madre/i.test(k) || /responsable/i.test(k));
      const emailKey = keys.find(k => /gmail/i.test(k) || /mail/i.test(k) || /correo/i.test(k));
      const phoneKey = keys.find(k => /celular/i.test(k) || /tel/i.test(k) || /whatsapp/i.test(k) || /movil/i.test(k) || /contacto/i.test(k));

      const tutorPhone = phoneKey && row[phoneKey] ? String(row[phoneKey]).trim() : '+54 11 4455-0000';
      const tutorEmail = emailKey && row[emailKey] ? String(row[emailKey]).trim() : `${firstName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
      const tutorName = tutorKey && row[tutorKey] ? String(row[tutorKey]).trim() : `Tutor de ${firstName}`;

      // 5. Months parsing (optional; if sheet doesn't have months, alumno enters with $0 debt)
      const months: Record<string, 'P' | 'A' | '-'> = {};
      let unpaidMonthsCount = 0;

      MONTH_KEYS.forEach(m => {
        const foundMonthKey = keys.find(k => new RegExp(`^${m}`, 'i').test(k.trim()));
        if (foundMonthKey && row[foundMonthKey] !== undefined) {
          const val = String(row[foundMonthKey]).trim().toUpperCase();
          if (val.includes('P') || val === '1' || val === 'SI') {
            months[m] = 'P';
          } else if (val.includes('A') || val === '0' || val === 'DEBE') {
            months[m] = 'A';
            unpaidMonthsCount++;
          } else {
            months[m] = '-';
          }
        } else {
          months[m] = '-';
        }
      });

      const calculatedDebt = unpaidMonthsCount * fee;
      const isValid = dni.length >= 6 && fullName.length >= 3;

      return {
        originalIndex: idx + 1,
        fullName,
        lastName,
        firstName,
        dni,
        rawDni,
        birthDate,
        rawBirthDate,
        insurance,
        months,
        unpaidMonthsCount,
        calculatedDebt,
        tutorName,
        tutorEmail,
        tutorPhone,
        isValid,
        validationError: !isValid ? 'DNI o Nombre incompleto' : undefined
      };
    });

    setParsedRows(parsed);
    setFileName(sourceName);
  };

  // Load sample dataset
  const handleLoadSample = () => {
    processRawData(SAMPLE_EXCEL_ROWS, 'Planilla_Oficial_Club_2012.xlsx');
  };

  // Load minimal 3-column sample dataset
  const handleLoadMinimalSample = () => {
    processRawData(SAMPLE_EXCEL_MINIMAL_ROWS, 'Planilla_Rapida_3Columnas.xlsx');
  };

  // Handle real file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('El archivo no contiene filas con datos válidos.');
          setIsProcessing(false);
          return;
        }

        processRawData(data, file.name);
      } catch (err: any) {
        console.error('Error parsing excel', err);
        alert('Error al leer el archivo Excel: ' + (err.message || 'Formato no soportado.'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Export blank template with exact columns matching full image
  const handleDownloadTemplate = () => {
    const headers = [
      {
        'APELLIDO Y NOMBRE': 'EJEMPLO PEREZ LUCAS',
        'DNI': '52.123.456',
        'FEC. NAC': '15/06/2012',
        'SEGURO': 'P',
        'FEB': 'P',
        'MAR': 'P',
        'ABRIL': 'P',
        'MAYO': 'P',
        'JUN': 'P',
        'JUL': 'P',
        'AGOS': 'P',
        'SEPT': '',
        'OCT': '',
        'NOV': '',
        'DIC': '',
        'TUTOR': 'Carlos Perez',
        'CELULAR': '+54 11 4444-5555',
        'GMAIL': 'perez.familia@gmail.com'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Completa');
    XLSX.writeFile(wb, `Plantilla_Completa_FRAOVIA_${currentClub.name.replace(/\s+/g, '_')}.xlsx`);
  };

  // Export minimal 3-column template (fastest import)
  const handleDownloadMinimalTemplate = () => {
    const headers = [
      {
        'DNI': '52123456',
        'APELLIDO Y NOMBRE': 'PEREZ LUCAS MATEO',
        'CELULAR_WHATSAPP': '+54 11 4455-8800'
      },
      {
        'DNI': '52987654',
        'APELLIDO Y NOMBRE': 'GONZALEZ BAUTISTA',
        'CELULAR_WHATSAPP': '+54 11 4455-8801'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Rapida');
    XLSX.writeFile(wb, `Plantilla_Rapida_3Cols_FRAOVIA_${currentClub.name.replace(/\s+/g, '_')}.xlsx`);
  };

  // Confirm import into database
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No hay filas válidas para importar.');
      return;
    }

    let targetCatId = selectedCategory?.id;
    let targetDisciplineId = selectedCategory?.disciplineId || disciplines[0]?.id;
    let targetCatName = selectedCategory?.name || 'Categoría Destino';

    // If user chose to create a new category
    if (isCreatingNewCat || selectedCatId === '__NEW__' || !targetCatId) {
      if (!newCatName.trim()) {
        alert('Por favor ingrese el nombre para la nueva categoría de destino antes de importar.');
        return;
      }

      try {
        const created = await dataActions.createCategory(currentClub.id, {
          disciplineId: newCatDisciplineId || disciplines[0]?.id || 'disc-1',
          name: newCatName.trim(),
          ageGroup: 'Formativa',
          gender: newCatGender,
          monthlyFee: customFee || 22000,
          colorBlockName: 'General'
        } as any, currentUser);

        targetCatId = created.id;
        targetDisciplineId = created.disciplineId;
        targetCatName = created.name;
      } catch (err: any) {
        alert('Error al crear la nueva categoría: ' + (err.message || 'Error desconocido'));
        return;
      }
    }

    if (!confirm(`¿Importar ${validRows.length} deportistas a la categoría "${targetCatName}"? Los meses adeudados generarán el saldo contable correspondiente.`)) {
      return;
    }

    const playersToImport: Array<Omit<Player, 'id' | 'isRestricted'>> = validRows.map(r => ({
      clubId: currentClub.id,
      disciplineId: targetDisciplineId,
      categoryId: targetCatId,
      dni: r.dni,
      firstName: r.firstName,
      lastName: r.lastName,
      birthDate: r.birthDate,
      phone: r.tutorPhone || '+54 11 0000-0000',
      email: r.tutorEmail || `${r.firstName.toLowerCase()}@club.com`,
      emergencyContact: {
        name: r.tutorName || 'Tutor registrado',
        relationship: 'Padre/Madre/Tutor',
        phone: r.tutorPhone || '+54 11 0000-0000'
      },
      medicalCertificateValid: r.insurance === 'P' || r.insurance.includes('P'),
      medicalExpiryDate: '2027-03-31',
      status: 'activo',
      monthlyFeeDue: customFee,
      balance: r.calculatedDebt, // exact debt from unpaid months!
      joinedDate: '2026-02-01',
      insuranceStatus: r.insurance,
      monthlyPayments: r.months
    }));

    try {
      const res = await dataActions.importPlayersBatch(playersToImport, currentUser);
      const skipped = res.skippedDnis.length > 0
        ? ` Se omitieron ${res.skippedDnis.length} por DNI ya existente: ${res.skippedDnis.slice(0, 10).join(', ')}${res.skippedDnis.length > 10 ? '…' : ''}.`
        : '';
      alert(`¡Importación finalizada! ${res.successCount} deportistas incorporados a "${targetCatName}".${skipped}`);
      onImportComplete();
      onClose();
    } catch (err: any) {
      alert('Error en importación: ' + (err.message || 'Error desconocido'));
    }
  };

  // Filtered rows for preview table
  const displayedRows = parsedRows.filter(r => {
    if (filterMode === 'unpaid') return r.unpaidMonthsCount > 0;
    if (filterMode === 'paid') return r.unpaidMonthsCount === 0;
    return true;
  });

  const totalUnpaidRows = parsedRows.filter(r => r.unpaidMonthsCount > 0).length;
  const totalPaidRows = parsedRows.filter(r => r.unpaidMonthsCount === 0).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] transition-colors ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B1528] border-slate-800 text-slate-100'
      }`}>
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  Padrón & Cuotas
                </span>
                <span className="text-xs text-emerald-200">
                  {currentClub.name}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white mt-0.5">
                Importador de Planillas Excel con Historial de Pagos
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadMinimalTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition cursor-pointer border border-emerald-500/40"
              title="Descargar plantilla ágil de solo 3 columnas (DNI, Nombre, Celular)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Rápida (3 Cols)</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/20"
              title="Descargar archivo Excel con las columnas completas (datos + historial de cuotas)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla Completa</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Strip: Target Category, Monthly Fee & Quick Loader */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className={isCreatingNewCat || selectedCatId === '__NEW__' ? 'sm:col-span-2' : ''}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Categoría destino:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCreatingNewCat;
                    setIsCreatingNewCat(next);
                    if (next) {
                      setSelectedCatId('__NEW__');
                    } else {
                      setSelectedCatId(categories[0]?.id || '');
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    isCreatingNewCat || selectedCatId === '__NEW__'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isCreatingNewCat || selectedCatId === '__NEW__' ? '✕ Usar Existente' : '✨ + Nuevo'}
                </button>
              </div>

              {!isCreatingNewCat && selectedCatId !== '__NEW__' ? (
                <select
                  value={selectedCatId}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsCreatingNewCat(true);
                      setSelectedCatId('__NEW__');
                    } else {
                      setIsCreatingNewCat(false);
                      setSelectedCatId(e.target.value);
                      const found = categories.find(c => c.id === e.target.value);
                      if (found) setCustomFee(found.monthlyFee);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="__NEW__" className="text-amber-400 font-bold bg-slate-950">
                    ✨ + NUEVO (Poner nombre y crear categoría nueva)...
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gender}) · ${c.monthlyFee.toLocaleString('es-AR')}/mes
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Escriba nombre de la categoría (ej: Categoría 2012 / Sub 13 Formativa)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <select
                      value={newCatGender}
                      onChange={(e) => setNewCatGender(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-bold text-xs"
                      title="Género de la categoría"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                  {disciplines.length > 1 && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">Deporte:</span>
                      <select
                        value={newCatDisciplineId}
                        onChange={(e) => setNewCatDisciplineId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white"
                      >
                        {disciplines.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <p className="text-[10px] text-amber-300">
                    💡 Se registrará automáticamente como nueva categoría oficial del club al importar los alumnos.
                  </p>
                </div>
              )}
            </div>

            <div className={isCreatingNewCat || selectedCatId === '__NEW__' ? 'sm:col-span-1' : ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Arancel cuota ($ ARS):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className={`flex items-end ${isCreatingNewCat || selectedCatId === '__NEW__' ? 'sm:col-span-1' : ''}`}>
              <button
                onClick={handleLoadSample}
                className="w-full py-2 px-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/20 truncate"
                title="Cargar los 25 alumnos con historial mes a mes"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Demo Completa (25 Alumnos)</span>
              </button>
            </div>

            {(!isCreatingNewCat && selectedCatId !== '__NEW__') && (
              <div className="flex items-end">
                <button
                  onClick={handleLoadMinimalSample}
                  className="w-full py-2 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow truncate"
                  title="Cargar demo rápida de solo 3 columnas (DNI, Nombre, Celular)"
                >
                  <Table className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Demo Rápida (3 Cols)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dropzone Area or Loaded Summary */}
        <div className="p-4 border-b border-slate-800 bg-[#0C162D] space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {parsedRows.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-950/10 transition cursor-pointer text-center space-y-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto group-hover:scale-110 transition">
                <Upload className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h4 className="font-bold text-white text-sm">
                Arrastra tu archivo Excel aquí o haz clic para seleccionarlo
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Soporta planillas con columnas: <strong>APELLIDO Y NOMBRE, DNI, FEC. NAC, SEGURO, FEB, MAR, ABRIL...</strong> y datos de contacto de tutores.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{fileName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {parsedRows.length} deportistas detectados
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {totalPaidRows} socios con cuotas al día · {totalUnpaidRows} con meses adeudados (A)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer border border-slate-800"
                >
                  Cargar otro archivo
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300/60"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar & Dar de Alta ({parsedRows.filter(r => r.isValid).length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Data Table */}
        {parsedRows.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Vista Previa de Alumnos & Meses de Pagos (P = Pagado / A = Adeuda)
                </span>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                    filterMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({parsedRows.length})
                </button>
                <button
                  onClick={() => setFilterMode('paid')}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                    filterMode === 'paid' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
                  }`}
                >
                  Al Día ({totalPaidRows})
                </button>
                <button
                  onClick={() => setFilterMode('unpaid')}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                    filterMode === 'unpaid' ? 'bg-amber-600 text-white' : 'text-amber-400'
                  }`}
                >
                  Con Deuda ({totalUnpaidRows})
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/70 max-h-[46vh]">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-[#0C162D] text-slate-400 uppercase font-mono text-[10px] sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Apellido y Nombre</th>
                    <th className="py-2.5 px-3">DNI</th>
                    <th className="py-2.5 px-3">Fec. Nac</th>
                    <th className="py-2.5 px-2 text-center">Seguro</th>
                    {MONTH_KEYS.map((m) => (
                      <th key={m} className="py-2.5 px-2 text-center">{m}</th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Saldo Inicial</th>
                    <th className="py-2.5 px-3">Tutor / Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {displayedRows.map((r, i) => {
                    const isDebtor = r.unpaidMonthsCount > 0;

                    return (
                      <tr key={i} className="hover:bg-slate-900/60 transition">
                        <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{r.originalIndex}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-white block">{r.fullName}</span>
                          <span className="text-[10px] text-slate-400">
                            {r.lastName}, {r.firstName}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-200">
                          {r.rawDni}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-300">
                          {r.rawBirthDate}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold font-mono text-[10px]">
                            {r.insurance}
                          </span>
                        </td>

                        {/* Months with Green (P) and Yellow (A) matching Excel reference */}
                        {MONTH_KEYS.map((m) => {
                          const status = r.months[m] || '-';
                          const isP = status === 'P';
                          const isA = status === 'A';

                          return (
                            <td key={m} className="py-2 px-1 text-center font-mono">
                              {isP && (
                                <span className="inline-block w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-black text-[11px] leading-5 shadow-xs">
                                  P
                                </span>
                              )}
                              {isA && (
                                <span className="inline-block w-5 h-5 rounded-md bg-red-600 text-white font-black text-[11px] leading-5 shadow-xs animate-pulse">
                                  A
                                </span>
                              )}
                              {!isP && !isA && (
                                <span className="text-slate-600 font-mono">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Calculated Debt */}
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {isDebtor ? (
                            <span className="text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                              Debe ${r.calculatedDebt.toLocaleString('es-AR')}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              Al Día
                            </span>
                          )}
                        </td>

                        {/* Tutor info */}
                        <td className="py-2 px-3 text-slate-300">
                          <div className="truncate max-w-[140px] font-medium">{r.tutorName}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{r.tutorPhone}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Mostrando {displayedRows.length} de {parsedRows.length} deportistas
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {totalPaidRows} sin deuda
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {totalUnpaidRows} con meses adeudados
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400">
            Importación automática FRAOVIA · Crea fichas oficiales y registra el estado contable de cuotas
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
            {parsedRows.length > 0 && (
              <button
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar e Importar {parsedRows.filter(r => r.isValid).length} Alumnos</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
