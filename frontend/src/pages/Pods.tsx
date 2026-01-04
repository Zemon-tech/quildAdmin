import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash2, Layers, Clock } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Pod, PodPhase, PaginatedPodsResponse } from '@/types/admin';
import { format } from 'date-fns';

export function Pods() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [filteredPods, setFilteredPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPod, setEditingPod] = useState<Pod | null>(null);
  const [formData, setFormData] = useState({
    problem: '',
    title: '',
    phase: 'research' as PodPhase,
    order: 0,
    description_md: '',
    estimatedMinutes: 60,
    mode: 'multi_stage' as 'single_stage' | 'multi_stage',
  });

  useEffect(() => {
    loadPods();
  }, []);

  useEffect(() => {
    filterPods();
  }, [pods, searchQuery, phaseFilter]);

  const loadPods = async () => {
    try {
      setLoading(true);
      const response: PaginatedPodsResponse = await adminApi.Pods.list();
      setPods(response.pods || []);
    } catch (error) {
      console.error('Error loading pods:', error);
      setPods([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPods = () => {
    let filtered = pods;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pod) =>
          pod.title.toLowerCase().includes(query) ||
          (pod.problem as any)?.title?.toLowerCase().includes(query)
      );
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter((pod) => pod.phase === phaseFilter);
    }

    setFilteredPods(filtered);
  };

  const handleCreate = () => {
    setEditingPod(null);
    setFormData({
      problem: '',
      title: '',
      phase: 'research',
      order: 0,
      description_md: '',
      estimatedMinutes: 60,
      mode: 'multi_stage',
    });
    setDialogOpen(true);
  };

  const handleEdit = (pod: Pod) => {
    setEditingPod(pod);
    setFormData({
      problem: pod.problem,
      title: pod.title,
      phase: pod.phase,
      order: pod.order,
      description_md: pod.description_md || '',
      estimatedMinutes: pod.estimatedMinutes || 60,
      mode: pod.mode || 'multi_stage',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (pod: Pod) => {
    if (!confirm(`Are you sure you want to delete "${pod.title}"?`)) return;

    try {
      await adminApi.Pods.delete(pod._id!);
      await loadPods();
    } catch (error) {
      console.error('Error deleting pod:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPod) {
        await adminApi.Pods.update(editingPod._id!, formData);
      } else {
        await adminApi.Pods.create(formData);
      }
      await loadPods();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving pod:', error);
    }
  };

  const getPhaseColor = (phase: PodPhase) => {
    switch (phase) {
      case 'research':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'design':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'implementation':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reflection':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pods</h1>
          <p className="text-muted-foreground">Manage learning phases within problems</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Pod
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pod Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pods by title or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="implementation">Implementation</SelectItem>
                <SelectItem value="reflection">Reflection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pod</TableHead>
                    <TableHead>Problem</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No pods found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPods.map((pod) => (
                      <TableRow key={pod._id}>
                        <TableCell>
                          <div className="font-medium">{pod.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {(pod.problem as any)?.title || 'Unknown Problem'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPhaseColor(pod.phase)}>
                            {pod.phase}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span>{pod.order}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pod.mode}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{pod.estimatedMinutes || 60}m</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(pod.updatedAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(pod)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(pod)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPod ? 'Edit Pod' : 'Create New Pod'}</DialogTitle>
            <DialogDescription>
              {editingPod ? 'Update the pod details.' : 'Create a new learning pod.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="problem">Problem ID *</Label>
              <Input
                id="problem"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="Problem ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Pod title"
                />
              </div>
              <div>
                <Label htmlFor="phase">Phase *</Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value: PodPhase) => setFormData({ ...formData, phase: value })}
                >
                  <SelectTrigger id="phase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="implementation">Implementation</SelectItem>
                    <SelectItem value="reflection">Reflection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Order *</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="estimatedMinutes">Estimated Minutes *</Label>
                <Input
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  value={formData.estimatedMinutes}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={formData.mode}
                onValueChange={(value: 'single_stage' | 'multi_stage') => setFormData({ ...formData, mode: value })}
              >
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_stage">Single Stage</SelectItem>
                  <SelectItem value="multi_stage">Multi Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Markdown)</Label>
              <Textarea
                id="description"
                value={formData.description_md}
                onChange={(e) => setFormData({ ...formData, description_md: e.target.value })}
                placeholder="Pod description in markdown..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPod ? 'Update' : 'Create'} Pod
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
