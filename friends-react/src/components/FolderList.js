import React, { useState, useEffect } from 'react';
import './FolderList.css';

const FolderList = ({ friends, friendsOrder, colorOrder, onUpdateOrder, onUpdateColorOrder, onOpenStampPage, isEditMode, onUpdateFriendColor }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  useEffect(() => {
    if (draggedItem) {
      const preventScroll = (e) => {
        e.preventDefault();
      };

      window.addEventListener('touchmove', preventScroll, { passive: false });
      window.addEventListener('wheel', preventScroll, { passive: false });

      return () => {
        window.removeEventListener('touchmove', preventScroll);
        window.removeEventListener('wheel', preventScroll);
      };
    }
  }, [draggedItem]);


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
    e.currentTarget.classList.remove('dragging-source');
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, item, type, index) => {
    e.preventDefault();
    e.stopPropagation();
    

    
    if (draggedItem) {
      if (type === 'group' || type === 'separator') {
        setDropTarget({ item, type, index });
      } else if (type === 'item') {
        setDropTarget({ item, type, index });
      }
    }
  };

  const handleDrop = async (e, dropItem, dropType, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    const { item: draggedItemData, type: draggedType } = draggedItem;

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

        console.log(`Group Drag: "${draggedColor}" (index ${fromIndex}) to "${targetColor}" (index ${toIndex})`);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            // Simply swap the positions
            newOrder[fromIndex] = targetColor;
            newOrder[toIndex] = draggedColor;
            
            console.log('New color order:', newOrder);
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

        console.log(`File Drag: "${draggedName}" (index ${fromIndex}) to "${targetName}" (index ${toIndex})`);

        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            // Remove dragged item from original position
            newOrder.splice(fromIndex, 1);
            
            // Insert at the target position
            // The target index needs adjustment if we're moving from left to right
            let insertAt = toIndex;
            if (fromIndex < toIndex) {
                // Moving right: target has shifted left by 1
                insertAt = toIndex;
            } else {
                // Moving left: insert before target
                insertAt = toIndex;
            }
            
            newOrder.splice(insertAt, 0, draggedName);
            
            console.log('New friends order:', newOrder);
            onUpdateOrder(newOrder);
        }
    }
    setDropTarget(null);
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
      >
        {isEditMode && <div className="drag-handle item-drag-handle">☰</div>}
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
              >
                {isEditMode && <div className="drag-handle group-drag-handle">☰</div>}
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
                />
              )}
            </React.Fragment>
        );
      })}
    </div>
  );
};

export default FolderList;