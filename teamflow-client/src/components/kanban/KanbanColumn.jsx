import TaskCard from './TaskCard';

export const KanbanColumn = ({
  column,
  tasks = [],
  onSelectTask,
  onMoveStatus,
  onAddTask,
  transitions = [],
}) => {
  return (
    <div className="flex flex-col bg-stone-100/70 border border-stone-200/80 rounded-3xl p-4 min-h-[550px] shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3 h-3 rounded-full ${
              column.color || 'bg-stone-400'
            }`}
          />
          <h3 className="font-bold text-sm text-stone-800 tracking-tight">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-stone-200/80 text-stone-700">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(column.id)}
          title={`Add task to ${column.title}`}
          className="p-1 rounded-lg text-stone-500 hover:text-[#4E8765] hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onSelect={onSelectTask}
              onMoveStatus={onMoveStatus}
              availableTransitions={transitions}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-stone-200/70 rounded-2xl bg-white/40">
            <p className="text-xs font-medium text-stone-400">No tasks in {column.title}</p>
            <button
              onClick={() => onAddTask(column.id)}
              className="mt-2 text-xs font-semibold text-[#4E8765] hover:text-[#3B6B50]"
            >
              + Create a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

