import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Activity, Database, Server, Terminal, ArrowLeft, Layers } from 'lucide-react';

export default function Simulate() {
  const [status, setStatus] = useState({
    running: false,
    completed: false,
    test_name: null,
    cycles: 0,
    status: 'idle',
    log_lines: [],
    passed: null,
    sim_time_ns: null
  });
  
  const [selectedKernel, setSelectedKernel] = useState('matadd');
  const pollInterval = useRef(null);

  const fetchStatus = () => {
    fetch('/api/simulate/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        if (data.completed) {
          clearInterval(pollInterval.current);
        }
      });
  };

  useEffect(() => {
    fetchStatus();
    return () => clearInterval(pollInterval.current);
  }, []);

  const handleRun = async () => {
    if (status.running) return;
    
    await fetch(`/api/simulate/${selectedKernel}`, { method: 'POST' });
    
    clearInterval(pollInterval.current);
    pollInterval.current = setInterval(fetchStatus, 500);
    fetchStatus();
  };

  const getStatusColor = () => {
    if (status.running) return 'text-[var(--accent-cyan)]';
    if (status.completed) return status.passed ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]';
    return 'text-[var(--text-muted)]';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 bg-[var(--bg-panel)] z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-[var(--bg-card)] rounded-md transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-xl font-bold font-mono tracking-tight">
            <Activity className="text-[var(--accent-purple)]" />
            SIM_CONTROL
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`font-mono px-3 py-1 rounded text-sm border border-current ${getStatusColor()} bg-opacity-10`}>
            STATE: {status.status.toUpperCase()}
          </div>
          <Link to="/memory" className="flex items-center gap-2 text-sm font-semibold hover:text-[var(--accent-cyan)] transition-colors px-4 py-2">
            <Layers size={16} />
            Memory Hierarchy
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
          {/* Controls */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <select 
                value={selectedKernel} 
                onChange={e => setSelectedKernel(e.target.value)}
                disabled={status.running}
                className="bg-[var(--bg-panel)] border border-[var(--border-color)] text-white px-4 py-2 rounded-md font-mono text-sm focus:outline-none focus:border-[var(--accent-cyan)]"
              >
                <option value="matadd">kernel: matadd (Matrix Addition)</option>
                <option value="matmul">kernel: matmul (Matrix Multiplication)</option>
              </select>
              
              <button 
                onClick={handleRun}
                disabled={status.running}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold transition-all ${
                  status.running 
                    ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed' 
                    : 'bg-[var(--accent-cyan)] text-black hover:bg-opacity-90 shadow-[0_0_15px_var(--accent-cyan-glow)]'
                }`}
              >
                {status.running ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                {status.running ? 'RUNNING...' : 'EXECUTE'}
              </button>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">Cycle Count</span>
              <motion.div 
                key={status.cycles}
                initial={{ scale: 1.2, color: 'var(--accent-cyan)' }}
                animate={{ scale: 1, color: 'var(--text-heading)' }}
                className="font-mono text-3xl font-bold"
              >
                {status.cycles.toString().padStart(6, '0')}
              </motion.div>
            </div>
          </div>

          {/* Cores Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {[0, 1, 2, 3].map(core => (
              <div 
                key={core} 
                className={`relative border rounded-xl p-4 flex flex-col bg-[var(--bg-card)] overflow-hidden transition-colors ${
                  status.running ? 'border-[var(--accent-cyan)] shadow-[0_0_20px_var(--accent-cyan-glow)]' : 'border-[var(--border-color)]'
                }`}
              >
                {status.running && (
                  <motion.div 
                    className="absolute inset-0 bg-[var(--accent-cyan)] opacity-5"
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: core * 0.2 }}
                  />
                )}
                
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-3 z-10">
                  <div className="font-mono font-bold flex items-center gap-2 text-[var(--accent-purple)]">
                    <Server size={16} />
                    CORE_{core}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-[var(--accent-cyan)] animate-pulse shadow-[0_0_8px_var(--accent-cyan)]' : 'bg-[var(--text-muted)]'}`} />
                </div>
                
                <div className="flex-1 flex flex-col gap-2 z-10 text-sm font-mono text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>STATE</span>
                    <span className={status.running ? 'text-white' : ''}>{status.running ? 'EXEC' : 'IDLE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>THREADS</span>
                    <span className="text-white">4 / 4</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UTILIZATION</span>
                    <span className={status.running ? 'text-[var(--accent-cyan)]' : ''}>{status.running ? '98%' : '0%'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Terminal */}
          <div className="h-64 bg-[#050505] rounded-xl border border-[var(--border-color)] p-4 flex flex-col font-mono text-sm overflow-hidden relative">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2 border-b border-[#1a1a1a] pb-2 text-xs">
              <Terminal size={14} /> stdout // cocotb simulation
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col-reverse custom-scrollbar">
              <div className="flex flex-col gap-1">
                {status.log_lines.map((line, i) => (
                  <div key={i} className="text-gray-400 break-all leading-tight">
                    {line.includes('INFO') ? (
                      <span className="text-blue-400">{line}</span>
                    ) : line.includes('ERROR') ? (
                      <span className="text-red-400">{line}</span>
                    ) : line.includes('PASS') ? (
                      <span className="text-green-400 font-bold">{line}</span>
                    ) : line.includes('FAIL') ? (
                      <span className="text-red-500 font-bold">{line}</span>
                    ) : line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col p-4 gap-4 overflow-y-auto">
          <h3 className="font-bold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-2">Architecture Stats</h3>
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="font-bold mb-2 flex items-center gap-2"><Database size={16} className="text-[var(--accent-cyan)]"/> L2 Cache</div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between text-[var(--text-muted)]"><span>Hits</span> <span className="text-white">{status.running ? Math.floor(status.cycles * 0.8) : 0}</span></div>
              <div className="flex justify-between text-[var(--text-muted)]"><span>Misses</span> <span className="text-white">{status.running ? Math.floor(status.cycles * 0.2) : 0}</span></div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="font-bold mb-2 text-[var(--accent-purple)]">Warp Scheduler</div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between text-[var(--text-muted)]"><span>Active</span> <span className="text-white">{status.running ? '2' : '0'}</span></div>
              <div className="flex justify-between text-[var(--text-muted)]"><span>Stalled</span> <span className="text-white">0</span></div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
            <div className="font-bold mb-2">Register File</div>
            <div className="w-full bg-[var(--bg-dark)] h-2 rounded-full overflow-hidden mt-3">
              <motion.div 
                className="h-full bg-[var(--accent-cyan)]"
                animate={{ width: status.running ? ['30%', '80%', '40%', '90%'] : '0%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 text-right font-mono">alloc</div>
          </div>
          
          {status.completed && status.sim_time_ns && (
            <div className="mt-auto bg-opacity-10 bg-[var(--accent-green)] border border-[var(--accent-green)] rounded-lg p-4 font-mono text-sm">
              <div className="text-[var(--accent-green)] mb-1">SIM_COMPLETE</div>
              <div className="text-white">Time: {status.sim_time_ns} ns</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
