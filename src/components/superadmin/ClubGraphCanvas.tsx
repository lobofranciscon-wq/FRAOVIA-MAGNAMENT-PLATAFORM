import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Building2, 
  Activity, 
  Users, 
  Wallet, 
  Key, 
  ShieldCheck, 
  Edit3, 
  Check, 
  Plus,
  Eye,
  Sliders,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { Club, Discipline, Category, User, CashBox } from '../../types/fraovia';

// Node data types
interface RootNodeData extends Record<string, unknown> {
  club: Club;
  onEditFront: () => void;
  onSelectBranch: (branch: string) => void;
}

interface DeptNodeData extends Record<string, unknown> {
  title: string;
  subtitle: string;
  iconName: 'deportes' | 'usuarios' | 'cajas';
  count: number;
  color: 'emerald' | 'sky' | 'amber';
  branchKey: string;
  onOpenPermissions: (branchKey: string) => void;
  onAction?: () => void;
}

interface SportLeafNodeData extends Record<string, unknown> {
  sport: Discipline;
  categoriesCount: number;
  assignedUsersCount: number;
  onToggleActive: (sportId: string, current: boolean) => void;
  onOpenPermissions: (sport: Discipline) => void;
}

interface UserLeafNodeData extends Record<string, unknown> {
  user: User;
  onOpenPermissions: (user: User) => void;
  onEditPassword: (user: User) => void;
}

interface CashLeafNodeData extends Record<string, unknown> {
  box: CashBox;
  onOpenDetails: (box: CashBox) => void;
}

// -------------------------------------------------------------
// CUSTOM NODE 1: ROOT CLUB NODE
// -------------------------------------------------------------
const RootClubNode: React.FC<NodeProps<Node<RootNodeData>>> = ({ data }) => {
  const { club, onEditFront, onSelectBranch } = data;
  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-sky-400 rounded-3xl p-4 text-white shadow-2xl shadow-sky-500/30 w-72 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-lg">
          {club.logoUrl && club.logoUrl.trim() ? (
            <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-7 h-7 text-slate-900" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
            NODO CENTRAL
          </span>
          <h3 className="font-black text-sm text-white truncate mt-0.5" title={club.name}>
            {club.name}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono block">CUIT: {club.cuit}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-mono">Plan: <strong className="text-amber-400">PRO</strong></span>
        <span className="text-slate-400 font-mono">Cupo: <strong className="text-white">{club.contractedPlayersQuota}</strong></span>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onEditFront}
          className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow"
        >
          <Sparkles className="w-3 h-3" />
          <span>Front-End</span>
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-sky-400 border-2 border-slate-900"
      />
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM NODE 2: DEPARTMENT NODE (RAMA PRINCIPAL)
// -------------------------------------------------------------
const DepartmentNode: React.FC<NodeProps<Node<DeptNodeData>>> = ({ data }) => {
  const { title, subtitle, iconName, count, color, branchKey, onOpenPermissions, onAction } = data;

  const colorStyles = {
    emerald: {
      border: 'border-emerald-500/60',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      btn: 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border-emerald-500/40'
    },
    sky: {
      border: 'border-sky-500/60',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      iconBg: 'bg-sky-500/20 text-sky-400',
      btn: 'bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border-sky-500/40'
    },
    amber: {
      border: 'border-amber-500/60',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400',
      btn: 'bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border-amber-500/40'
    }
  }[color];

  return (
    <div className={`bg-[#0C152C] border-2 ${colorStyles.border} rounded-2xl p-3.5 text-white shadow-xl w-64 backdrop-blur-md`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-slate-400 border-2 border-slate-900"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl ${colorStyles.iconBg} flex items-center justify-center shrink-0`}>
            {iconName === 'deportes' && <Activity className="w-4 h-4" />}
            {iconName === 'usuarios' && <Users className="w-4 h-4" />}
            {iconName === 'cajas' && <Wallet className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-bold text-xs text-white leading-tight">{title}</h4>
            <span className="text-[10px] text-slate-400 block">{subtitle}</span>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${colorStyles.badge}`}>
          {count}
        </span>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onOpenPermissions(branchKey)}
          className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${colorStyles.btn}`}
          title="Editar permisos rápidos de esta rama"
        >
          <Sliders className="w-3 h-3" />
          <span>Gestionar Rama</span>
        </button>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Agregar elemento a esta rama"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-slate-400 border-2 border-slate-900"
      />
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM NODE 3: SPORT LEAF NODE
// -------------------------------------------------------------
const SportLeafNode: React.FC<NodeProps<Node<SportLeafNodeData>>> = ({ data }) => {
  const { sport, categoriesCount, assignedUsersCount, onToggleActive, onOpenPermissions } = data;
  return (
    <div className={`bg-slate-900/90 border ${sport.active !== false ? 'border-emerald-500/40 hover:border-emerald-400' : 'border-slate-800 opacity-60'} rounded-xl p-2.5 text-white shadow-md w-56 transition`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-emerald-400 border border-slate-900"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-bold text-xs text-white truncate">{sport.name}</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30">
            {sport.code}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleActive(sport.id, sport.active !== false)}
          className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer shrink-0 ${
            sport.active !== false ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-700 border-slate-600'
          }`}
          title={sport.active !== false ? 'Habilitado (Click para pausar)' : 'Deshabilitado (Click para activar)'}
        />
      </div>

      <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{categoriesCount} divisiones</span>
        <span className="text-emerald-300 font-semibold">{assignedUsersCount} profes</span>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[9px] text-slate-500 truncate">
          {sport.coordinatorName ? `Coord: ${sport.coordinatorName}` : 'Sin coord.'}
        </span>
        <button
          type="button"
          onClick={() => onOpenPermissions(sport)}
          className="text-[10px] text-emerald-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-2.5 h-2.5" />
          <span>Permisos</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM NODE 4: USER LEAF NODE
// -------------------------------------------------------------
const UserLeafNode: React.FC<NodeProps<Node<UserLeafNodeData>>> = ({ data }) => {
  const { user, onOpenPermissions, onEditPassword } = data;
  return (
    <div className={`bg-slate-900/90 border ${user.status === 'activo' ? 'border-sky-500/40 hover:border-sky-400' : 'border-rose-500/40'} rounded-xl p-2.5 text-white shadow-md w-60 transition`}>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-sky-400 border border-slate-900"
      />

      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-white truncate block">{user.fullName}</span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30 shrink-0">
              {user.role}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono truncate block mt-0.5">{user.email}</span>
        </div>

        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
          user.status === 'activo' ? 'bg-emerald-400' : 'bg-rose-500'
        }`} title={user.status} />
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <button
          type="button"
          onClick={() => onEditPassword(user)}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          title="Ver o modificar clave"
        >
          <Key className="w-3 h-3" />
          <span>Clave</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenPermissions(user)}
          className="text-sky-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
          title="Modificar rol y alcance de permisos"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Permisos</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM NODE 5: CASH LEAF NODE
// -------------------------------------------------------------
const CashLeafNode: React.FC<NodeProps<Node<CashLeafNodeData>>> = ({ data }) => {
  const { box, onOpenDetails } = data;
  return (
    <div className="bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 rounded-xl p-2.5 text-white shadow-md w-52 transition">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-amber-400 border border-slate-900"
      />

      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-white truncate">{box.name}</span>
        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-bold">
          {box.type.toUpperCase()}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
        <span className="text-slate-400">Saldo:</span>
        <span className="font-mono font-bold text-emerald-400 text-xs">
          ${box.currentBalance.toLocaleString('es-AR')}
        </span>
      </div>
    </div>
  );
};

// Registered custom node types map
const nodeTypes = {
  rootNode: RootClubNode,
  deptNode: DepartmentNode,
  sportLeafNode: SportLeafNode,
  userLeafNode: UserLeafNode,
  cashLeafNode: CashLeafNode
};

interface ClubGraphCanvasProps {
  club: Club;
  disciplines: Discipline[];
  categories: Category[];
  users: User[];
  cashBoxes: CashBox[];
  onOpenFrontEditor: () => void;
  onOpenSportPermissions: (sport: Discipline) => void;
  onOpenUserPermissions: (user: User) => void;
  onOpenBranchPermissions: (branchKey: string) => void;
  onToggleSportActive: (sportId: string, current: boolean) => void;
  onEditUserPassword: (user: User) => void;
  onAddNewSport: () => void;
}

export const ClubGraphCanvas: React.FC<ClubGraphCanvasProps> = ({
  club,
  disciplines,
  categories,
  users,
  cashBoxes,
  onOpenFrontEditor,
  onOpenSportPermissions,
  onOpenUserPermissions,
  onOpenBranchPermissions,
  onToggleSportActive,
  onEditUserPassword,
  onAddNewSport
}) => {
  // Build dynamic nodes and edges based on real club data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Root Node: The Club
    const rootId = 'club-root';
    nodes.push({
      id: rootId,
      type: 'rootNode',
      position: { x: 40, y: 280 },
      data: {
        club,
        onEditFront: onOpenFrontEditor,
        onSelectBranch: onOpenBranchPermissions
      }
    });

    // 2. Department Branches (Deportes, Usuarios & Roles, Cajas & Tesorería)
    const deptDeportesId = 'dept-deportes';
    const deptUsuariosId = 'dept-usuarios';
    const deptCajasId = 'dept-cajas';

    // Node: Deportes Dept
    nodes.push({
      id: deptDeportesId,
      type: 'deptNode',
      position: { x: 380, y: 60 },
      data: {
        title: 'Deportes & Disciplinas',
        subtitle: 'Carga aislada y divisiones',
        iconName: 'deportes',
        count: disciplines.length,
        color: 'emerald',
        branchKey: 'deportes',
        onOpenPermissions: onOpenBranchPermissions,
        onAction: onAddNewSport
      }
    });

    // Node: Usuarios Dept
    nodes.push({
      id: deptUsuariosId,
      type: 'deptNode',
      position: { x: 380, y: 320 },
      data: {
        title: 'Usuarios & Accesos',
        subtitle: 'Directivos, profes y permisos',
        iconName: 'usuarios',
        count: users.length,
        color: 'sky',
        branchKey: 'usuarios',
        onOpenPermissions: onOpenBranchPermissions
      }
    });

    // Node: Cajas Dept
    nodes.push({
      id: deptCajasId,
      type: 'deptNode',
      position: { x: 380, y: 580 },
      data: {
        title: 'Tesorería & Cajas',
        subtitle: 'Puntos de cobro y saldos',
        iconName: 'cajas',
        count: cashBoxes.length,
        color: 'amber',
        branchKey: 'cajas',
        onOpenPermissions: onOpenBranchPermissions
      }
    });

    // Connect Root to Departments
    edges.push(
      {
        id: 'edge-root-deportes',
        source: rootId,
        target: deptDeportesId,
        animated: true,
        style: { stroke: '#10B981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' }
      },
      {
        id: 'edge-root-usuarios',
        source: rootId,
        target: deptUsuariosId,
        animated: true,
        style: { stroke: '#0284C7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0284C7' }
      },
      {
        id: 'edge-root-cajas',
        source: rootId,
        target: deptCajasId,
        animated: true,
        style: { stroke: '#F59E0B', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' }
      }
    );

    // 3. Leaf Nodes for Deportes
    disciplines.forEach((sport, index) => {
      const sportNodeId = `sport-${sport.id}`;
      const sportCategories = categories.filter(c => c.disciplineId === sport.id);
      const assignedUsers = users.filter(u => u.scope?.disciplineIds?.includes(sport.id));

      nodes.push({
        id: sportNodeId,
        type: 'sportLeafNode',
        position: { x: 720, y: 30 + index * 95 },
        data: {
          sport,
          categoriesCount: sportCategories.length,
          assignedUsersCount: assignedUsers.length,
          onToggleActive: onToggleSportActive,
          onOpenPermissions: onOpenSportPermissions
        }
      });

      edges.push({
        id: `edge-deportes-${sport.id}`,
        source: deptDeportesId,
        target: sportNodeId,
        style: { stroke: '#10B981', strokeWidth: 1.5, strokeDasharray: '4 4' }
      });
    });

    // 4. Leaf Nodes for Users
    users.slice(0, 8).forEach((u, index) => {
      const userNodeId = `user-${u.id}`;
      nodes.push({
        id: userNodeId,
        type: 'userLeafNode',
        position: { x: 720, y: 250 + index * 85 },
        data: {
          user: u,
          onOpenPermissions: onOpenUserPermissions,
          onEditPassword: onEditUserPassword
        }
      });

      edges.push({
        id: `edge-usuarios-${u.id}`,
        source: deptUsuariosId,
        target: userNodeId,
        style: { stroke: '#0284C7', strokeWidth: 1.5, strokeDasharray: '4 4' }
      });
    });

    // 5. Leaf Nodes for CashBoxes
    cashBoxes.forEach((box, index) => {
      const boxNodeId = `box-${box.id}`;
      nodes.push({
        id: boxNodeId,
        type: 'cashLeafNode',
        position: { x: 720, y: 560 + index * 80 },
        data: {
          box,
          onOpenDetails: () => onOpenBranchPermissions('cajas')
        }
      });

      edges.push({
        id: `edge-cajas-${box.id}`,
        source: deptCajasId,
        target: boxNodeId,
        style: { stroke: '#F59E0B', strokeWidth: 1.5, strokeDasharray: '4 4' }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [
    club,
    disciplines,
    categories,
    users,
    cashBoxes,
    onOpenFrontEditor,
    onOpenSportPermissions,
    onOpenUserPermissions,
    onOpenBranchPermissions,
    onToggleSportActive,
    onEditUserPassword,
    onAddNewSport
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes and edges whenever dependencies update
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-[580px] rounded-3xl overflow-hidden border border-[#1A2B4C] bg-[#050A18] relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="touch-none"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1.5} 
          color="#1E293B" 
        />
        <Controls 
          className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-lg !m-3" 
        />
        <MiniMap 
          nodeColor={(n) => {
            if (n.type === 'rootNode') return '#38BDF8';
            if (n.type === 'deptNode') return '#818CF8';
            if (n.type === 'sportLeafNode') return '#10B981';
            if (n.type === 'userLeafNode') return '#38BDF8';
            return '#F59E0B';
          }}
          className="!bg-slate-950 !border !border-slate-800 !rounded-xl !overflow-hidden shadow-xl"
          maskColor="rgba(0, 0, 0, 0.7)"
        />
      </ReactFlow>

      {/* Floating Helper Banner */}
      <div className="absolute top-3 left-3 pointer-events-none z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[11px] text-slate-300 shadow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Grafo interactivo: podés arrastrar los nodos, hacer zoom y tocar <strong>Permisos</strong> en cualquier rama.</span>
      </div>
    </div>
  );
};
