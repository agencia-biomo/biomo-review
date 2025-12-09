"use client";

import { FeedbackStatus, StatusHistoryEntry, STATUS_LABELS } from "@/types";
import {
  Circle,
  AlertCircle,
  Loader2,
  Hourglass,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  User,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/date-utils";

interface StatusHistoryTimelineProps {
  statusHistory?: StatusHistoryEntry[];
  currentStatus: FeedbackStatus;
  createdAt: Date;
  createdBy: string;
}

const STATUS_ICONS: Record<FeedbackStatus, typeof Circle> = {
  new: Circle,
  in_review: AlertCircle,
  in_progress: Loader2,
  waiting_client: Hourglass,
  rejected: XCircle,
  completed: CheckCircle2,
};

const STATUS_GRADIENTS: Record<FeedbackStatus, string> = {
  new: "from-red-500 to-orange-500",
  in_review: "from-yellow-500 to-amber-500",
  in_progress: "from-blue-500 to-cyan-500",
  waiting_client: "from-purple-500 to-violet-500",
  rejected: "from-gray-500 to-slate-500",
  completed: "from-green-500 to-emerald-500",
};

const STATUS_BORDER_COLORS: Record<FeedbackStatus, string> = {
  new: "border-red-500/30",
  in_review: "border-yellow-500/30",
  in_progress: "border-blue-500/30",
  waiting_client: "border-purple-500/30",
  rejected: "border-gray-500/30",
  completed: "border-green-500/30",
};

const STATUS_BG_COLORS: Record<FeedbackStatus, string> = {
  new: "bg-red-500/10",
  in_review: "bg-yellow-500/10",
  in_progress: "bg-blue-500/10",
  waiting_client: "bg-purple-500/10",
  rejected: "bg-gray-500/10",
  completed: "bg-green-500/10",
};

export function StatusHistoryTimeline({
  statusHistory = [],
  currentStatus,
  createdAt,
  createdBy,
}: StatusHistoryTimelineProps) {
  // Build timeline entries
  const timelineEntries: {
    status: FeedbackStatus;
    changedBy: string;
    changedAt: Date;
    fromStatus: FeedbackStatus | null;
    note?: string;
    isCurrent: boolean;
  }[] = [];

  // Add initial creation entry
  timelineEntries.push({
    status: "new",
    changedBy: createdBy,
    changedAt: new Date(createdAt),
    fromStatus: null,
    isCurrent: statusHistory.length === 0 && currentStatus === "new",
  });

  // Add all status changes from history
  statusHistory.forEach((entry, index) => {
    // Skip if it's the initial "new" status (already added above)
    if (entry.fromStatus === null && entry.toStatus === "new") return;

    timelineEntries.push({
      status: entry.toStatus,
      changedBy: entry.changedBy,
      changedAt: new Date(entry.changedAt),
      fromStatus: entry.fromStatus,
      note: entry.note,
      isCurrent: index === statusHistory.length - 1,
    });
  });

  // If there's no history but status isn't "new", add current status
  if (statusHistory.length === 0 && currentStatus !== "new") {
    timelineEntries.push({
      status: currentStatus,
      changedBy: "sistema",
      changedAt: new Date(),
      fromStatus: "new",
      isCurrent: true,
    });
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white flex items-center gap-2">
        <Clock className="w-4 h-4 text-purple-400" />
        Historico de Status
      </h4>

      <div className="relative">
        {/* Vertical line connecting entries */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-white/10" />

        <div className="space-y-3">
          {timelineEntries.map((entry, index) => {
            const Icon = STATUS_ICONS[entry.status];
            const isLast = index === timelineEntries.length - 1;

            return (
              <div
                key={`${entry.status}-${index}`}
                className={`
                  relative flex items-start gap-3 pl-0
                  ${isLast ? "" : "pb-1"}
                `}
              >
                {/* Status icon */}
                <div
                  className={`
                    relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${entry.isCurrent
                      ? `bg-gradient-to-r ${STATUS_GRADIENTS[entry.status]} shadow-lg`
                      : `${STATUS_BG_COLORS[entry.status]} border ${STATUS_BORDER_COLORS[entry.status]}`
                    }
                  `}
                >
                  <Icon
                    className={`
                      w-4 h-4
                      ${entry.isCurrent ? "text-white" : "text-white/70"}
                      ${entry.status === "in_progress" && entry.isCurrent ? "animate-spin" : ""}
                    `}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* From status arrow To status */}
                    {entry.fromStatus && (
                      <>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BG_COLORS[entry.fromStatus]} ${STATUS_BORDER_COLORS[entry.fromStatus]} border text-white/60`}>
                          {STATUS_LABELS[entry.fromStatus]}
                        </span>
                        <ArrowRight className="w-3 h-3 text-white/40" />
                      </>
                    )}
                    <span
                      className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${entry.isCurrent
                          ? `bg-gradient-to-r ${STATUS_GRADIENTS[entry.status]} text-white`
                          : `${STATUS_BG_COLORS[entry.status]} ${STATUS_BORDER_COLORS[entry.status]} border text-white/80`
                        }
                      `}
                    >
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {entry.isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        atual
                      </span>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {entry.changedBy === "cliente" ? "Cliente" : entry.changedBy === "admin" ? "Administrador" : entry.changedBy}
                    </span>
                    <span>{formatRelativeDate(entry.changedAt)}</span>
                  </div>

                  {/* Note */}
                  {entry.note && (
                    <p className="mt-1.5 text-xs text-white/50 italic">
                      &quot;{entry.note}&quot;
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {timelineEntries.length <= 1 && (
        <p className="text-xs text-white/40 text-center py-2">
          Nenhuma mudanca de status registrada ainda.
        </p>
      )}
    </div>
  );
}
