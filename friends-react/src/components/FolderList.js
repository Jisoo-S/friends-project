import React, { useState, useEffect, useRef } from 'react';
import './FolderList.css';

const FolderList = ({ friends, friendsOrder, colorOrder, onUpdateOrder, onUpdateColorOrder, onOpenStampPage, isEditMode, onUpdateFriendColor }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const draggedElementRef = useRef(null);

  useEffect(() => {
    if (draggedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [draggedItem]);

  const performDrop = (dragged, dropped) => {
    const { item: draggedItemData, type: draggedType } = dragged;
    const { item: dropItem, type: dropType, index: dropIndex } = dropped;

    // Case 1: Dropping a file onto a group
    if (draggedType === 'item' && dropType === 'group') {
        if (friends[draggedItemData.name].color !== dropItem) {
            onUpdateFriendColor(draggedItemData.name, dropItem);
        }
    }

    // Case 2: Dropping a group onto another group
    if (draggedType === 'group' && dropType === 'group') {
        let newOrder = [...colorOrder];
        const draggedColor = draggedItemData;
        const targetColor = dropItem;
        const fromIndex = newOrder.indexOf(draggedColor);
        const toIndex = newOrder.indexOf(targetColor);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            newOrder[fromIndex] = targetColor;
            newOrder[toIndex] = draggedColor;
            onUpdateColorOrder(newOrder);
        }
    }
    
    // Case 2b: Dropping a group onto a separator
    if (draggedType === 'group' && dropType === 'separator') {
        let newOrder = [...colorOrder];
        const fromIndex = newOrder.indexOf(draggedItemData);
        let toIndex = dropIndex;

        if (fromIndex !== -1 && fromIndex !== toIndex) {
            const [movedItem] = newOrder.splice(fromIndex, 1);
            if (fromIndex < toIndex) {
                toIndex--;
            }
            newOrder.splice(toIndex, 0, movedItem);
            onUpdateColorOrder(newOrder);
        }
    }

    // Case 3: Dropping a file onto another file - swap their positions
    if (draggedType === 'item' && dropType === 'item') {
        let newOrder = [...friendsOrder];
        const draggedName = draggedItemData.name;
        const targetName = dropItem.name;
        const fromIndex = newOrder.indexOf(draggedName);
        const toIndex = newOrder.indexOf(targetName);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            newOrder.splice(fromIndex, 1);
            let insertAt = toIndex;
            if (fromIndex < toIndex) {
                insertAt = toIndex;
            } else {
                insertAt = toIndex;
            }
            newOrder.splice(insertAt, 0, draggedName);
            onUpdateOrder(newOrder);
        }
    }
  };

  const handleDragStart = (e, item, type) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging-source');
  };

  const handleDragEnd = (e) => {
    e.stopPropagation();
    const sourceElement = document.querySelector('.dragging-source');
    if (sourceElement) {
        sourceElement.classList.remove('dragging-source');
    }
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, item, type, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem) {
      setDropTarget({ item, type, index });
    }
  };

  const handleDrop = (e, dropItem, dropType, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    performDrop(draggedItem, { item: dropItem, type: dropType, index: dropIndex });
    
    setDropTarget(null);
  };

  const handleTouchMove = (e) => {
    if (!draggedItem || !draggedElementRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = touch.clientY - touchStartPos.y;
    draggedElementRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    if (draggedElementRef.current) {
        draggedElementRef.current.style.visibility = 'hidden';
    }
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (draggedElementRef.current) {
        draggedElementRef.current.style.visibility = 'visible';
    }

    if (targetElement) {
        const { item: draggedItemData, type: draggedType } = draggedItem;
        let newDropTarget = null;

        if (draggedType === 'group') {
            const groupElement = targetElement.closest('[data-type="group"]');
            const separatorElement = targetElement.closest('[data-type="separator"]');
            if (groupElement && groupElement.dataset.color !== draggedItemData) {
                const color = groupElement.dataset.color;
                const index = parseInt(groupElement.dataset.index, 10);
                newDropTarget = { item: color, type: 'group', index };
            } else if (separatorElement) {
                const index = parseInt(separatorElement.dataset.index, 10);
                newDropTarget = { item: null, type: 'separator', index };
            }
        } else if (draggedType === 'item') {
            const folderElement = targetElement.closest('[data-type="item"]');
            const groupElement = targetElement.closest('[data-type="group"]');
            if (folderElement && folderElement.dataset.name !== draggedItemData.name) {
                const name = folderElement.dataset.name;
                const index = parseInt(folderElement.dataset.index, 10);
                newDropTarget = { item: { name, index }, type: 'item', index };
            } else if (groupElement) {
                const color = groupElement.dataset.color;
                const index = parseInt(groupElement.dataset.index, 10);
                newDropTarget = { item: color, type: 'group', index };
            }
        }
        
        if (JSON.stringify(newDropTarget) !== JSON.stringify(dropTarget)) {
             setDropTarget(newDropTarget);
        }
    }
  };

  const handleTouchEnd = () => {
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);

    if (draggedElementRef.current) {
        draggedElementRef.current.style.transform = '';
    }

    if (draggedItem && dropTarget) {
        performDrop(draggedItem, dropTarget);
    }

    if (draggedElementRef.current) {
        draggedElementRef.current.classList.remove('dragging-source');
        draggedElementRef.current = null;
    }
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleTouchStart = (e, item, type) => {
    if (!isEditMode) {
      return;
    }
    e.stopPropagation();
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedItem({ item, type });
    draggedElementRef.current = e.currentTarget.parentElement;
    e.currentTarget.parentElement.classList.add('dragging-source');

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const groupFriendsByColor = () => {
    const groups = { yellow: [], pink: [], blue: [] };
    friendsOrder.forEach((name, index) => {
      if (friends[name]) {
        const color = friends[name].color || 'yellow';
        if (groups[color]) groups[color].push({ name, index });
      }
    });
    return groups;
  };

  const createFolderElement = (name, index) => {
    const friendData = friends[name];
    const color = friendData?.color || 'yellow';

    return (
      <div 
        key={name}
        className={`folder folder-${color} ${isEditMode ? 'edit-mode-item' : ''} ${draggedItem?.type === 'item' && draggedItem?.item?.name === name ? 'dragging-source' : ''}`}
        draggable={isEditMode}
        onDragStart={(e) => handleDragStart(e, { name, index }, 'item')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, { name, index }, 'item')}
        onDrop={(e) => handleDrop(e, { name, index }, 'item')}
        onClick={() => !isEditMode && onOpenStampPage(name)}
        data-name={name}
        data-index={index}
        data-type="item"
      >
        {isEditMode && <div className="drag-handle item-drag-handle" onTouchStart={(e) => handleTouchStart(e, { name, index }, 'item')}>☰</div>}
        <img src="https://cdn-icons-png.flaticon.com/512/716/716784.png" alt="folder" />
        <span>{name}</span>
      </div>
    );
  };

  const colorGroups = groupFriendsByColor();

  return (
    <div className="folder-list">
      {colorOrder && colorOrder.map((color, index) => {
        const friendsInColor = colorGroups[color];

        return (
            <React.Fragment key={color}>
              <div 
                className={`color-group ${isEditMode ? 'edit-mode' : ''} ${dropTarget?.type === 'group' && dropTarget?.item === color ? 'drop-target' : ''} ${draggedItem?.type === 'group' && draggedItem?.item === color ? 'dragging-source' : ''}`}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(e, color, 'group')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, color, 'group', index)}
                onDrop={(e) => handleDrop(e, color, 'group', index)}
                data-color={color}
                data-index={index}
                data-type="group"
              >
                {isEditMode && <div className="drag-handle group-drag-handle" onTouchStart={(e) => handleTouchStart(e, color, 'group')}>☰</div>}
                <div className={'folder-container'}>
                  {window.innerWidth > 600 ? (
                    <>
                      {Array.from({ length: Math.ceil(friendsInColor.length / 5) }).map((_, row) => (
                        <div key={row} className="folder-row-desktop">
                          {friendsInColor.slice(row * 5, row * 5 + 5).map(({ name, index }) => createFolderElement(name, index))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="folder-grid-mobile">
                      {friendsInColor.map(({ name, index }) => createFolderElement(name, index))}
                    </div>
                  )}
                </div>
              </div>
              {isEditMode && index < colorOrder.length - 1 && (
                <div 
                    className={`drop-separator ${dropTarget?.type === 'separator' && dropTarget?.index === index + 1 ? 'drop-target' : ''}`}
                    onDragOver={(e) => handleDragOver(e, null, 'separator', index + 1)}
                    onDrop={(e) => handleDrop(e, null, 'separator', index + 1)}
                    data-index={index + 1}
                    data-type="separator"
                />
              )}
            </React.Fragment>
        );
      })}
    </div>
  );
};

export default FolderList;