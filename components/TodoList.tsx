
import React, { useState } from 'react';

export interface Todo {
    id: string;
    task: string;
    date: string; // YYYY-MM-DD
    completed: boolean;
}

interface TodoListProps {
    todos: Todo[];
    onAdd: (task: string, date: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onAdd, onToggle, onDelete }) => {
    const [newTask, setNewTask] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim()) {
            onAdd(newTask, newDate);
            setNewTask('');
        }
    };

    // Group todos by date
    const groupedTodos = todos.reduce((acc, todo) => {
        if (!acc[todo.date]) acc[todo.date] = [];
        acc[todo.date].push(todo);
        return acc;
    }, {} as Record<string, Todo[]>);

    const sortedDates = Object.keys(groupedTodos).sort();

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">To-Do List</h1>
            <p className="text-slate-500 mb-8">Personal reminders and unit preparation tasks.</p>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm mb-8 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Task Description</label>
                    <input 
                        required
                        type="text" 
                        placeholder="e.g. Clean windows for inspection..." 
                        className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</label>
                    <input 
                        type="date" 
                        className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full md:w-auto bg-[#1e3a8a] text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition shadow"
                >
                    Add Task
                </button>
            </form>

            <div className="space-y-8">
                {sortedDates.length > 0 ? (
                    sortedDates.map((date) => (
                        <div key={date}>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                <i className="fa-solid fa-calendar-day mr-2"></i>
                                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>
                            <div className="space-y-2">
                                {groupedTodos[date].map(todo => (
                                    <div key={todo.id} className="bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm group">
                                        <div className="flex items-center space-x-4">
                                            <button 
                                                onClick={() => onToggle(todo.id)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
                                            >
                                                {todo.completed && <i className="fa-solid fa-check text-xs"></i>}
                                            </button>
                                            <span className={`font-medium ${todo.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                                                {todo.task}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => onDelete(todo.id)}
                                            className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                        >
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <i className="fa-solid fa-list-check text-5xl text-slate-200 mb-4"></i>
                        <h3 className="text-xl font-bold text-slate-400">Your list is empty</h3>
                        <p className="text-slate-400">Add reminders for inspections, rent dates, or repairs.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoList;
