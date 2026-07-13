'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { LayoutDashboard, Users, Landmark, ShieldCheck, Plus, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        const inc = data
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0);
        const exp = data
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);
        setTransactions(data);
        setStats({ income: inc, expense: exp, balance: inc - exp });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get('title'),
      amount: Number(formData.get('amount')),
      type: formData.get('type'),
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const { error } = await supabase.from('transactions').insert([payload]);
      if (!error) {
        setIsModalOpen(false);
        fetchData();
        (e.target as HTMLFormElement).reset();
      } else {
        alert('Error: ' + error.message);
      }
    } catch (error) {
      alert('Error saving transaction');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  const chartData = [
    { name: 'สรุป', income: stats.income, expense: stats.expense },
  ];

  const pieData = [
    { name: 'รายรับ', value: stats.income },
    { name: 'รายจ่าย', value: stats.expense },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col h-[calc(100vh-70px)]">
          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={20} />
              ภาพรวม
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${
                activeTab === 'transactions'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={20} />
              รายการ
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <TrendingUp size={20} />
              รายงาน
            </button>
          </nav>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 w-full hover:bg-orange-700 transition-colors"
          >
            <Plus size={20} />
            บันทึกรายการ
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div className="animate-in fade-in">
              <h1 className="text-3xl font-black mb-8 text-slate-900">ภาพรวมบัญชี</h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="card">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">รายรับทั้งหมด</p>
                  <p className="text-3xl font-black text-green-600">฿{stats.income.toLocaleString()}</p>
                </div>
                <div className="card">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">รายจ่ายทั้งหมด</p>
                  <p className="text-3xl font-black text-red-500">฿{stats.expense.toLocaleString()}</p>
                </div>
                <div className="card">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">ยอดคงเหลือ</p>
                  <p className={`text-3xl font-black ${
                    stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    ฿{stats.balance.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">เปรียบเทียบรายรับ-รายจ่าย</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="income" fill="#10b981" radius={[10, 10, 0, 0]} name="รายรับ" />
                      <Bar dataKey="expense" fill="#ef4444" radius={[10, 10, 0, 0]} name="รายจ่าย" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">สัดส่วน</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <h3 className="font-bold text-slate-900 mb-4">รายการล่าสุด</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">วันที่</th>
                        <th className="p-4">รายการ</th>
                        <th className="p-4">หมวดหมู่</th>
                        <th className="p-4 text-right">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 border-b border-slate-50">
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(t.date).toLocaleDateString('th-TH')}
                          </td>
                          <td className="p-4 font-semibold text-slate-900">{t.title}</td>
                          <td className="p-4">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                t.type === 'income'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-black ${
                            t.type === 'income' ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {t.type === 'income' ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-in fade-in">
              <h1 className="text-3xl font-black mb-8 text-slate-900">รายการทั้งหมด</h1>
              <div className="card overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">วันที่</th>
                      <th className="p-4">รายการ</th>
                      <th className="p-4">ประเภท</th>
                      <th className="p-4 text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 border-b border-slate-50">
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(t.date).toLocaleDateString('th-TH')}
                        </td>
                        <td className="p-4 font-semibold">{t.title}</td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              t.type === 'income'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-black ${
                          t.type === 'income' ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-in fade-in">
              <h1 className="text-3xl font-black mb-8 text-slate-900">รายงาน</h1>
              <div className="grid grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">สรุปรายรับ-รายจ่าย</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-slate-600">รายรับ</span>
                      <span className="text-lg font-bold text-green-600">฿{stats.income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-slate-600">รายจ่าย</span>
                      <span className="text-lg font-bold text-red-500">฿{stats.expense.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-900 font-bold">ยอดสุทธิ</span>
                      <span className={`text-lg font-black ${
                        stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        ฿{stats.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-bold text-slate-900 mb-4">สถิติ</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-600 text-sm">จำนวนรายการ</p>
                      <p className="text-2xl font-black text-slate-900">{transactions.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm">เปอร์เซ็นต์รายรับ</p>
                      <p className="text-2xl font-black text-green-600">
                        {stats.income + stats.expense > 0
                          ? (((stats.income / (stats.income + stats.expense)) * 100).toFixed(1))
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-black mb-6 text-slate-900">บันทึกรายการ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ประเภท</label>
                <select
                  name="type"
                  defaultValue="income"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-300 font-semibold"
                >
                  <option value="income">รายรับ (+)</option>
                  <option value="expense">รายจ่าย (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ชื่อรายการ</label>
                <input
                  name="title"
                  placeholder="เช่น บริจาค, ค่าไฟ"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">จำนวนเงิน</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-300 text-xl font-bold"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-colors"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
