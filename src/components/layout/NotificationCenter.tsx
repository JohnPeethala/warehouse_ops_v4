'use client'

import React, { useState } from 'react';
import { useNotification, NotificationType } from '../providers/NotificationProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import classNames from 'classnames';

export function NotificationCenter() {
  const { notifications, removeNotification, clearAll } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  if (notifications.length === 0) return null;

  const persistentCount = notifications.filter(n => n.isPersistent).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'error': return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[400px]"
          >
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-sm">Notifications</span>
              <button 
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {notifications.slice().reverse().map(notif => (
                <div 
                  key={notif.id}
                  className={classNames(
                    "p-3 rounded-lg border flex items-start gap-3 relative group",
                    getBgColor(notif.type)
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium leading-tight">{notif.message}</p>
                    <span className="text-[10px] opacity-70 mt-1 block">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          "flex items-center justify-center p-3 rounded-full shadow-lg border backdrop-blur-xl transition-all",
          "bg-card/60 border-white/20 dark:border-white/10 text-foreground hover:bg-card/80"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {isOpen ? <X className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          
          {!isOpen && notifications.length > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white">
              {persistentCount > 0 ? persistentCount : notifications.length}
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
