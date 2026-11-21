import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Plus, 
  FileCheck, 
  CreditCard, 
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  UserCheck,
  User,
  DollarSign,
  Coins,
  Calendar,
  Layers,
  Sparkles,
  Check,
  ChevronDown,
  Building2,
  Users,
  GraduationCap
} from 'lucide-react';
import { CashBox, Category, Club, PaymentMethod, Player, Receipt, ReceiptItem, ReceiptItemKind, ChargeType, CHARGE_TYPE_LABELS, User as FraoviaUser } from '../../types/fraovia';
import { dataActions } from '../../services/dataActions';
import { isPendingFirstPayment } from '../../services/paymentStatus';
import { supabaseReceiptService } from '../../services/supabaseReceiptService';
import { supabaseDataService, formatSupabaseError } from '../../services/supabaseDataService';
import { supabaseAuditService } from '../../services/supabaseAuditService';
import { PlayerImage } from '../common/PlayerImage';

const ALL_MONTHS: { key: string; label: string; full: string }[] = [
  { key: 'FEB', label: 'FEB', full: 'Febrero' },
  { key: 'MAR', label: 'MAR', full: 'Marzo' },
  { key: 'ABRIL', label: 'ABR', full: 'Abril' },
  { key: 'MAYO', label: 'MAY', full: 'Mayo' },
  { key: 'JUN', label: 'JUN', full: 'Junio' },
  { key: 'JUL', label: 'JUL', full: 'Julio' },
  { key: 'AGOS', label: 'AGO', full: 'Agosto' },
  { key: 'SEPT', label: 'SEP', full: 'Septiembre' },
  { key: 'OCT', label: 'OCT', full: 'Octubre' },
  { key: 'NOV', label: 'NOV', full: 'Noviembre' },
  { key: 'DIC', label: 'DIC', full: 'Diciembre' }
];

interface NewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClub: Club;
  currentUser: FraoviaUser;
  cashBoxes: CashBox[];
  players: Player[];
  categories?: Category[];
  initialPlayer?: Player | null;
  /** Tipo de cobro con el que se abre (ej. 'inscripcion' al terminar de crear un jugador). */
  initialChargeType?: ChargeType;
  /** Comprobantes del club: sirve para saber si un deportista nuevo todavía no pagó nada. */
  receipts?: Receipt[];
  onReceiptCreated: (receipt: any) => void;
}

const CHARGE_TYPES: ChargeType[] = ['cuota', 'inscripcion', 'seguro', 'ficha_medica'];

// Renglones "extra" que se pueden sumar al mismo comprobante (no se borran al cambiar de mes)
const EXTRA_KINDS: ReceiptItemKind[] = ['cuota', 'inscripcion', 'seguro', 'ficha_medica'];
const isExtraItem = (it: ReceiptItem) => !!it.kind && EXTRA_KINDS.includes(it.kind);

// Categoría contable en caja por tipo de renglón
const KIND_CASH_CATEGORY: Record<ReceiptItemKind, 'cuota' | 'inscripcion' | 'otro'> = {
  cuota: 'cuota',
  cuota_hermano: 'cuota',
  inscripcion: 'inscripcion',
  seguro: 'otro',
  ficha_medica: 'otro',
  otro: 'otro'
};

// Categoría contable en caja (la base solo admite estas): seguro y ficha médica van como "otro".
const CHARGE_CASH_CATEGORY: Record<ChargeType, 'cuota' | 'inscripcion' | 'otro'> = {
  cuota: 'cuota',
  inscripcion: 'inscripcion',
  seguro: 'otro',
  ficha_medica: 'otro'
};

const defaultMedicalExpiry = (): string => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

export const NewReceiptModal: React.FC<NewReceiptModalProps> = ({
  isOpen,
  onClose,
  currentClub,
  currentUser,
  cashBoxes,
  players,
  categories = [],
  initialPlayer = null,
  initialChargeType,
  receipts,
  onReceiptCreated
}) => {
  const [chargeType, setChargeType] = useState<ChargeType>('cuota');
  const [medicalExpiry, setMedicalExpiry] = useState<string>(defaultMedicalExpiry());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [playerSearchTerm, setPlayerSearchTerm] = useState<string>('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);
  const [includedSiblings, setIncludedSiblings] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerDni, setCustomerDni] = useState('');
  const [concept, setConcept] = useState('Cobro de Cuota Deportiva & Social');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [selectedCashBoxId, setSelectedCashBoxId] = useState<string>(cashBoxes[0]?.id || '');
  const [items, setItems] = useState<ReceiptItem[]>([
    { description: 'Cuota Social & Deportiva', quantity: 1, unitPrice: 22000, total: 22000 }
  ]);

  // Cambia los renglones principales y conserva los extras (inscripción, seguro, ficha médica) ya sumados
  const setPrimaryItems = (primary: ReceiptItem[]) => {
    setItems(prev => [...primary, ...prev.filter(isExtraItem)]);
  };

  // Suma o quita un cobro extra en el mismo comprobante
  const toggleExtra = (type: ChargeType) => {
    const kind = type as ReceiptItemKind;
    const p = players.find(x => x.id === selectedPlayerId);
    setItems(prev => {
      if (prev.some(it => it.kind === kind)) return prev.filter(it => it.kind !== kind);
      const year = new Date().getFullYear();
      const base: Record<ChargeType, string> = {
        cuota: 'Cuota mensual',
        inscripcion: `Inscripción ${year}`,
        seguro: `Seguro deportivo ${year}`,
        ficha_medica: 'Ficha médica / apto médico'
      };
      const fee = type === 'cuota' ? (p?.monthlyFeeDue ?? 22000) : 0;
      return [...prev, {
        description: p ? `${base[type]} - ${p.lastName}, ${p.firstName}` : base[type],
        kind,
        quantity: 1,
        unitPrice: fee,
        total: fee
      }];
    });
  };

  // Categories list
  const clubCategories: Category[] = useMemo(() => {
    return categories || [];
  }, [categories]);

  const getCategoryName = (categoryId: string) => {
    const cat = clubCategories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Categoría General';
  };

  // Índice (0 = febrero ... 10 = diciembre) del mes actual; enero no tiene cuota (-1)
  const currentMonthIndex = (): number => {
    const m = new Date().getMonth(); // 0 = enero
    return m === 0 ? -1 : m - 1;
  };

  // Si el deportista ingresó este año (y no vino de una planilla con meses cargados), devuelve el índice del mes de ingreso
  const joinedMonthIndexThisYear = (p: Player): number | null => {
    if (p.monthlyPayments || !p.joinedDate) return null;
    const d = new Date(p.joinedDate.slice(0, 10) + 'T12:00:00');
    if (isNaN(d.getTime()) || d.getFullYear() !== new Date().getFullYear()) return null;
    // Los importados desde Excel se cargan con ingreso al 1/2: mantienen el cálculo anterior
    if (p.joinedDate.slice(0, 10) === `${d.getFullYear()}-02-01`) return null;
    const m = d.getMonth();
    return m === 0 ? 0 : m - 1;
  };

  // Meses de este año que ya tienen cuota cobrada en un comprobante vigente
  const paidMonthKeysFromReceipts = (p: Player): Set<string> => {
    const out = new Set<string>();
    const year = String(new Date().getFullYear());
    (receipts || []).forEach(r => {
      if (r.playerId !== p.id || r.status === 'anulado') return;
      if (!String(r.date || '').startsWith(year) && !(r.items || []).some(it => it.description.includes(year))) return;
      (r.items || []).forEach(it => {
        if (it.kind && it.kind !== 'cuota') return;
        ALL_MONTHS.forEach(m => {
          if (new RegExp(`Cuota\\s+${m.full}\\b`, 'i').test(it.description)) out.add(m.key);
        });
      });
    });
    return out;
  };

  // Helper to determine status of a given month
  const getPlayerMonthStatus = (p: Player, monthKey: string): 'P' | 'A' | '-' => {
    // 1. Explicit lookup in player.monthlyPayments (exact or prefix match)
    if (p.monthlyPayments) {
      if (p.monthlyPayments[monthKey]) {
        return p.monthlyPayments[monthKey];
      }
      const prefix = monthKey.substring(0, 3).toUpperCase();
      const matchedKey = Object.keys(p.monthlyPayments).find(
        k => k.substring(0, 3).toUpperCase() === prefix
      );
      if (matchedKey && p.monthlyPayments[matchedKey]) {
        return p.monthlyPayments[matchedKey];
      }
    }

    // 2. Deportista que ingresó este año: las cuotas corren desde el mes de ingreso.
    //    Meses anteriores al ingreso no se cobran; desde el ingreso hasta hoy se debe lo que no tenga comprobante.
    const joinedKey = joinedMonthIndexThisYear(p);
    if (joinedKey !== null) {
      const idx = ALL_MONTHS.findIndex(m => m.key === monthKey);
      if (idx === -1) return '-';
      if (idx < joinedKey) return '-';
      const nowIdx = currentMonthIndex();
      const paidMonths = paidMonthKeysFromReceipts(p);
      if (paidMonths.has(monthKey)) return 'P';
      return idx <= nowIdx ? 'A' : '-';
    }

    // 2b. Deportista recién cargado, sin comprobantes: no se inventan meses pagados
    if (isPendingFirstPayment(p, receipts)) return '-';

    // 3. Intelligent calculation based on actual balance and school/sports calendar
    // Cycle: FEB (0), MAR (1), ABRIL (2), MAYO (3), JUN (4), JUL (5), AGOS (6), SEPT (7), OCT (8), NOV (9), DIC (10)
    const monthIdx = ALL_MONTHS.findIndex(m => m.key === monthKey);
    if (monthIdx === -1) return '-';

    const fee = p.monthlyFeeDue ?? 22000;
    const debt = Math.max(0, p.balance || 0);
    const unpaidCount = debt > 0 ? Math.max(1, Math.round(debt / fee)) : 0;

    // Up to 5 elapsed months reference (FEB through JUN)
    const elapsedMonthsCount = Math.max(5, unpaidCount + 3);

    // Meses que faltan del ciclo lectivo (futuros / no devengados) -> SIEMPRE '-' (Transparente / Fondo)
    if (monthIdx >= elapsedMonthsCount) {
      return '-';
    }

    // Meses adeudados / impagos -> SIEMPRE 'A' (ROJO)
    const firstOwedIndex = elapsedMonthsCount - unpaidCount;
    if (monthIdx >= firstOwedIndex && monthIdx < elapsedMonthsCount) {
      return 'A';
    }

    // Meses anteriores abonados -> 'P' (Verde / Al día)
    return 'P';
  };

  const toggleMonthToPay = (mKey: string, p: Player) => {
    const isAlreadySelected = selectedMonthsToPay.includes(mKey);
    let next: string[];
    if (isAlreadySelected) {
      next = selectedMonthsToPay.filter(k => k !== mKey);
    } else {
      next = [...selectedMonthsToPay, mKey];
    }
    setSelectedMonthsToPay(next);

    const fee = p.monthlyFeeDue ?? 22000;
    const catName = getCategoryName(p.categoryId);

    if (next.length > 0) {
      const generatedItems: ReceiptItem[] = next.map(k => {
        const fullMonthName = ALL_MONTHS.find(x => x.key === k)?.full || k;
        return {
          description: `Cuota ${fullMonthName} 2026 - ${p.lastName}, ${p.firstName} (${catName})`,
          quantity: 1,
          unitPrice: fee,
          total: fee
        };
      });
      setPrimaryItems(generatedItems);
      const names = next.map(k => ALL_MONTHS.find(x => x.key === k)?.full || k).join(', ');
      setConcept(`Pago de Cuotas [${names}] 2026 - ${p.firstName} ${p.lastName}`);
    } else {
      setPrimaryItems([{
        description: `Cuota Mensual Deportiva - ${catName} (DNI ${p.dni})`,
        quantity: 1,
        unitPrice: fee,
        total: fee
      }]);
      setConcept(`Cobro de Cuota Deportiva - ${p.firstName} ${p.lastName}`);
    }
  };

  const selectAllOwedMonths = (p: Player) => {
    const allOwed = ALL_MONTHS.filter(m => getPlayerMonthStatus(p, m.key) === 'A').map(m => m.key);
    if (allOwed.length === 0) return;
    setSelectedMonthsToPay(allOwed);
    const fee = p.monthlyFeeDue ?? 22000;
    const catName = getCategoryName(p.categoryId);
    const generatedItems: ReceiptItem[] = allOwed.map(k => {
      const fullMonthName = ALL_MONTHS.find(x => x.key === k)?.full || k;
      return {
        description: `Cuota ${fullMonthName} 2026 - ${p.lastName}, ${p.firstName} (${catName})`,
        quantity: 1,
        unitPrice: fee,
        total: fee
      };
    });
    setPrimaryItems(generatedItems);
    const names = allOwed.map(k => ALL_MONTHS.find(x => x.key === k)?.full || k).join(', ');
    setConcept(`Cancelación Total Cuotas Adeudadas [${names}] 2026 - ${p.firstName} ${p.lastName}`);
  };

  const selectSingleMonth = (mKey: string, p: Player) => {
    setSelectedMonthsToPay([mKey]);
    const fee = p.monthlyFeeDue ?? 22000;
    const catName = getCategoryName(p.categoryId);
    const fullMonthName = ALL_MONTHS.find(x => x.key === mKey)?.full || mKey;
    setPrimaryItems([{
      description: `Cuota ${fullMonthName} 2026 - ${p.lastName}, ${p.firstName} (${catName})`,
      quantity: 1,
      unitPrice: fee,
      total: fee
    }]);
    setConcept(`Pago Cuota ${fullMonthName} 2026 - ${p.firstName} ${p.lastName}`);
  };

  // Cobros que no son cuota: inscripción, seguro y ficha médica (el importe lo carga el cobrador)
  const presetNonCuota = (type: ChargeType, p?: Player | null) => {
    const year = new Date().getFullYear();
    const base: Record<ChargeType, string> = {
      cuota: 'Cuota',
      inscripcion: `Inscripción ${year}`,
      seguro: `Seguro deportivo ${year}`,
      ficha_medica: 'Ficha médica / apto médico'
    };
    // Se conservan los extras ya sumados (salvo el del propio tipo, que pasa a ser el principal)
    const keepExtras = (prev: ReceiptItem[]) => prev.filter(it => isExtraItem(it) && it.kind !== (type as ReceiptItemKind));
    if (p) {
      setSelectedPlayerId(p.id);
      setCustomerName(`${p.lastName}, ${p.firstName}`);
      setCustomerDni(p.dni);
      setItems(prev => [{ description: `${base[type]} - ${p.lastName}, ${p.firstName} (${getCategoryName(p.categoryId)})`, quantity: 1, unitPrice: 0, total: 0 }, ...keepExtras(prev)]);
      setConcept(`${base[type]} - ${p.firstName} ${p.lastName}`);
    } else {
      setItems(prev => [{ description: base[type], quantity: 1, unitPrice: 0, total: 0 }, ...keepExtras(prev)]);
      setConcept(base[type]);
    }
    setSelectedMonthsToPay([]);
    setIncludedSiblings([]);
  };

  const chooseChargeType = (type: ChargeType, p?: Player | null) => {
    setChargeType(type);
    // El tipo elegido pasa a ser el principal: si estaba sumado como extra, se saca de los extras
    setItems(prev => prev.filter(it => it.kind !== (type as ReceiptItemKind)));
    const target = p === undefined ? players.find(x => x.id === selectedPlayerId) : p;
    if (type === 'cuota') {
      if (target) applyPlayer(target, true);
      else {
        setSelectedMonthsToPay([]);
        setConcept('Cobro de Cuota Deportiva & Social');
        setItems([{ description: 'Cuota Social & Deportiva', quantity: 1, unitPrice: 22000, total: 22000 }]);
      }
      return;
    }
    presetNonCuota(type, target);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize with initialPlayer if provided
  useEffect(() => {
    if (initialPlayer) {
      if (initialChargeType && initialChargeType !== 'cuota') {
        chooseChargeType(initialChargeType, initialPlayer);
      } else {
        setChargeType('cuota');
        applyPlayer(initialPlayer, true);
      }
    } else {
      setChargeType(initialChargeType || 'cuota');
      setSelectedPlayerId('');
      setCustomerName('');
      setCustomerDni('');
      setConcept('Cobro de Cuota Deportiva & Social');
      setItems([{ description: 'Cuota Social & Deportiva', quantity: 1, unitPrice: 22000, total: 22000 }]);
    }
  }, [initialPlayer, initialChargeType, isOpen]);

  // Asegurar selección de una caja abierta disponible
  useEffect(() => {
    if (cashBoxes.length > 0 && (!selectedCashBoxId || !cashBoxes.some(b => b.id === selectedCashBoxId))) {
      const openBox = cashBoxes.find(b => b.status === 'abierta') || cashBoxes[0];
      setSelectedCashBoxId(openBox.id);
    }
  }, [cashBoxes, isOpen, selectedCashBoxId]);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  // Detección inteligente de hermanos / grupo familiar (Inspirado en TeamSnap y Spond)
  const detectedSiblings = useMemo(() => {
    if (!selectedPlayer) return [];
    const cleanPhone = (selectedPlayer.emergencyContact?.phone || selectedPlayer.phone || '').replace(/[^\d]/g, '');
    const tutorName = (selectedPlayer.emergencyContact?.name || '').trim().toLowerCase();
    const lastName = selectedPlayer.lastName.trim().toLowerCase();

    return players.filter(other => {
      if (other.id === selectedPlayer.id) return false;
      const otherPhone = (other.emergencyContact?.phone || other.phone || '').replace(/[^\d]/g, '');
      const otherTutor = (other.emergencyContact?.name || '').trim().toLowerCase();
      const otherLast = other.lastName.trim().toLowerCase();

      // Mismo teléfono de tutor (mínimo 6 dígitos)
      if (cleanPhone.length >= 6 && cleanPhone === otherPhone) return true;
      // Mismo tutor y mismo apellido
      if (tutorName.length >= 4 && tutorName === otherTutor && lastName === otherLast) return true;
      // Mismo apellido y mismo contacto
      if (lastName.length >= 3 && lastName === otherLast && cleanPhone.length >= 6 && cleanPhone === otherPhone) return true;

      return false;
    });
  }, [selectedPlayer, players]);

  const toggleIncludeSibling = (sib: Player) => {
    const isIncluded = includedSiblings.includes(sib.id);
    const sibFee = sib.monthlyFeeDue ?? 22000;
    const catName = getCategoryName(sib.categoryId);

    if (isIncluded) {
      setIncludedSiblings(prev => prev.filter(id => id !== sib.id));
      setItems(prev => prev.filter(it => !it.description.includes(sib.dni)));
    } else {
      setIncludedSiblings(prev => [...prev, sib.id]);
      const newItem: ReceiptItem = {
        description: `Cuota Mensual Deportiva - ${sib.lastName}, ${sib.firstName} (${catName} - DNI ${sib.dni})`,
        kind: 'cuota_hermano',
        quantity: 1,
        unitPrice: sibFee,
        total: sibFee
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  // Filtered players based on search term & category filter
  const filteredPlayers = players.filter(p => {
    if (selectedCategoryFilter !== 'all' && p.categoryId !== selectedCategoryFilter) {
      return false;
    }
    if (playerSearchTerm.trim()) {
      const term = playerSearchTerm.toLowerCase();
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const reversedName = `${p.lastName} ${p.firstName}`.toLowerCase();
      const matchesName = fullName.includes(term) || reversedName.includes(term);
      const matchesDni = p.dni ? p.dni.includes(term) : false;
      return matchesName || matchesDni;
    }
    return true;
  });

  const applyPlayer = (p: Player, forceCuota = false) => {
    if (!forceCuota && chargeType !== 'cuota') {
      // Ya se eligió inscripción / seguro / ficha médica: solo se asocia el deportista
      presetNonCuota(chargeType, p);
      setIsSearchDropdownOpen(false);
      setPlayerSearchTerm('');
      return;
    }
    setSelectedPlayerId(p.id);
    setIncludedSiblings([]);
    setCustomerName(`${p.lastName}, ${p.firstName}`);
    setCustomerDni(p.dni);
    const catName = getCategoryName(p.categoryId);
    const owed = ALL_MONTHS.filter(m => getPlayerMonthStatus(p, m.key) === 'A').map(m => m.key);

    if (owed.length > 0) {
      // By default select the oldest owed month for independent charging
      selectSingleMonth(owed[0], p);
    } else {
      setSelectedMonthsToPay([]);
      setConcept(`Cuota Mensual Deportiva - ${p.firstName} ${p.lastName} (${catName})`);
      setPrimaryItems([{
        description: `Cuota Mensual Deportiva - ${catName} (DNI ${p.dni})`,
        quantity: 1,
        unitPrice: p.monthlyFeeDue ?? 22000,
        total: p.monthlyFeeDue ?? 22000
      }]);
    }

    setIsSearchDropdownOpen(false);
    setPlayerSearchTerm('');
  };

  const handleClearPlayer = () => {
    setSelectedPlayerId('');
    setSelectedMonthsToPay([]);
    setIncludedSiblings([]);
    setCustomerName('');
    setCustomerDni('');
    if (chargeType !== 'cuota') {
      presetNonCuota(chargeType, null);
      return;
    }
    setConcept('Cobro de Cuota Deportiva & Social');
    setItems([{ description: 'Cuota Social & Deportiva', quantity: 1, unitPrice: 22000, total: 22000 }]);
  };

  const addItemRow = () => {
    setItems([...items, { description: 'Item adicional', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof ReceiptItem, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].total = Number(updated[index].quantity) * Number(updated[index].unitPrice);
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, i) => acc + (Number(i.total) || 0), 0);
  const hasMedicalItem = chargeType === 'ficha_medica' || items.some(it => it.kind === 'ficha_medica');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permisos: TIENDA y ADMINISTRACIÓN y DUEÑO pueden emitir; SUPERADMIN en modo fantasma es solo lectura
  const canEmitReceipt = currentUser.role !== 'SUPERADMIN' && ['DUEÑO', 'ADMINISTRACIÓN', 'TIENDA', 'GENERAL'].includes(currentUser.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || totalAmount < 0) return;

    if (!canEmitReceipt) {
      alert('Su rol no tiene autorización para emitir comprobantes de pago.');
      return;
    }

    if (chargeType !== 'cuota' && totalAmount <= 0) {
      alert('Ingresá el importe a cobrar (mayor a $0) antes de emitir el comprobante.');
      return;
    }
    if (items.length > 1 && items.some(it => (Number(it.total) || 0) <= 0)) {
      alert('Hay un renglón sin importe. Cargá el importe de cada ítem o quitá el que no vas a cobrar.');
      return;
    }
    if (hasMedicalItem && !selectedPlayerId) {
      alert('Para cobrar la ficha médica elegí primero al deportista.');
      return;
    }
    if (hasMedicalItem && !medicalExpiry) {
      alert('Indicá hasta qué fecha vale el apto médico.');
      return;
    }

    if (totalAmount > 0) {
      const boxToUse = cashBoxes.find(b => b.id === selectedCashBoxId);
      if (!boxToUse) {
        alert(`Debés crear y abrir una caja antes de emitir este cobro de ${CHARGE_TYPE_LABELS[chargeType]}. Andá al módulo Caja, abrila y volvé a intentar.`);
        return;
      }
      if (boxToUse.status !== 'abierta') {
        alert(`La caja "${boxToUse.name}" está CERRADA. Debés realizar la apertura de caja antes de emitir este cobro de ${CHARGE_TYPE_LABELS[chargeType]}. Abrila desde el módulo Caja y volvé a intentar.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Insertar en receipts sin receipt_number y obtener el número generado.
      // 2. Inmediatamente después, insertar en cash_movements.
      // Si el segundo paso falla, emitReceipt retorna movementWarning con el número de recibo. No se borra el recibo.
      // Cada renglón queda marcado con lo que es (cuota, inscripción, seguro…), para caja y para anulaciones
      const primaryKind: ReceiptItemKind = chargeType === 'cuota' ? 'cuota' : (chargeType as ReceiptItemKind);
      const taggedItems: ReceiptItem[] = items.map(it => ({ ...it, kind: it.kind || primaryKind }));
      const cuotaPart = taggedItems
        .filter(it => it.kind === 'cuota')
        .reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const byCategory = new Map<'cuota' | 'inscripcion' | 'otro', number>();
      taggedItems.forEach(it => {
        const cat = KIND_CASH_CATEGORY[it.kind as ReceiptItemKind] || 'otro';
        byCategory.set(cat, (byCategory.get(cat) || 0) + (Number(it.total) || 0));
      });
      const breakdown = Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount }));

      const { receipt, movementWarning } = await supabaseReceiptService.emitReceipt({
        clubId: currentClub.id,
        customerName: customerName.trim(),
        customerDni: customerDni.trim() || undefined,
        playerId: selectedPlayerId || null,
        concept: concept.trim(),
        amount: totalAmount,
        paymentMethod,
        items: taggedItems,
        cashBoxId: selectedCashBoxId || null,
        issuedByUserId: currentUser.id,
        category: CHARGE_CASH_CATEGORY[chargeType],
        breakdown
      });

      // Si falló el registro en cash_movements, mostrar aviso claro con el número de recibo
      if (movementWarning) {
        alert(`AVISO IMPORTANTE:\n${movementWarning}`);
      }

      // Ficha médica: el comprobante ya quedó emitido; ahora se renueva el apto del deportista
      if (hasMedicalItem && selectedPlayerId) {
        const medPlayer = players.find(player => player.id === selectedPlayerId);
        if (medPlayer) {
          try {
            await dataActions.renewMedicalCertificate(medPlayer, medicalExpiry, currentUser);
          } catch (e: any) {
            alert(`El comprobante ${receipt.receiptNumber} se emitió, pero no se pudo renovar el apto médico: ${formatSupabaseError(e)}. Avisá al administrador antes de volver a cobrar: el pago ya está registrado.`);
          }
        }
      }

      // Si el comprobante corresponde a una CUOTA de un jugador, descontar deuda en Supabase
      // (inscripción, seguro y ficha médica no son cuotas: no tocan el saldo de cuotas)
      if (selectedPlayerId && cuotaPart > 0) {
        const p = players.find(player => player.id === selectedPlayerId);
        if (p) {
          const newBalance = Math.max(0, (p.balance || 0) - cuotaPart);
          try {
            await supabaseDataService.updatePlayer(p.id, { balance: newBalance });
          } catch (e) {
            console.warn('No se pudo actualizar saldo del jugador en Supabase:', e);
          }
        }
      }

      // Si se incluyeron hermanos del grupo familiar, actualizar saldos en Supabase
      if (includedSiblings.length > 0) {
        for (const sibId of includedSiblings) {
          const sib = players.find(p => p.id === sibId);
          if (sib) {
            const sibFee = sib.monthlyFeeDue ?? 22000;
            const newSibBalance = Math.max(0, (sib.balance || 0) - sibFee);
            try {
              await supabaseDataService.updatePlayer(sib.id, { balance: newSibBalance });
            } catch (e) {
              console.warn('No se pudo actualizar saldo de hermano en Supabase:', e);
            }
          }
        }
      }

      // Bitácora de auditoría
      await supabaseAuditService.logAudit({
        clubId: currentClub.id,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        action: 'EMISION_RECIBO',
        detail: `Emisión de comprobante oficial ${receipt.receiptNumber} a ${customerName}. Importe: $${totalAmount.toLocaleString('es-AR')}. Concepto: ${concept}`,
        category: 'caja'
      });

      onReceiptCreated(receipt);
      onClose();
    } catch (err: any) {
      const msg = formatSupabaseError(err);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Importante: este return va DESPUÉS de todos los hooks (si no, React falla con "Rendered more hooks")
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              Emisión de Comprobante Oficial de Cobro
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          
          {/* TIPO DE COBRO */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              ¿Qué vas a cobrar?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CHARGE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => chooseChargeType(type)}
                  className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    chargeType === type
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {CHARGE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold">Sumar al mismo comprobante:</span>
              {CHARGE_TYPES.filter(t => t !== chargeType).map(t => {
                const active = items.some(it => it.kind === (t as ReceiptItemKind));
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleExtra(t)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                      active
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                    title={active ? 'Quitar de este comprobante' : 'Sumar a este comprobante (cargá el importe en el detalle)'}
                  >
                    {active ? '✓ ' : '+ '}{CHARGE_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
            {hasMedicalItem && chargeType !== 'ficha_medica' && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1.5">
                <label className="block text-[11px] font-bold text-sky-200">
                  Apto médico válido hasta
                </label>
                <input
                  type="date"
                  value={medicalExpiry}
                  onChange={(e) => setMedicalExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
            {chargeType === 'ficha_medica' && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1.5">
                <label className="block text-[11px] font-bold text-sky-200">
                  Apto médico válido hasta
                </label>
                <input
                  type="date"
                  value={medicalExpiry}
                  onChange={(e) => setMedicalExpiry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-sky-300/80">
                  Al emitir el comprobante, el apto del deportista queda renovado hasta esa fecha.
                </p>
              </div>
            )}
            {chargeType !== 'cuota' && (
              <p className="text-[10px] text-slate-400">
                Cargá el importe en el detalle de abajo. Este cobro no modifica la deuda de cuotas (salvo que sumes la cuota).
              </p>
            )}
          </div>

          {/* SELECCIÓN Y BÚSQUEDA DEL SOCIO / DEPORTISTA CON VISTA PREVIA DE FOTO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Seleccionar Socio / Jugador Registrado (Opcional)
              </label>
              <span className="text-[10px] text-slate-400">
                {players.length} deportistas registrados
              </span>
            </div>

            {(() => {
              const box = cashBoxes.find(b => b.id === selectedCashBoxId);
              if (box && box.status === 'abierta') return null;
              return (
                <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 text-xs text-rose-200">
                  <strong className="text-rose-300 uppercase tracking-wide">Caja cerrada: </strong>
                  {box
                    ? `"${box.name}" está cerrada. Para emitir este cobro primero tenés que abrirla desde el módulo Caja.`
                    : 'No hay ninguna caja creada. Creá y abrí una caja en el módulo Caja antes de cobrar.'}
                </div>
              );
            })()}

            {selectedPlayer && selectedPlayer.scholarshipPercent !== undefined && selectedPlayer.scholarshipPercent > 0 && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-2 border-amber-500/60 flex items-start gap-2.5">
                <GraduationCap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-100">
                  <strong className="text-amber-300 uppercase tracking-wide">Atención Caja: </strong>
                  {selectedPlayer.scholarshipPercent === 100
                    ? 'Deportista con Beca Completa (100% bonificado). No corresponde cobrar cuota mensual.'
                    : `Deportista con Beca del ${selectedPlayer.scholarshipPercent}%.`}
                  {' '}Cuota neta: <strong className="font-mono">${(selectedPlayer.monthlyFeeDue ?? 0).toLocaleString('es-AR')}</strong>
                </div>
              </div>
            )}

            {/* IF A PLAYER IS ALREADY SELECTED: SHOW VERIFIED PHOTO & DATA CARD */}
            {selectedPlayer ? (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0C1E2C] via-slate-900 to-[#0A1A30] border-2 border-emerald-500/50 shadow-xl relative overflow-hidden animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    
                    {/* FOTO DEL NIÑO CON MARCO Y BADGE DE VERIFICACIÓN */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-400/80 shadow-md relative">
                        <PlayerImage
                          photoPathOrUrl={selectedPlayer.photoUrl}
                          alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                          className="w-full h-full object-cover"
                          fallbackInitials={`${selectedPlayer.firstName?.charAt(0) || ''}${selectedPlayer.lastName?.charAt(0) || ''}`}
                        />
                      </div>
                      <span 
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow"
                        title="Ficha verificada en padrón"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>

                    {/* DATOS DEL DEPORTISTA */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Socio Verificado
                        </span>
                        <span className="text-xs text-sky-300 font-bold">
                          {getCategoryName(selectedPlayer.categoryId)}
                        </span>
                        {(selectedPlayer.familyDiscountPercent || 0) > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                            Dto. hermanos {selectedPlayer.familyDiscountPercent}%
                          </span>
                        )}
                        {selectedPlayer.colorBlockName && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            · {selectedPlayer.colorBlockName}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                        {selectedPlayer.lastName}, {selectedPlayer.firstName}
                      </h4>

                      <div className="flex items-center gap-2.5 text-xs text-slate-300 flex-wrap">
                        <span className="font-mono text-slate-400">
                          DNI: <strong className="text-white">{selectedPlayer.dni}</strong>
                        </span>
                        {selectedPlayer.coachName && (
                          <span className="text-slate-400">
                            · DT: <strong className="text-slate-200">{selectedPlayer.coachName}</strong>
                          </span>
                        )}
                      </div>

                      {/* BALANCE Y DEUDA */}
                      <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                        {selectedPlayer.balance > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Deuda pendiente: ${selectedPlayer.balance.toLocaleString('es-AR')}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPrimaryItems([{
                                  description: `Cancelación Total Deuda - ${getCategoryName(selectedPlayer.categoryId)} (DNI ${selectedPlayer.dni})`,
                                  quantity: 1,
                                  unitPrice: selectedPlayer.balance,
                                  total: selectedPlayer.balance
                                }]);
                              }}
                              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                            >
                              Cargar saldo total
                            </button>
                          </div>
                        ) : isPendingFirstPayment(selectedPlayer, receipts) ? (
                          <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Sin pagos registrados
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Cuota al día ($0 saldo)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CAMBIAR O QUITAR JUGADOR */}
                  <div className="shrink-0 pt-2 sm:pt-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleClearPlayer}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700 flex items-center gap-1.5 shadow"
                      title="Deseleccionar y buscar otro alumno o cargar cliente manual"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cambiar Alumno</span>
                    </button>
                  </div>
                </div>

                {/* DESGLOSE DE MENSUALIDADES (SELECCIÓN Y COBRO INDEPENDIENTE POR MES) */}
                {chargeType === 'cuota' && (
                <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wide">
                        Mensualidades del Año (Cobro Independiente)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => selectAllOwedMonths(selectedPlayer)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold transition cursor-pointer"
                        title="Seleccionar todos los meses que adeuda el alumno"
                      >
                        Cobrar Todos los Adeudados
                      </button>
                      {selectedMonthsToPay.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMonthsToPay([]);
                            setPrimaryItems([{
                              description: `Cuota Mensual Deportiva - ${getCategoryName(selectedPlayer.categoryId)} (DNI ${selectedPlayer.dni})`,
                              quantity: 1,
                              unitPrice: selectedPlayer.monthlyFeeDue ?? 22000,
                              total: selectedPlayer.monthlyFeeDue ?? 22000
                            }]);
                            setConcept(`Cuota Mensual Deportiva - ${selectedPlayer.firstName} ${selectedPlayer.lastName}`);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer font-medium"
                        >
                          Limpiar Meses
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 flex-wrap pb-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs shadow-red-500/50 inline-block" />
                        <span className="text-red-400 font-bold">No Pagado / Debe (Rojo)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        <span className="text-emerald-400 font-medium">Pagado (Al día)</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-700 bg-transparent inline-block" />
                        <span className="text-slate-500 font-medium">Meses que faltan (Transparente)</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Months Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-1.5">
                    {ALL_MONTHS.map(m => {
                      const status = getPlayerMonthStatus(selectedPlayer, m.key);
                      const isSelected = selectedMonthsToPay.includes(m.key);
                      const isOwed = status === 'A';
                      const isMissing = status === '-';
                      const isPaid = status === 'P';

                      let containerClasses = '';
                      let labelClasses = '';
                      let badgeElement = null;
                      let footerText = '';
                      let footerClasses = '';

                      if (isOwed) {
                        // NO PAGADO / DEBE -> ROJO
                        if (isSelected) {
                          containerClasses = 'bg-red-950/70 border-red-500 ring-2 ring-red-400 text-white shadow-lg shadow-red-950/60';
                          labelClasses = 'text-white font-black';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-[9px] shadow-xs">
                              ✓
                            </span>
                          );
                          footerText = 'A Cobrar';
                          footerClasses = 'text-red-200 font-bold';
                        } else {
                          containerClasses = 'bg-red-950/40 border-red-500/80 text-red-200 hover:bg-red-900/40 hover:border-red-400 shadow-sm shadow-red-950/40';
                          labelClasses = 'text-red-300 font-black';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[9px] shadow-xs">
                              A
                            </span>
                          );
                          footerText = 'Debe';
                          footerClasses = 'text-red-400 font-bold';
                        }
                      } else if (isMissing) {
                        // MES QUE FALTA -> TRANSPARENTE O CON EL COLOR DEL FONDO
                        if (isSelected) {
                          containerClasses = 'bg-slate-900/80 border-sky-400 ring-2 ring-sky-400/60 text-sky-100 shadow-md';
                          labelClasses = 'text-sky-200 font-bold';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-[9px]">
                              ✓
                            </span>
                          );
                          footerText = 'Adelanto';
                          footerClasses = 'text-sky-300 font-bold';
                        } else {
                          containerClasses = 'bg-transparent border-slate-800/80 text-slate-500 hover:border-slate-700 hover:text-slate-400 hover:bg-slate-900/20';
                          labelClasses = 'text-slate-500 font-bold';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full border border-slate-800/80 text-slate-600 font-mono text-[9px] flex items-center justify-center">
                              -
                            </span>
                          );
                          footerText = 'Falta';
                          footerClasses = 'text-slate-600 font-medium';
                        }
                      } else {
                        // PAGADO / AL DÍA -> VERDE
                        if (isSelected) {
                          containerClasses = 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/60 text-white shadow-md';
                          labelClasses = 'text-emerald-200 font-bold';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-[9px]">
                              ✓
                            </span>
                          );
                          footerText = 'Re-cobro';
                          footerClasses = 'text-emerald-200 font-bold';
                        } else {
                          containerClasses = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400/90 hover:bg-emerald-950/35 hover:border-emerald-500/50';
                          labelClasses = 'text-emerald-300 font-bold';
                          badgeElement = (
                            <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 flex items-center justify-center font-black text-[9px]">
                              P
                            </span>
                          );
                          footerText = 'Al día';
                          footerClasses = 'text-emerald-400/80 font-bold';
                        }
                      }

                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => toggleMonthToPay(m.key, selectedPlayer)}
                          className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center justify-between min-h-[54px] cursor-pointer relative ${containerClasses}`}
                          title={`Mes ${m.full} (${isPaid ? 'Pagado' : isOwed ? 'No pagado / Adeuda' : 'Mes que falta'}) - Clic para ${isSelected ? 'quitar' : 'cobrar'}`}
                        >
                          <span className={`text-[10px] uppercase tracking-tight ${labelClasses}`}>
                            {m.label}
                          </span>

                          <div className="my-0.5">
                            {badgeElement}
                          </div>

                          <span className={`text-[8px] font-mono leading-none ${footerClasses}`}>
                            {footerText}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedMonthsToPay.length > 0 && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
                      <span className="flex items-center gap-1.5 font-medium truncate mr-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Meses a cobrar: <strong>{selectedMonthsToPay.map(k => ALL_MONTHS.find(x => x.key === k)?.full).join(', ')}</strong> ({selectedMonthsToPay.length})
                      </span>
                      <span className="font-mono font-black text-emerald-200 text-xs shrink-0">
                        Total: ${(selectedMonthsToPay.length * (selectedPlayer.monthlyFeeDue ?? 22000)).toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}

                  {/* GRUPO FAMILIAR & HERMANOS DETECTADOS (INSPIRACIÓN BENCHMARK TEAMSNAP / SPOND) */}
                  {detectedSiblings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold text-cyan-300 text-[11px] uppercase tracking-wide">
                            Grupo Familiar Detectado ({detectedSiblings.length} {detectedSiblings.length === 1 ? 'hermano/a' : 'hermanos'})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {selectedPlayer.emergencyContact?.name || 'Tutor común'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {detectedSiblings.map(sib => {
                          const isIncluded = includedSiblings.includes(sib.id);
                          const sibFee = sib.monthlyFeeDue ?? 22000;
                          const sibOwed = sib.balance > 0;

                          return (
                            <div 
                              key={sib.id}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                                isIncluded 
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-xs' 
                                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold">
                                  <PlayerImage
                                    photoPathOrUrl={sib.photoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    fallbackInitials={sib.firstName?.charAt(0) || ''}
                                  />
                                </div>
                                <div>
                                  <span className="font-bold text-white text-xs block">
                                    {sib.firstName} {sib.lastName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    DNI {sib.dni} · {getCategoryName(sib.categoryId)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <span className="font-mono text-xs font-bold block text-white">
                                    ${sibFee.toLocaleString('es-AR')}
                                  </span>
                                  <span className={`text-[10px] ${sibOwed ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {sibOwed ? `Adeuda $${sib.balance.toLocaleString('es-AR')}` : 'Al día'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleIncludeSibling(sib)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                    isIncluded
                                      ? 'bg-cyan-500 text-slate-950 font-black'
                                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                                  }`}
                                >
                                  {isIncluded ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 stroke-[3]" />}
                                  <span>{isIncluded ? 'Incluido' : '+ Sumar Cuota'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            ) : (
              /* SEARCH AND CATEGORY FILTER CONTROLS */
              <div className="space-y-2 relative" ref={dropdownRef}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  
                  {/* Category Filter */}
                  <div className="sm:col-span-5">
                    <div className="relative">
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => {
                          setSelectedCategoryFilter(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">Todas las Categorías ({players.length})</option>
                        {clubCategories.map(cat => {
                          const countInCat = players.filter(p => p.categoryId === cat.id).length;
                          return (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({countInCat})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Search Input by Name / DNI */}
                  <div className="sm:col-span-7">
                    <div className="relative">
                      <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={playerSearchTerm}
                        onChange={(e) => {
                          setPlayerSearchTerm(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        placeholder="Buscar por apellido, nombre o DNI..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                      {playerSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setPlayerSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* SEARCH RESULTS DROPDOWN WITH PHOTO PREVIEW ITEMS */}
                {isSearchDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        handleClearPlayer();
                        setIsSearchDropdownOpen(false);
                      }}
                      className="w-full p-2.5 text-left text-xs text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 flex items-center justify-between"
                    >
                      <span className="font-semibold">-- Ingreso manual de cliente o tercero (Sin socio) --</span>
                      <span className="text-[10px] text-slate-500">Carga libre</span>
                    </button>

                    {filteredPlayers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No se encontraron deportistas que coincidan con la búsqueda.
                      </div>
                    ) : (
                      filteredPlayers.slice(0, 15).map(p => {
                        const isDebtor = p.balance > 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => applyPlayer(p)}
                            className="p-2.5 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Mini photo */}
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                                <PlayerImage
                                  photoPathOrUrl={p.photoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  fallbackInitials={`${p.lastName?.charAt(0) || ''}${p.firstName?.charAt(0) || ''}`}
                                />
                              </div>

                              <div className="min-w-0">
                                <span className="font-bold text-slate-100 block text-xs truncate">
                                  {p.lastName}, {p.firstName}
                                </span>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                                  <span>DNI {p.dni}</span>
                                  <span>·</span>
                                  <span className="text-sky-300">{getCategoryName(p.categoryId)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {isDebtor ? (
                                <span className="text-[10px] font-mono font-bold text-amber-400 block">
                                  Debe ${p.balance.toLocaleString('es-AR')}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-semibold block">
                                  Al día
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">
                                Cuota: ${(p.monthlyFeeDue ?? 22000).toLocaleString('es-AR')}
                              </span>
                              {p.scholarshipPercent !== undefined && p.scholarshipPercent > 0 && (
                                <span className="text-[9px] font-black text-amber-300 block">🎓 Becado {p.scholarshipPercent}%</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DATOS DEL COMPROBANTE (NOMBRE Y DNI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre / Razón Social</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo del titular"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">DNI / CUIT</label>
              <input
                type="text"
                value={customerDni}
                onChange={(e) => setCustomerDni(e.target.value)}
                placeholder="DNI o CUIT (opcional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* MEDIO DE PAGO Y CAJA A IMPUTAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Medio de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo en Caja</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Caja a Imputar</label>
              <select
                value={selectedCashBoxId}
                onChange={(e) => setSelectedCashBoxId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
              >
                {cashBoxes.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type === 'tienda' ? 'Caja Tienda' : 'Caja Central'}) · {b.status === 'abierta' ? 'Abierta' : 'CERRADA'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CONCEPTO GENERAL */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Concepto General</label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          {/* DETALLE DE CONCEPTOS / ÍTEMS */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Detalle de Conceptos / Ítems</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-850 p-2.5 rounded-xl border border-slate-700/60">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={it.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  />
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-xs text-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    value={it.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-right text-xs font-mono text-emerald-400 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Eliminar fila"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* TOTAL COMPROBANTE */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs mt-3">
              <span className="font-semibold text-slate-400">TOTAL COMPROBANTE:</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                ${totalAmount.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button 
            type="button"
            onClick={onClose} 
            className="px-3.5 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Emitiendo comprobante...' : 'Emitir e Imputar en Caja'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
