import PriorityBadge from '../PriorityBadge';

export const TaskCard = ({
  task,
  onSelect,
  onMoveStatus,
  availableTransitions = [],
}) => {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !['done', 'Done'].includes(task.status);

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const assigneeUser = task.assignedTo || task.assignee;
  const initials = assigneeUser?.name
    ? assigneeUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : null;

  return (
    <div
      onClick={() => onSelect(task)}
      className="group relative bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3"
    >
      {/* Top: Priority Pill & Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />

        {isOverdue && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-full">
            Overdue
          </span>
        )}
      </div>

      {/* Task Title */}
      <div>
        <h4 className="text-sm font-semibold text-stone-800 group-hover:text-[#4E8765] transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom Bar: Due Date & Assigned Avatar Stack */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
        {/* Due Date Badge */}
        {formattedDate ? (
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isOverdue ? 'text-red-600 font-semibold' : 'text-stone-500'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formattedDate}</span>
          </div>
        ) : (
          <span className="text-stone-300 text-[11px]">No due date</span>
        )}

        {/* Assignee Avatar Stack */}
        <div className="flex items-center">
          {assigneeUser ? (
            <div
              title={assigneeUser.name || assigneeUser.email}
              className="w-7 h-7 rounded-full bg-[#E8F2EC] text-[#2D5A40] border-2 border-white flex items-center justify-center font-bold text-[11px] shadow-xs"
            >
              {initials || 'U'}
            </div>
          ) : (
            <div
              title="Unassigned"
              className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 border-2 border-white flex items-center justify-center text-[10px] font-medium"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Quick Move Status Buttons on Card Hover */}
      {availableTransitions.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden group-hover:flex items-center gap-1.5 pt-2 border-t border-stone-100"
        >
          <span className="text-[10px] uppercase font-bold text-stone-400 mr-1">Move:</span>
          {availableTransitions.map((target) => (
            <button
              key={target}
              onClick={() => onMoveStatus(task._id, target)}
              className="text-[11px] font-semibold px-2 py-0.5 bg-stone-100 hover:bg-[#E8F2EC] hover:text-[#2D5A40] text-stone-700 rounded-md transition-colors"
            >
              → {target.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;

