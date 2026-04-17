import React, { useEffect, useState, useMemo } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, ShoppingCart, Calendar, LogOut, 
  MessageSquare, Plus, Bell, Search, Filter, Phone, 
  Mail, X, ChevronRight, Edit3, Trash2, MapPin, Package, Clock
} from 'lucide-react';
import { Button, Card, Badge } from './components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isPast, addWeeks, parseISO } from 'date-fns';
import { Lead, Order, Interaction, UserProfile, LeadStage, OrderStatus, InteractionType } from './types';
import { LeadService, OrderService, InteractionService } from './services';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'orders' | 'followups'>('dashboard');
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (!userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || '',
              photoURL: u.photoURL || '',
              role: 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setUserProfile(newProfile);
          } else {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setUserProfile(null);
        setLeads([]);
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubLeads = LeadService.subscribeAll(user.uid, setLeads);
    const unsubOrders = OrderService.subscribeAll(user.uid, setOrders);
    return () => {
      unsubLeads();
      unsubOrders();
    };
  }, [user]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error("Login failed", error); }
  };

  const handleLogout = () => signOut(auth);

  const dashboardData = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.value : sum, 0);
    const dailyRevenue = orders.filter(o => isToday(parseISO(o.createdAt)) && o.status !== 'Cancelled')
                                .reduce((sum, o) => sum + o.value, 0);
    const activeLeads = leads.filter(l => l.stage !== 'Order Fulfilled').length;
    const deliveriesToday = orders.filter(o => o.expectedDeliveryDate && isToday(parseISO(o.expectedDeliveryDate)) && o.status !== 'Delivered').length;
    const pendingFollowups = leads.filter(l => l.nextFollowUpAt && isPast(parseISO(l.nextFollowUpAt))).length;

    return { totalRevenue, dailyRevenue, activeLeads, deliveriesToday, pendingFollowups };
  }, [leads, orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-olive-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-olive-700 border-t-transparent" />
          <p className="text-olive-700 font-serif italic text-lg tracking-wide">Cultivating Kisan CRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-6">
        <div className="max-w-md w-full p-12 text-center space-y-12 bg-paper border border-editorial-border rounded shadow-sm">
          <div className="space-y-4">
            <h1 className="logo-text">Kisan</h1>
            <p className="text-olive font-serif italic tracking-wide">Exotic Farming & Bulk Supply CRM</p>
          </div>
          <p className="text-sm text-ink opacity-60 leading-relaxed font-sans px-8">
            "Direct outreach tools for high-value B2B harvest operations and portfolio management."
          </p>
          <Button onClick={handleLogin} className="w-full" variant="primary" size="lg">
             Enter Management Suite
          </Button>
          <div className="text-[10px] text-olive font-bold uppercase tracking-[0.2em] pt-4">
             Solo-Operator Editorial Edition
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink font-sans selection:bg-olive/10">
      {/* Editorial Header */}
      <header className="px-12 py-8 bg-paper border-b border-editorial-border flex justify-between items-baseline z-50">
        <div className="logo-text">Kisan</div>
        <div className="font-serif italic text-sm text-ink/70">
           Exotic Harvest Portfolio &bull; {format(new Date(), 'EEEE, d MMMM yyyy')}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-editorial-border bg-paper flex flex-col p-8">
          <nav className="flex-1 space-y-6">
            <h4 className="editorial-header">Navigation</h4>
            <div className="space-y-1">
              <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <NavItem icon={<Users size={18} />} label="Pipeline" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
              <NavItem icon={<ShoppingCart size={18} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
              <NavItem icon={<Bell size={18} />} label="Reminders" active={activeTab === 'followups'} onClick={() => setActiveTab('followups')} count={dashboardData.pendingFollowups} />
            </div>
          </nav>

          <div className="mt-auto pt-8 border-t border-editorial-border flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} className="h-10 w-10 rounded border border-editorial-border" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-olive uppercase tracking-wider">{user.displayName}</p>
                <p className="text-[10px] opacity-60 italic">Authenticated Manager</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-red-700 hover:bg-red-50 rounded" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              END SESSION
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
               {activeTab === 'dashboard' && <DashboardView data={dashboardData} orders={orders} leads={leads} />}
               {activeTab === 'leads' && (
                 <div className="p-12">
                   <div className="flex justify-between items-center mb-10 border-b border-olive/30 pb-4">
                     <h2 className="font-serif text-3xl italic">Sales Pipeline</h2>
                     <Button variant="primary" onClick={() => setIsLeadModalOpen(true)}>+ New Lead</Button>
                   </div>
                   <LeadsView leads={leads} onSelect={setSelectedLead} />
                 </div>
               )}
               {activeTab === 'orders' && (
                 <div className="p-12">
                   <div className="flex justify-between items-center mb-10 border-b border-olive/30 pb-4">
                     <h2 className="font-serif text-3xl italic">Market Orders</h2>
                     <div className="flex gap-4">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                          <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 border border-editorial-border rounded text-xs w-48 bg-paper" />
                        </div>
                     </div>
                   </div>
                   <OrdersView orders={orders} leads={leads} uid={user?.uid || ''} />
                 </div>
               )}
               {activeTab === 'followups' && (
                 <div className="p-12">
                   <div className="flex justify-between items-center mb-10 border-b border-olive/30 pb-4">
                     <h2 className="font-serif text-3xl italic">Pending Actions</h2>
                   </div>
                   <FollowupsView leads={leads} />
                 </div>
               )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <div className="fixed bottom-8 right-8 z-[100]">
        <button className="bg-[#25D366] text-white px-6 py-3 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-transform active:scale-95">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          WhatsApp Hub
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isLeadModalOpen && (
          <LeadFormModal 
            onClose={() => setIsLeadModalOpen(false)} 
            uid={user.uid} 
          />
        )}
        {selectedLead && (
          <LeadDetailsDrawer 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)} 
            orders={orders.filter(o => o.leadId === selectedLead.id)}
            uid={user.uid}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all gap-3 rounded-[2px]",
        active 
          ? "bg-olive text-paper shadow-sm" 
          : "text-olive/70 hover:bg-bg hover:text-olive"
      )}
    >
      <span className="opacity-60">{icon}</span>
      {label}
      {count ? (
         <span className={cn(
           "ml-auto text-[9px] px-1.5 py-0.5 rounded-[1px] font-bold",
           active ? "bg-paper/20 text-paper" : "bg-olive text-paper"
         )}>
           {count}
         </span>
      ) : null}
    </button>
  );
}

function DashboardView({ data, orders, leads }: { data: any, orders: Order[], leads: Lead[] }) {
  const upcomingDeliveries = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled')
    .sort((a, b) => parseISO(a.expectedDeliveryDate).getTime() - parseISO(b.expectedDeliveryDate).getTime());
  
  const nextDelivery = upcomingDeliveries[0];
  const priorityReminders = leads.filter(l => l.nextFollowUpAt && isPast(parseISO(l.nextFollowUpAt))).slice(0, 4);

  return (
    <div className="flex h-full divide-x divide-editorial-border">
      {/* Left Rail: Dashboard Overview */}
      <section className="w-[280px] p-12 space-y-12 bg-paper flex-shrink-0">
        <div className="stat-block">
          <div className="editorial-header">Monthly Revenue</div>
          <div className="editorial-value">₹{(data.totalRevenue / 100000).toFixed(1)}L</div>
          <div className="editorial-sub">+12% from previous cycle</div>
        </div>
        <div className="stat-block">
          <div className="editorial-header">Active Pipeline</div>
          <div className="editorial-value">{data.activeLeads} Deals</div>
          <div className="editorial-sub">High value: 6 units</div>
        </div>
        <div className="stat-block">
          <div className="editorial-header">Avg. Cycle</div>
          <div className="editorial-value">18 Days</div>
          <div className="editorial-sub">WhatsApp-first workflow</div>
        </div>
      </section>

      {/* Center: Sales Pipeline Snapshot */}
      <section className="flex-1 p-12 overflow-y-auto">
        <div className="flex justify-between items-baseline mb-8">
          <h3 className="font-serif text-2xl text-ink">Active Pipeline</h3>
          <span className="text-[10px] uppercase font-bold text-olive/40 tracking-wider">Manage Deals</span>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          {["Negotiation", "Order Confirmed"].map(stage => (
            <div key={stage} className="space-y-6">
              <div className="editorial-header border-b-2 border-olive pb-2 mb-4">{stage}</div>
              <div className="space-y-4">
                {leads.filter(l => (l.stage as string) === stage).slice(0, 3).map(lead => (
                  <div key={lead.id} className="editorial-card cursor-pointer hover:border-olive transition-colors group">
                    <div className="font-serif text-base mb-1 group-hover:text-olive">{lead.name}</div>
                    <div className="text-[11px] text-ink/60 mb-2 italic">Outreach via {lead.leadSource}</div>
                    <Badge variant="default" className="text-[9px]">₹{(lead.totalValue / 1000).toFixed(1)}K</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Rail: Ops Focus */}
      <section className="w-[300px] p-8 space-y-10 bg-paper border-l border-editorial-border flex-shrink-0 overflow-y-auto">
        <div>
          <h3 className="font-serif text-lg mb-6 text-ink">Today's Focus</h3>
          <div className="space-y-4">
            {priorityReminders.map(lead => (
              <div key={lead.id} className="py-2 border-b border-editorial-border flex gap-3 group cursor-pointer hover:bg-bg/50 px-2 -mx-2 transition-colors">
                <div className="w-4 h-4 border border-olive rounded-full mt-1 flex-shrink-0" />
                <div>
                  <div className="text-[13px] leading-[1.4] text-ink">{lead.name}</div>
                  <div className="text-[11px] italic text-olive">WhatsApp Follow-up</div>
                </div>
              </div>
            ))}
            {priorityReminders.length === 0 && (
              <p className="text-xs italic text-ink/40 py-4">No urgent tasks today.</p>
            )}
          </div>
        </div>

        {nextDelivery && (
          <div className="p-6 bg-olive text-white rounded shadow-md">
            <h4 className="text-[10px] uppercase font-bold opacity-80 mb-2 tracking-widest text-white/90">Next Delivery Out</h4>
            <p className="font-serif text-lg leading-tight mb-3 font-bold">{nextDelivery.product}</p>
            <div className="text-[10px] opacity-70 italic border-t border-white/20 pt-3 mt-3 text-white/80">
               To: {nextDelivery.deliveryLocation}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
function StatCard({ title, value, trend }: { title: string, value: string, trend?: string }) {
  return (
    <div className="editorial-card p-6">
       <div className="editorial-header">{title}</div>
       <div className="editorial-value">{value}</div>
       {trend && <div className="editorial-sub">{trend}</div>}
    </div>
  );
}

function LeadsView({ leads, onSelect }: { leads: Lead[], onSelect: (l: Lead) => void }) {
  const stages: LeadStage[] = [
    "Outreach Initiated", "Product & Pricing Shared", "Interested / Inquiry", "Negotiation", "Order Confirmed", "Delivery Scheduled", "Order Fulfilled"
  ];

  return (
    <div className="flex gap-8 overflow-x-auto pb-10 min-h-[70vh] items-start">
       {stages.map(stage => (
         <div key={stage} className="min-w-[280px] flex flex-col gap-6">
            <div className="editorial-header border-b-2 border-olive pb-2 px-1">
               {stage}
            </div>
            <div className="space-y-4">
               {leads.filter(l => l.stage === stage).map(lead => (
                 <LeadItemCard key={lead.id} lead={lead} onClick={() => onSelect(lead)} />
               ))}
            </div>
         </div>
       ))}
    </div>
  );
}

function LeadItemCard({ lead, onClick, key }: { lead: Lead, onClick: () => void, key?: string }) {
  const isUrgent = lead.nextFollowUpAt && isPast(parseISO(lead.nextFollowUpAt));
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div 
        onClick={onClick}
        className={cn(
          "editorial-card cursor-pointer hover:border-olive transition-colors",
          isUrgent && "border-l-4 border-l-[#F27D26]"
        )}
      >
        <div className="font-serif text-base mb-1 text-ink">{lead.name}</div>
        <div className="text-[11px] text-ink/60 mb-3 block italic">{lead.phone} &bull; {lead.leadSource || 'Direct'}</div>
        
        <div className="flex items-center justify-between pt-3 border-t border-editorial-border">
           <Badge variant="default" className="text-[9px]">₹{(lead.totalValue / 1000).toFixed(1)}K</Badge>
           <span className="text-[9px] font-bold uppercase tracking-widest text-olive opacity-60">MANAGE DEAL</span>
        </div>
      </div>
    </motion.div>
  );
}

function LeadFormModal({ onClose, uid }: { onClose: () => void, uid: string }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    stage: 'Outreach Initiated' as LeadStage,
    leadSource: 'WhatsApp',
    totalValue: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await LeadService.create(uid, {
      ...formData,
      lastInteractionAt: new Date().toISOString(),
      nextFollowUpAt: addWeeks(new Date(), 1).toISOString()
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
       <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         className="absolute inset-0 bg-olive-900/40 backdrop-blur-sm" onClick={onClose} 
       />
       <motion.div 
         initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
         className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
       >
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-3xl font-serif font-bold text-olive-900 italic">Fresh Lead</h3>
             <button onClick={onClose} className="p-2 hover:bg-olive-50 rounded-full transition-colors"><X size={20} /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-olive-400 ml-1">Client Name</label>
              <input 
                required
                className="w-full bg-olive-50 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-olive-500 transition-all font-medium"
                placeholder="e.g. Surat Exports Ltd"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-olive-400 ml-1">WhatsApp/Phone</label>
                <input 
                  required
                  className="w-full bg-olive-50 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-olive-500 transition-all font-mono"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-olive-400 ml-1">Est. Value (₹)</label>
                <input 
                  type="number"
                  className="w-full bg-olive-50 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:ring-2 focus:ring-olive-500 transition-all font-mono"
                  placeholder="0"
                  value={formData.totalValue}
                  onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="pt-6">
              <Button type="submit" isLoading={isSubmitting} className="w-full py-5 rounded-2xl text-lg font-bold shadow-xl shadow-olive-100">
                 Create Record
              </Button>
            </div>
          </form>
       </motion.div>
    </div>
  );
}

function LeadDetailsDrawer({ lead, onClose, orders, uid }: { lead: Lead, onClose: () => void, orders: Order[], uid: string }) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [note, setNote] = useState('');
  const [isLogOrderOpen, setIsLogOrderOpen] = useState(false);

  useEffect(() => {
    return InteractionService.subscribeByLead(lead.id, setInteractions);
  }, [lead.id]);

  const handleLogInteraction = async (type: InteractionType) => {
    if (!note && type === 'Note') return;
    await InteractionService.log(uid, {
      leadId: lead.id,
      type,
      content: type === 'Note' ? note : `Initiated ${type} via App`
    });
    if (type === 'Note') setNote('');
    
    // Update next follow-up automatically
    await LeadService.update(lead.id, { 
       lastInteractionAt: new Date().toISOString(),
       nextFollowUpAt: addWeeks(new Date(), 1).toISOString() 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-olive-900/30 backdrop-blur-sm" onClick={onClose} />
       <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="relative w-full max-w-2xl bg-white h-screen shadow-2xl flex flex-col pt-10"
       >
          <div className="px-10 flex flex-col gap-6 flex-1 overflow-y-auto pb-10">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <h3 className="text-4xl font-serif font-bold text-olive-900 italic tracking-tight">{lead.name}</h3>
                   <div className="flex gap-4 items-center">
                      <span className="text-sm font-medium text-olive-500 flex items-center"><Phone size={14} className="mr-2" /> {lead.phone}</span>
                      <Badge variant="info">{lead.stage}</Badge>
                   </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-olive-50 rounded-full transition-colors"><X size={24} /></button>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-4">
                <Button onClick={() => handleLogInteraction('WhatsApp')} className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none py-4">
                   <MessageSquare className="mr-2" /> WhatsApp
                </Button>
                <Button onClick={() => handleLogInteraction('Call')} variant="secondary" className="py-4">
                   <Phone className="mr-2" /> Call Log
                </Button>
             </div>

             <section className="space-y-6 mt-8">
                <div className="flex justify-between items-center border-b border-olive-100 pb-4">
                   <h4 className="text-sm font-black uppercase tracking-widest text-olive-300">Active Orders</h4>
                   <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setIsLogOrderOpen(true)}>
                     <Plus size={14} className="mr-1" /> New Order
                   </Button>
                </div>
                {isLogOrderOpen && (
                   <div className="p-6 bg-olive-50 rounded-2xl border border-olive-200 space-y-4">
                      <OrderForm leadId={lead.id} uid={uid} onComplete={() => setIsLogOrderOpen(false)} />
                   </div>
                )}
                <div className="space-y-4">
                   {orders.map(order => (
                     <Card key={order.id} className="p-4 border-olive-100 bg-olive-50/30 flex justify-between items-center sm:grid-cols-2">
                        <div>
                           <p className="font-bold text-olive-900">{order.product} • {order.quantity}{order.unit}</p>
                           <p className="text-[10px] text-olive-400 font-mono mt-1">DUE: {format(parseISO(order.expectedDeliveryDate), 'MMM dd, yyyy')}</p>
                        </div>
                        <Badge variant={order.status === 'Delivered' ? 'success' : 'info'}>{order.status}</Badge>
                     </Card>
                   ))}
                   {orders.length === 0 && !isLogOrderOpen && <p className="text-center text-olive-300 text-xs italic py-4">No orders logged yet.</p>}
                </div>
             </section>

             <section className="space-y-6 mt-8">
                <h4 className="text-sm font-black uppercase tracking-widest text-olive-300 border-b border-olive-100 pb-4">History & Notes</h4>
                <div className="flex gap-2">
                   <input 
                     className="flex-1 bg-olive-50 border-none rounded-xl px-4 text-sm" 
                     placeholder="Add a quick note..."
                     value={note}
                     onChange={e => setNote(e.target.value)}
                   />
                   <Button onClick={() => handleLogInteraction('Note')} size="sm">Log</Button>
                </div>
                <div className="space-y-6 pl-4 border-l-2 border-olive-100">
                   {interactions.map(interaction => (
                     <div key={interaction.id} className="relative">
                        <div className="absolute -left-[21px] top-0 h-4 w-4 bg-white border-2 border-olive-200 rounded-full" />
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-[10px] font-bold uppercase text-olive-400">{interaction.type}</span>
                           <span className="text-[9px] font-mono text-olive-300">{format(parseISO(interaction.timestamp), 'MMM dd, HH:mm')}</span>
                        </div>
                        <p className="text-sm text-olive-800 leading-relaxed">{interaction.content}</p>
                     </div>
                   ))}
                </div>
             </section>
          </div>
       </motion.div>
    </div>
  );
}

function OrderForm({ leadId, uid, onComplete }: { leadId: string, uid: string, onComplete: () => void }) {
  const [formData, setFormData] = useState({
     product: '',
     quantity: 0,
     unit: 'kg',
     value: 0,
     deliveryLocation: '',
     expectedDeliveryDate: format(addWeeks(new Date(), 2), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await OrderService.create(uid, {
       ...formData,
       leadId,
       status: 'Confirmed'
    });
    // Update lead stage
    await LeadService.update(leadId, { stage: 'Order Confirmed' });
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
       <input required className="col-span-2 bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-serif outline-none focus:border-olive" placeholder="Product name (Exact variety)" value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})} />
       <input required type="number" className="bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-mono outline-none focus:border-olive" placeholder="Volume" onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
       <select className="bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-serif outline-none focus:border-olive" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
          <option>kg</option><option>Crates</option><option>Boxes</option><option>Metric Tons</option>
       </select>
       <input required type="number" className="bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-mono outline-none focus:border-olive" placeholder="Value (₹)" onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
       <input required type="date" className="bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-mono outline-none focus:border-olive" value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} />
       <input required className="col-span-2 bg-paper border border-editorial-border rounded-none px-4 py-3 text-sm font-serif outline-none focus:border-olive" placeholder="Target Destination" value={formData.deliveryLocation} onChange={e => setFormData({...formData, deliveryLocation: e.target.value})} />
       <div className="col-span-2 flex gap-2 pt-2">
          <Button type="submit" className="flex-1 rounded-none py-4 text-[10px] uppercase font-bold tracking-widest">Authorize Cycle</Button>
          <Button type="button" variant="outline" onClick={onComplete} className="rounded-none py-4 text-[10px] uppercase font-bold tracking-widest bg-paper">Withdraw</Button>
       </div>
    </form>
  )
}

function OrdersView({ orders, leads, uid }: { orders: Order[], leads: Lead[], uid: string }) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center mb-10">
          <div>
             <h3 className="text-3xl font-serif font-bold text-olive-900 italic">Order Pipeline</h3>
             <p className="text-olive-500 text-sm">Managing bulk fulfillment cycles</p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="rounded-2xl"><Filter size={18} className="mr-2" /> Filter by Status</Button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {orders.map(order => {
            const lead = leads.find(l => l.id === order.leadId);
            return (
              <Card key={order.id} className="p-8 hover:shadow-2xl transition-all border-none bg-white/80 ring-1 ring-olive-100/50 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-olive-50 rounded-3xl text-3xl shadow-inner border border-olive-100">
                       {order.product.toLowerCase().includes('berry') ? '🫐' : '📦'}
                    </div>
                    <Badge variant={order.status === 'Delivered' ? 'success' : 'info'}>{order.status}</Badge>
                 </div>
                 <h4 className="text-xl font-bold text-olive-950 mb-1">{order.product}</h4>
                 <p className="text-xs text-olive-400 font-bold uppercase tracking-widest mb-6">{lead?.name || 'Bulk Client'}</p>
                 
                 <div className="grid grid-cols-2 gap-4 border-t border-olive-50 pt-6 mt-auto">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-olive-300 uppercase">Quantity</p>
                       <p className="text-sm font-bold text-olive-700">{order.quantity} {order.unit}</p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] font-black text-olive-300 uppercase">Value</p>
                       <p className="text-sm font-mono font-black text-olive-900">₹{order.value.toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="mt-6 flex gap-2">
                    <Button variant="secondary" className="flex-1 text-[10px] py-3 tracking-widest uppercase">TRACK CYCLE</Button>
                    <Button variant="ghost" className="px-3" onClick={() => setEditingOrder(order)}><Edit3 size={16} /></Button>
                 </div>
              </Card>
            )
          })}
          {orders.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
               <ShoppingCart size={48} className="mx-auto text-olive-200" />
               <p className="text-olive-400 italic">No orders recorded in this cycle.</p>
            </div>
          )}
       </div>

       {editingOrder && (
         <OrderEditModal 
            order={editingOrder} 
            onClose={() => setEditingOrder(null)} 
            uid={uid} 
         />
       )}
    </div>
  );
}

function OrderEditModal({ 
  order, 
  onClose, 
  uid 
}: { 
  order: Order, 
  onClose: () => void, 
  uid: string 
}) {
  const [formData, setFormData] = useState({ ...order });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await OrderService.update(order.id, {
      product: formData.product,
      quantity: formData.quantity,
      unit: formData.unit,
      value: formData.value,
      deliveryLocation: formData.deliveryLocation,
      status: formData.status,
      expectedDeliveryDate: formData.expectedDeliveryDate,
    });
    setIsSubmitting(false);
    onClose();
  };

  const statuses: OrderStatus[] = ['Confirmed', 'In Transit', 'Delivered', 'Cancelled'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} 
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-paper w-full max-w-lg rounded-none shadow-2xl p-10 border border-editorial-border"
        >
           <div className="flex justify-between items-center mb-10 border-b border-editorial-border pb-6">
              <h3 className="text-2xl font-serif font-bold italic text-olive-900">Modify Cycle</h3>
              <button onClick={onClose} className="p-2 hover:bg-bg transition-colors"><X size={20} /></button>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-8">
             <div className="space-y-2">
               <label className="editorial-header">Product & Variety</label>
               <input 
                 required
                 className="w-full bg-paper border border-editorial-border rounded-none px-6 py-4 focus:border-olive transition-all font-serif outline-none"
                 value={formData.product}
                 onChange={e => setFormData({...formData, product: e.target.value})}
               />
             </div>

             <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="editorial-header">Volume / Unit</label>
                 <div className="flex gap-2">
                   <input 
                     type="number"
                     required
                     className="w-full bg-paper border border-editorial-border rounded-none px-4 py-4 focus:border-olive transition-all font-mono text-xs outline-none"
                     value={formData.quantity}
                     onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                   />
                   <select 
                     className="bg-paper border border-editorial-border rounded-none px-2 py-4 focus:border-olive transition-all font-serif text-sm outline-none"
                     value={formData.unit}
                     onChange={e => setFormData({...formData, unit: e.target.value})}
                   >
                     <option>kg</option><option>Crates</option><option>Boxes</option><option>Metric Tons</option>
                   </select>
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="editorial-header">Logistics Status</label>
                 <select 
                   className="w-full bg-paper border border-editorial-border rounded-none px-4 py-4 focus:border-olive transition-all font-serif text-sm outline-none"
                   value={formData.status}
                   onChange={e => setFormData({...formData, status: e.target.value as OrderStatus})}
                 >
                   {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="editorial-header">Cycle Value (₹)</label>
                 <input 
                   type="number"
                   className="w-full bg-paper border border-editorial-border rounded-none px-6 py-4 focus:border-olive transition-all font-mono text-xs outline-none"
                   value={formData.value}
                   onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="editorial-header">Delivery Target</label>
                 <input 
                   type="date"
                   className="w-full bg-paper border border-editorial-border rounded-none px-6 py-4 focus:border-olive transition-all font-mono text-xs outline-none"
                   value={formData.expectedDeliveryDate}
                   onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})}
                 />
               </div>
             </div>

             <div className="space-y-2">
                <label className="editorial-header">Destination Address</label>
                <input 
                  required
                  className="w-full bg-paper border border-editorial-border rounded-none px-6 py-4 focus:border-olive transition-all font-serif outline-none"
                  value={formData.deliveryLocation}
                  onChange={e => setFormData({...formData, deliveryLocation: e.target.value})}
                />
             </div>
             
             <div className="pt-8">
               <Button type="submit" isLoading={isSubmitting} className="w-full py-5 rounded-none uppercase font-bold tracking-widest text-[10px]">
                  Commit Adjustments
               </Button>
             </div>
           </form>
        </motion.div>
    </div>
  );
}

function FollowupsView({ leads }: { leads: Lead[] }) {
  const overdue = leads.filter(l => l.nextFollowUpAt && isPast(parseISO(l.nextFollowUpAt)));
  const upcoming = leads.filter(l => l.nextFollowUpAt && !isPast(parseISO(l.nextFollowUpAt)));

  return (
    <div className="max-w-4xl mx-auto space-y-12">
       <section>
          <div className="flex items-center gap-3 mb-8">
             <div className="h-8 w-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                <Clock size={18} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-olive-900 italic">Overdue Actions</h3>
          </div>
          <div className="space-y-4">
             {overdue.map(lead => (
               <Card key={lead.id} className="p-6 bg-orange-50/20 border-orange-100 flex items-center justify-between group">
                  <div className="flex flex-col gap-1">
                     <p className="text-[10px] font-mono font-bold text-orange-400">DUE {format(parseISO(lead.nextFollowUpAt), 'MMM dd')}</p>
                     <h5 className="text-lg font-bold text-olive-950">{lead.name}</h5>
                     <p className="text-xs text-olive-500">{lead.stage}</p>
                  </div>
                  <div className="flex gap-3">
                     <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl">
                        <MessageSquare size={16} className="mr-2" /> WhatsApp
                     </Button>
                     <Button className="bg-orange-600 hover:bg-orange-700 rounded-xl">RESCHEDULE</Button>
                  </div>
               </Card>
             ))}
             {overdue.length === 0 && <p className="text-center py-12 text-olive-300 italic">No overdue actions. Perfect!</p>}
          </div>
       </section>

       <section>
          <div className="flex items-center gap-3 mb-8">
             <div className="h-8 w-8 bg-olive-100 rounded-xl flex items-center justify-center text-olive-700">
                <Calendar size={18} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-olive-900 italic">Upcoming Reminders</h3>
          </div>
          <div className="space-y-3">
             {upcoming.sort((a,b) => parseISO(a.nextFollowUpAt).getTime() - parseISO(b.nextFollowUpAt).getTime()).map(lead => (
                <div key={lead.id} className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-olive-100">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono font-bold text-olive-300 w-16">{format(parseISO(lead.nextFollowUpAt), 'MMM dd')}</span>
                      <span className="font-bold text-olive-900">{lead.name}</span>
                   </div>
                   <Badge variant="default">{lead.stage}</Badge>
                </div>
             ))}
          </div>
       </section>
    </div>
  );
}
