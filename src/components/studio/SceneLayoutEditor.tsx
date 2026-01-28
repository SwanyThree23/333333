'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers,
    Grid3X3,
    LayoutGrid,
    PictureInPicture2,
    MonitorPlay,
    Move,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Trash2,
    Plus,
    Image as ImageIcon,
    Video,
    Type,
    Globe,
    Camera,
    Sparkles,
    ChevronDown,
    GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '@/lib/store';
import { Scene, SceneSource, SceneLayout } from '@/types';

interface SceneLayoutEditorProps {
    className?: string;
}

const LAYOUTS: { id: SceneLayout; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: 'Single', icon: <MonitorPlay size={16} /> },
    { id: 'side-by-side', label: 'Side by Side', icon: <LayoutGrid size={16} /> },
    { id: 'pip', label: 'Picture in Picture', icon: <PictureInPicture2 size={16} /> },
    { id: 'grid', label: 'Grid', icon: <Grid3X3 size={16} /> },
    { id: 'custom', label: 'Custom', icon: <Move size={16} /> },
];

const SOURCE_TYPES: { type: SceneSource['type']; label: string; icon: React.ReactNode }[] = [
    { type: 'avatar', label: 'AI Avatar', icon: <Sparkles size={16} /> },
    { type: 'camera', label: 'Camera', icon: <Camera size={16} /> },
    { type: 'screen', label: 'Screen Share', icon: <MonitorPlay size={16} /> },
    { type: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
    { type: 'video', label: 'Video', icon: <Video size={16} /> },
    { type: 'browser', label: 'Browser', icon: <Globe size={16} /> },
    { type: 'text', label: 'Text', icon: <Type size={16} /> },
];

export function SceneLayoutEditor({ className }: SceneLayoutEditorProps) {
    const { activeScene, scenes, setActiveScene, addScene, removeScene } = useStudioStore();
    const [showAddSource, setShowAddSource] = useState(false);
    const [editingSource, setEditingSource] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleLayoutChange = (layout: SceneLayout) => {
        if (!activeScene) return;
        const updated = { ...activeScene, layout };
        setActiveScene(updated);
    };

    const handleAddSource = (type: SceneSource['type']) => {
        if (!activeScene) return;

        const newSource: SceneSource = {
            id: `source-${Date.now()}`,
            type,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Source`,
            position: { x: 50, y: 50 },
            size: { width: 400, height: 300 },
            zIndex: activeScene.sources.length,
            visible: true,
            locked: false,
            settings: {},
        };

        const updated = {
            ...activeScene,
            sources: [...activeScene.sources, newSource],
        };
        setActiveScene(updated);
        setShowAddSource(false);
    };

    const handleToggleSourceVisibility = (sourceId: string) => {
        if (!activeScene) return;
        const updated = {
            ...activeScene,
            sources: activeScene.sources.map(s =>
                s.id === sourceId ? { ...s, visible: !s.visible } : s
            ),
        };
        setActiveScene(updated);
    };

    const handleToggleSourceLock = (sourceId: string) => {
        if (!activeScene) return;
        const updated = {
            ...activeScene,
            sources: activeScene.sources.map(s =>
                s.id === sourceId ? { ...s, locked: !s.locked } : s
            ),
        };
        setActiveScene(updated);
    };

    const handleRemoveSource = (sourceId: string) => {
        if (!activeScene) return;
        const updated = {
            ...activeScene,
            sources: activeScene.sources.filter(s => s.id !== sourceId),
        };
        setActiveScene(updated);
    };

    const getSourceIcon = (type: SceneSource['type']) => {
        const sourceType = SOURCE_TYPES.find(s => s.type === type);
        return sourceType?.icon || <Layers size={16} />;
    };

    return (
        <div className={cn('glass rounded-2xl p-4', className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Layers size={18} className="text-accent-gold" />
                    Scene Layout
                </h3>
            </div>

            {activeScene ? (
                <>
                    {/* Layout Selector */}
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">Layout Type</label>
                        <div className="grid grid-cols-5 gap-1">
                            {LAYOUTS.map((layout) => (
                                <button
                                    key={layout.id}
                                    onClick={() => handleLayoutChange(layout.id)}
                                    className={cn(
                                        'p-2 rounded-lg flex flex-col items-center gap-1 transition-colors',
                                        activeScene.layout === layout.id
                                            ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/50'
                                            : 'bg-white/5 hover:bg-white/10 text-gray-400'
                                    )}
                                    title={layout.label}
                                >
                                    {layout.icon}
                                    <span className="text-[10px]">{layout.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div
                        ref={canvasRef}
                        className="relative aspect-video bg-surface-500 rounded-xl overflow-hidden mb-4 border border-white/10"
                    >
                        {activeScene.sources.map((source) => (
                            <motion.div
                                key={source.id}
                                className={cn(
                                    'absolute rounded-lg border-2 flex items-center justify-center transition-all cursor-move',
                                    source.visible ? 'opacity-100' : 'opacity-30',
                                    source.locked ? 'border-gray-500' : 'border-accent-gold',
                                    editingSource === source.id && 'ring-2 ring-accent-burgundy'
                                )}
                                style={{
                                    left: `${source.position.x}%`,
                                    top: `${source.position.y}%`,
                                    width: '30%',
                                    height: '40%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: source.zIndex,
                                }}
                                onClick={() => setEditingSource(source.id)}
                            >
                                <div className="text-center">
                                    <div className="w-8 h-8 mx-auto bg-white/10 rounded-lg flex items-center justify-center mb-1">
                                        {getSourceIcon(source.type)}
                                    </div>
                                    <span className="text-[10px] text-gray-400">{source.name}</span>
                                </div>
                            </motion.div>
                        ))}

                        {activeScene.sources.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No sources added</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Source List */}
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-400">Sources</label>
                            <button
                                onClick={() => setShowAddSource(!showAddSource)}
                                className="p-1 rounded-md bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 transition-colors"
                                title="Add Source"
                                aria-label="Add Source"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Add Source Dropdown */}
                        <AnimatePresence>
                            {showAddSource && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-4 gap-1 p-2 bg-white/5 rounded-lg overflow-hidden"
                                >
                                    {SOURCE_TYPES.map((sourceType) => (
                                        <button
                                            key={sourceType.type}
                                            onClick={() => handleAddSource(sourceType.type)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 flex flex-col items-center gap-1 transition-colors"
                                        >
                                            {sourceType.icon}
                                            <span className="text-[10px] text-gray-400">{sourceType.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Source Items */}
                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                            {activeScene.sources.map((source, index) => (
                                <div
                                    key={source.id}
                                    className={cn(
                                        'flex items-center gap-2 p-2 rounded-lg transition-colors',
                                        editingSource === source.id
                                            ? 'bg-accent-burgundy/20 border border-accent-burgundy/50'
                                            : 'bg-white/5 hover:bg-white/10'
                                    )}
                                    onClick={() => setEditingSource(source.id)}
                                >
                                    <GripVertical size={14} className="text-gray-500 cursor-grab" />
                                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                        {getSourceIcon(source.type)}
                                    </div>
                                    <span className="flex-1 text-sm truncate">{source.name}</span>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleSourceVisibility(source.id); }}
                                        className={cn('p-1 rounded', source.visible ? 'text-gray-400' : 'text-red-400')}
                                        title={source.visible ? 'Hide' : 'Show'}
                                    >
                                        {source.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleSourceLock(source.id); }}
                                        className={cn('p-1 rounded', source.locked ? 'text-yellow-400' : 'text-gray-400')}
                                        title={source.locked ? 'Unlock' : 'Lock'}
                                    >
                                        {source.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSource(source.id); }}
                                        className="p-1 rounded text-red-400 hover:bg-red-400/20"
                                        title="Remove"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transition Settings */}
                    <div className="border-t border-white/10 pt-4">
                        <label className="block text-xs text-gray-400 mb-2">Scene Transition</label>
                        <div className="grid grid-cols-4 gap-1">
                            {['cut', 'fade', 'slide', 'zoom'].map((transition) => (
                                <button
                                    key={transition}
                                    onClick={() => {
                                        if (activeScene) {
                                            setActiveScene({ ...activeScene, transitionType: transition as Scene['transitionType'] });
                                        }
                                    }}
                                    className={cn(
                                        'p-2 rounded-lg text-xs capitalize transition-colors',
                                        activeScene.transitionType === transition
                                            ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/50'
                                            : 'bg-white/5 hover:bg-white/10 text-gray-400'
                                    )}
                                >
                                    {transition}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No scene selected</p>
                    <p className="text-xs">Select a scene to edit its layout</p>
                </div>
            )}
        </div>
    );
}

interface SceneSwitcherProps {
    className?: string;
}

export function SceneSwitcher({ className }: SceneSwitcherProps) {
    const { scenes, activeScene, previewScene, setActiveScene, setPreviewScene, addScene } = useStudioStore();
    const [showNewScene, setShowNewScene] = useState(false);
    const [newSceneName, setNewSceneName] = useState('');

    const handleCreateScene = () => {
        if (!newSceneName.trim()) return;

        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name: newSceneName,
            sources: [],
            layout: 'single',
            transitionType: 'fade',
            transitionDuration: 300,
        };

        addScene(newScene);
        setNewSceneName('');
        setShowNewScene(false);
    };

    return (
        <div className={cn('glass rounded-2xl p-4', className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Scenes</h3>
                <button
                    onClick={() => setShowNewScene(!showNewScene)}
                    className="p-1 rounded-md bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 transition-colors"
                    title="Add Scene"
                    aria-label="Add Scene"
                >
                    <Plus size={14} />
                </button>
            </div>

            <AnimatePresence>
                {showNewScene && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 overflow-hidden"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSceneName}
                                onChange={(e) => setNewSceneName(e.target.value)}
                                placeholder="Scene name"
                                className="input-field flex-1 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
                            />
                            <button
                                onClick={handleCreateScene}
                                disabled={!newSceneName.trim()}
                                className="px-3 py-2 rounded-lg bg-accent-gold text-white text-sm disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-2">
                {scenes.map((scene) => (
                    <motion.button
                        key={scene.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveScene(scene)}
                        onDoubleClick={() => setPreviewScene(scene)}
                        className={cn(
                            'p-3 rounded-xl text-left transition-all',
                            activeScene?.id === scene.id
                                ? 'bg-accent-gold/20 border border-accent-gold/50 shadow-neon-gold'
                                : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        )}
                    >
                        <div className="aspect-video bg-surface-500 rounded-lg mb-2 flex items-center justify-center">
                            <Layers size={20} className="text-gray-500" />
                        </div>
                        <span className="text-xs font-medium truncate block">{scene.name}</span>
                        <span className="text-[10px] text-gray-500">{scene.sources.length} sources</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
