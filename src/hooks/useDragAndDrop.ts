"use client";

import { useState, useCallback, DragEvent } from "react";

interface UseDragAndDropOptions<T> {
  items: T[];
  idKey: keyof T;
  onReorder?: (items: T[]) => void;
  onDrop?: (draggedItem: T, targetItem: T, position: "before" | "after") => void;
}

export function useDragAndDrop<T>({
  items,
  idKey,
  onReorder,
  onDrop,
}: UseDragAndDropOptions<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"before" | "after" | null>(null);

  const handleDragStart = useCallback((e: DragEvent<HTMLElement>, item: T) => {
    const id = String(item[idKey]);
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    
    // Add a slight delay to show the drag effect
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  }, [idKey]);

  const handleDragEnd = useCallback((e: DragEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
    setDraggedId(null);
    setDragOverId(null);
    setDragPosition(null);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>, item: T) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const id = String(item[idKey]);
    if (id === draggedId) return;
    
    // Determine if dropping before or after
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "before" : "after";
    
    setDragOverId(id);
    setDragPosition(position);
  }, [idKey, draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
    setDragPosition(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLElement>, targetItem: T) => {
    e.preventDefault();
    
    const draggedItemId = e.dataTransfer.getData("text/plain");
    const targetId = String(targetItem[idKey]);
    
    if (draggedItemId === targetId) return;
    
    const draggedItem = items.find(item => String(item[idKey]) === draggedItemId);
    if (!draggedItem) return;
    
    if (onDrop && dragPosition) {
      onDrop(draggedItem, targetItem, dragPosition);
    }
    
    if (onReorder) {
      const newItems = [...items];
      const draggedIndex = newItems.findIndex(item => String(item[idKey]) === draggedItemId);
      const targetIndex = newItems.findIndex(item => String(item[idKey]) === targetId);
      
      // Remove dragged item
      const [removed] = newItems.splice(draggedIndex, 1);
      
      // Calculate new position
      let insertIndex = targetIndex;
      if (dragPosition === "after") {
        insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }
      
      // Insert at new position
      newItems.splice(insertIndex, 0, removed);
      
      onReorder(newItems);
    }
    
    setDraggedId(null);
    setDragOverId(null);
    setDragPosition(null);
  }, [items, idKey, onDrop, onReorder, dragPosition]);

  const getDragProps = useCallback((item: T) => {
    const id = String(item[idKey]);
    const isDragging = draggedId === id;
    const isDragOver = dragOverId === id;
    
    return {
      draggable: true,
      onDragStart: (e: DragEvent<HTMLElement>) => handleDragStart(e, item),
      onDragEnd: handleDragEnd,
      onDragOver: (e: DragEvent<HTMLElement>) => handleDragOver(e, item),
      onDragLeave: handleDragLeave,
      onDrop: (e: DragEvent<HTMLElement>) => handleDrop(e, item),
      "data-dragging": isDragging,
      "data-drag-over": isDragOver,
      "data-drag-position": isDragOver ? dragPosition : null,
    };
  }, [idKey, draggedId, dragOverId, dragPosition, handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop]);

  return {
    draggedId,
    dragOverId,
    dragPosition,
    getDragProps,
    isDragging: draggedId !== null,
  };
}
