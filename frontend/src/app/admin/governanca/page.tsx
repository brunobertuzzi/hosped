'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useActiveBranchData, useTenantStore } from '../../../store/useTenantStore';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

const COLUMNS = [
  { id: 'PENDENTE', title: 'Pendentes', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { id: 'EM_ANDAMENTO', title: 'Em Andamento', icon: <Loader2 className="w-4 h-4 text-brand animate-spin" /> },
  { id: 'CONCLUIDO', title: 'Concluído', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
];

export default function GovernancaPage() {
  const { cleaningTasks, rooms } = useActiveBranchData();
  const { updateCleaningTaskStatus } = useTenantStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Update status in zustand
    updateCleaningTaskStatus(draggableId, destination.droppableId);
  };

  if (!mounted) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight flex items-center gap-3">
            Governança <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-white/40 uppercase">Housekeeping</span>
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium">Controle de limpeza e arrumação de quartos (Kanban).</p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map(col => {
            const columnTasks = cleaningTasks.filter(t => t.status === col.id);
            
            return (
              <div key={col.id} className="glass-panel p-4 rounded-2xl flex flex-col min-h-[500px]">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                  {col.icon}
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest">{col.title}</h2>
                  <span className="ml-auto text-[10px] font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md">{columnTasks.length}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className={`flex-1 transition-colors rounded-xl p-2 -mx-2 ${snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''}`}
                    >
                      {columnTasks.map((task, index) => {
                        const room = rooms.find(r => r.id === task.roomId);
                        
                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style as React.CSSProperties}
                                className={`p-4 mb-3 rounded-xl border transition-all ${
                                  snapshot.isDragging ? 'bg-[#1a1a1a] border-brand/50 shadow-2xl scale-105' : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/10 px-2 py-1 rounded-md">
                                    Quarto {room?.numero || 'N/A'}
                                  </span>
                                  <span className="text-[9px] uppercase tracking-widest text-white/30">{task.id.substring(0,6)}</span>
                                </div>
                                <h3 className="text-[13px] font-bold text-white/90 mb-1">{task.tipoLimpeza.replace('_', ' ')}</h3>
                                {task.observacoes && (
                                  <p className="text-[11px] text-white/50 leading-relaxed mt-2 p-2 bg-black/40 rounded-lg border border-white/5">{task.observacoes}</p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </motion.div>
  );
}
