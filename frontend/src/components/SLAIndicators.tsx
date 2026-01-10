import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLABadgeProps {
  dueDate?: string | Date | null;
  isOverdue?: boolean;
  overdueHours?: number;
  className?: string;
}

export function SLABadge({ dueDate, isOverdue, overdueHours, className }: SLABadgeProps) {
  if (!dueDate) {
    return null; // Sem SLA configurado
  }

  const dueDateObj = new Date(dueDate);
  const now = new Date();
  const diffMs = dueDateObj.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Se está atrasado
  if (isOverdue || diffHours < 0) {
    const hoursOverdue = overdueHours || Math.abs(diffHours);
    const daysOverdue = Math.floor(hoursOverdue / 24);

    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        "bg-red-50 text-red-700 border border-red-200",
        className
      )}>
        <AlertCircle className="h-3.5 w-3.5" />
        <span>
          Atrasado {daysOverdue > 0 ? `${daysOverdue}d` : `${hoursOverdue}h`}
        </span>
      </div>
    );
  }

  // Próximo do vencimento (menos de 24h)
  if (diffHours <= 24) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        "bg-amber-50 text-amber-700 border border-amber-200",
        className
      )}>
        <Clock className="h-3.5 w-3.5" />
        <span>
          Vence em {diffHours}h
        </span>
      </div>
    );
  }

  // No prazo
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
      "bg-green-50 text-green-700 border border-green-200",
      className
    )}>
      <CheckCircle className="h-3.5 w-3.5" />
      <span>
        {diffDays > 0 ? `${diffDays}d restantes` : 'No prazo'}
      </span>
    </div>
  );
}

interface QualificationBadgeProps {
  status?: string;
  score?: number;
  className?: string;
}

export function QualificationBadge({ status, score, className }: QualificationBadgeProps) {
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'qualificado':
        return {
          label: 'Qualificado',
          color: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'em_contato':
        return {
          label: 'Em Contato',
          color: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'proposta_enviada':
        return {
          label: 'Proposta Enviada',
          color: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      case 'negociacao':
        return {
          label: 'Em Negociação',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
        };
      case 'fechado_ganho':
        return {
          label: 'Fechado/Ganho',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'fechado_perdido':
        return {
          label: 'Fechado/Perdido',
          color: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'sem_interesse':
        return {
          label: 'Sem Interesse',
          color: 'bg-gray-100 text-gray-800 border-gray-300'
        };
      case 'aguardando_retorno':
        return {
          label: 'Aguardando Retorno',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'novo':
      default:
        return {
          label: 'Novo',
          color: 'bg-slate-100 text-slate-800 border-slate-300'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium border",
      config.color,
      className
    )}>
      <span>{config.label}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-75">({score}/100)</span>
      )}
    </div>
  );
}

interface ActivityIndicatorProps {
  lastActivityAt?: string | Date | null;
  lastContactAt?: string | Date | null;
  className?: string;
}

export function ActivityIndicator({ lastActivityAt, lastContactAt, className }: ActivityIndicatorProps) {
  const getTimeSince = (date?: string | Date | null): string => {
    if (!date) return 'Nunca';
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
    return `${Math.floor(diffDays / 30)}m atrás`;
  };

  const activityTime = getTimeSince(lastActivityAt);
  const contactTime = getTimeSince(lastContactAt);

  // Determina se está "frio" (sem contato há muito tempo)
  const daysSinceContact = lastContactAt 
    ? Math.floor((new Date().getTime() - new Date(lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  const isCold = daysSinceContact > 7;
  const isWarm = daysSinceContact > 3 && daysSinceContact <= 7;
  const isHot = daysSinceContact <= 3;

  return (
    <div className={cn("flex flex-col gap-1 text-xs", className)}>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Atividade: {activityTime}</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <div className={cn(
          "h-2 w-2 rounded-full",
          isHot && "bg-green-500 animate-pulse",
          isWarm && "bg-yellow-500",
          isCold && "bg-red-500"
        )} />
        <span className={cn(
          "font-medium",
          isHot && "text-green-700",
          isWarm && "text-yellow-700",
          isCold && "text-red-700"
        )}>
          Contato: {contactTime}
        </span>
      </div>
    </div>
  );
}
