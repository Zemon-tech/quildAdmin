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
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Clock, Layers } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Problem, DifficultyLevel, PaginatedProblemsResponse } from '@/types/admin';
import { format } from 'date-fns';
import ProblemManageDialog from '@/components/ProblemManageDialog';

export function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    description_md: '',
    tagline: '',
    context_md: '',
    difficulty: 'beginner' as DifficultyLevel,
    estimatedHours: 1,
    isPublic: false,
  });

  // Manage dialog state
  const [manageOpen, setManageOpen] = useState(false);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [problems, searchQuery, difficultyFilter, visibilityFilter]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const response: PaginatedProblemsResponse = await adminApi.Problems.list();
      setProblems(response.problems || []);
    } catch (error) {
      console.error('Error loading problems:', error);
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const openManage = (problem: Problem) => {
    setActiveProblem(problem);
    setManageOpen(true);
  };

  const filterProblems = () => {
    let filtered = problems;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (problem) =>
          problem.title.toLowerCase().includes(query) ||
          problem.slug.toLowerCase().includes(query) ||
          problem.tagline?.toLowerCase().includes(query)
      );
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((problem) => problem.difficulty === difficultyFilter);
    }

    if (visibilityFilter === 'public') {
      filtered = filtered.filter((problem) => problem.isPublic);
    } else if (visibilityFilter === 'private') {
      filtered = filtered.filter((problem) => !problem.isPublic);
    }

    setFilteredProblems(filtered);
  };

  const handleCreate = () => {
    setFormData({
      slug: '',
      title: '',
      description_md: '',
      tagline: '',
      context_md: '',
      difficulty: 'beginner',
      estimatedHours: 1,
      isPublic: false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      await adminApi.Problems.create(formData);
      await loadProblems();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving problem:', error);
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
          <p className="text-muted-foreground">Manage learning problems and challenges</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Problem
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems by title or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
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
                    <TableHead>Problem</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Pods</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProblems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No problems found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProblems.map((problem) => (
                      <TableRow 
                        key={problem._id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openManage(problem)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{problem.title}</div>
                            {problem.tagline && (
                              <div className="text-sm text-muted-foreground">{problem.tagline.length > 60 ? problem.tagline.slice(0, 60) + '…' : problem.tagline}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{problem.slug.length > 24 ? problem.slug.slice(0, 24) + '…' : problem.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span>{problem.pods.length}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{problem.estimatedHours}h</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={problem.isPublic ? 'default' : 'secondary'}>
                            {problem.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(problem.updatedAt), 'MMM d, yyyy')}
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

      <ProblemManageDialog open={manageOpen} onOpenChange={setManageOpen} problem={activeProblem} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Problem</DialogTitle>
            <DialogDescription>
              Create a new learning problem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="problem-slug"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: DifficultyLevel) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Problem title"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Short tagline"
              />
            </div>
            <div>
              <Label htmlFor="estimatedHours">Estimated Hours *</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Markdown)</Label>
              <Textarea
                id="description"
                value={formData.description_md}
                onChange={(e) => setFormData({ ...formData, description_md: e.target.value })}
                placeholder="Problem description in markdown..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="context">Context (Markdown)</Label>
              <Textarea
                id="context"
                value={formData.context_md}
                onChange={(e) => setFormData({ ...formData, context_md: e.target.value })}
                placeholder="Problem context in markdown..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
              />
              <Label htmlFor="isPublic">Make this problem public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Problem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
