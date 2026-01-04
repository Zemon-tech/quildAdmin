import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function Analytics() {
  const [timeRange, setTimeRange] = useState('30');

  const mockUserGrowth = [
    { date: 'Jan 1', users: 120, newUsers: 15 },
    { date: 'Jan 8', users: 135, newUsers: 18 },
    { date: 'Jan 15', users: 158, newUsers: 23 },
    { date: 'Jan 22', users: 180, newUsers: 22 },
    { date: 'Jan 29', users: 205, newUsers: 25 },
    { date: 'Feb 5', users: 235, newUsers: 30 },
    { date: 'Feb 12', users: 268, newUsers: 33 },
    { date: 'Feb 19', users: 295, newUsers: 27 },
    { date: 'Feb 26', users: 328, newUsers: 33 },
    { date: 'Mar 5', users: 360, newUsers: 32 },
  ];

  const mockCompletionRates = [
    { problem: 'React Basics', completionRate: 85, totalAttempts: 120, completed: 102 },
    { problem: 'Node.js API', completionRate: 72, totalAttempts: 95, completed: 68 },
    { problem: 'TypeScript Fundamentals', completionRate: 68, totalAttempts: 88, completed: 60 },
    { problem: 'Database Design', completionRate: 55, totalAttempts: 75, completed: 41 },
    { problem: 'Authentication', completionRate: 78, totalAttempts: 110, completed: 86 },
  ];

  const mockDifficultyDistribution = [
    { name: 'Beginner', value: 45, color: '#10b981' },
    { name: 'Intermediate', value: 35, color: '#3b82f6' },
    { name: 'Advanced', value: 20, color: '#8b5cf6' },
  ];

  const mockPhaseDistribution = [
    { phase: 'Research', completion: 82, avgTime: 45 },
    { phase: 'Design', completion: 75, avgTime: 55 },
    { phase: 'Implementation', completion: 68, avgTime: 90 },
    { phase: 'Reflection', completion: 88, avgTime: 30 },
  ];

  const mockStageTypeDistribution = [
    { type: 'Introduction', count: 45, completion: 95 },
    { type: 'Case Studies', count: 32, completion: 78 },
    { type: 'Resources', count: 58, completion: 88 },
    { type: 'Practice', count: 67, completion: 65 },
    { type: 'Assessment', count: 41, completion: 72 },
    { type: 'Documentation', count: 28, completion: 90 },
  ];

  const mockTimeSpent = [
    { date: 'Week 1', avgTime: 2.5 },
    { date: 'Week 2', avgTime: 2.8 },
    { date: 'Week 3', avgTime: 3.1 },
    { date: 'Week 4', avgTime: 2.9 },
    { date: 'Week 5', avgTime: 3.3 },
    { date: 'Week 6', avgTime: 3.5 },
    { date: 'Week 7', avgTime: 3.2 },
    { date: 'Week 8', avgTime: 3.8 },
  ];

  const mockSkillDistribution = [
    { skill: 'React', users: 180 },
    { skill: 'TypeScript', users: 150 },
    { skill: 'Node.js', users: 120 },
    { skill: 'Python', users: 95 },
    { skill: 'Database', users: 85 },
    { skill: 'DevOps', users: 60 },
  ];

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Problems</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">71.6%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.3%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time per Problem</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.3h</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="newUsers" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problem Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockCompletionRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="problem" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completionRate" fill="#3b82f6" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Pod Phase Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockPhaseDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="phase" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" fill="#10b981" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockStageTypeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Time Spent per Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTimeSpent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2} name="Avg Time (hours)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockSkillDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skill" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#ec4899" name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Strong User Growth</p>
                <p className="text-sm text-muted-foreground">
                  User base has grown by 12.5% this month, with consistent weekly additions showing healthy platform adoption.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">High Completion Rates</p>
                <p className="text-sm text-muted-foreground">
                  Average completion rate of 71.6% indicates users are finding value in the learning content and completing problems.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium">Optimal Time Investment</p>
                <p className="text-sm text-muted-foreground">
                  Average time per problem decreased by 0.3h, suggesting improved content efficiency and user learning speed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
