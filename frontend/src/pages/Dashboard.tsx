import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Layers, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: {
    last7Days: number;
    last30Days: number;
  };
  totalProblems: number;
  publicProblems: number;
  totalPods: number;
  totalStages: number;
  completionRate: number;
  averageCompletionTime: number;
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: { last7Days: 0, last30Days: 0 },
    totalProblems: 0,
    publicProblems: 0,
    totalPods: 0,
    totalStages: 0,
    completionRate: 0,
    averageCompletionTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [usersData, problemsData, podsData, stagesData, progressData] = await Promise.all([
        adminApi.Analytics.users().catch(() => ({ totalUsers: 0, activeUsers: { last7Days: 0, last30Days: 0 } })),
        adminApi.Analytics.problems().catch(() => ({ totalProblems: 0, publicProblems: 0 })),
        adminApi.Analytics.pods().catch(() => ({ totalPods: 0 })),
        adminApi.Analytics.stages().catch(() => ({ totalStages: 0 })),
        adminApi.Analytics.progress().catch(() => ({ completionRate: 0, averageCompletionTime: 0 })),
      ]);

      setMetrics({
        totalUsers: usersData.totalUsers || 0,
        activeUsers: usersData.activeUsers || { last7Days: 0, last30Days: 0 },
        totalProblems: problemsData.totalProblems || 0,
        publicProblems: problemsData.publicProblems || 0,
        totalPods: podsData.totalPods || 0,
        totalStages: stagesData.totalStages || 0,
        completionRate: progressData.completionRate || 0,
        averageCompletionTime: progressData.averageCompletionTime || 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockUserGrowth = [
    { month: 'Jan', newUsers: 65, totalUsers: 65 },
    { month: 'Feb', newUsers: 78, totalUsers: 143 },
    { month: 'Mar', newUsers: 90, totalUsers: 233 },
    { month: 'Apr', newUsers: 81, totalUsers: 314 },
    { month: 'May', newUsers: 95, totalUsers: 409 },
    { month: 'Jun', newUsers: 110, totalUsers: 519 },
  ];

  const mockDifficultyDistribution = [
    { name: 'Beginner', value: 35, color: '#10b981' },
    { name: 'Intermediate', value: 45, color: '#3b82f6' },
    { name: 'Advanced', value: 20, color: '#8b5cf6' },
  ];

  const mockPhaseDistribution = [
    { phase: 'Research', count: 45 },
    { phase: 'Design', count: 38 },
    { phase: 'Implementation', count: 52 },
    { phase: 'Reflection', count: 35 },
  ];

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Users (30d)',
      value: metrics.activeUsers.last30Days,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Problems',
      value: metrics.totalProblems,
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      change: '+3',
      changeType: 'positive' as const,
    },
    {
      title: 'Pods',
      value: metrics.totalPods,
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      change: '+5',
      changeType: 'positive' as const,
    },
    {
      title: 'Completion Rate',
      value: `${metrics.completionRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
      change: '+2.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Avg Completion Time',
      value: `${metrics.averageCompletionTime.toFixed(1)}h`,
      icon: Clock,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      change: '-0.5h',
      changeType: 'positive' as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                    {card.change}
                  </span>{' '}
                  from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalUsers" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockDifficultyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockDifficultyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pod Phase Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockPhaseDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
