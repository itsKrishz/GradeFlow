import React from 'react';
import { Server, Database, Shield, HardDrive, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const AdminSystem: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
          System Overview & Diagnostics
        </h2>
        <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
          Real-time server metrics, PostgreSQL node health, similarity indexing pipeline, and security audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Core Application Cluster</span>
            </h3>
            <Badge variant="green" size="sm">Online</Badge>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-academic-lightBorder dark:border-academic-darkBorder">
            <p><strong>Uptime:</strong> 99.98% (42 days continuous)</p>
            <p><strong>Memory Usage:</strong> 1.4 GB / 8 GB (17.5%)</p>
            <p><strong>CPU Load:</strong> 8% across 4 vCPUs</p>
          </div>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Relational Database Engine</span>
            </h3>
            <Badge variant="green" size="sm">Healthy</Badge>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-academic-lightBorder dark:border-academic-darkBorder">
            <p><strong>Engine:</strong> PostgreSQL 16 Enterprise</p>
            <p><strong>Active Transactions:</strong> 4 write, 28 read/sec</p>
            <p><strong>Last Backup:</strong> Today at 04:00 AM (Automated)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-academic-darkCard border border-academic-lightBorder dark:border-academic-darkBorder rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Similarity Analysis Queue</span>
            </h3>
            <Badge variant="purple" size="sm">Idle</Badge>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-academic-lightBorder dark:border-academic-darkBorder">
            <p><strong>Embeddings Engine:</strong> Academic Text Transformer</p>
            <p><strong>Indexed Submissions:</strong> 14,280 documents</p>
            <p><strong>Average Execution:</strong> 0.42s per submission</p>
          </div>
        </div>
      </div>
    </div>
  );
};
