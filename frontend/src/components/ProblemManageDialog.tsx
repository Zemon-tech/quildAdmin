import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus, Clock, ListTodo, LineChart, Layers, Settings, ChevronLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Problem, Pod, PodPhase, PodStage, StageType, MCQQuestion, PracticeProblem, PaginatedPodsResponse, PaginatedStagesResponse, DifficultyLevel } from '@/types/admin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: Problem | null;
}

export default function ProblemManageDialog({ open, onOpenChange, problem }: Props) {
  const [pods, setPods] = useState<Pod[]>([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [selectedPodId, setSelectedPodId] = useState('');
  const [stages, setStages] = useState<PodStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [section, setSection] = useState<'pods' | 'stages' | 'analytics' | 'edit' | 'add'>('pods');

  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [editingPod, setEditingPod] = useState<Pod | null>(null);
  const [podForm, setPodForm] = useState({
    problem: '',
    title: '',
    phase: 'research' as PodPhase,
    order: 0,
    description_md: '',
    estimatedMinutes: 60,
    mode: 'multi_stage' as 'single_stage' | 'multi_stage',
  });

  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PodStage | null>(null);
  const [stageForm, setStageForm] = useState({
    pod: '',
    title: '',
    description: '',
    order: 0,
    type: 'introduction' as StageType,
    estimatedMinutes: 30,
    isRequired: true,
    content: {
      introduction: '',
      learningObjectives: [] as string[],
      content_md: '',
      mcqs: [] as MCQQuestion[],
      practiceProblems: [] as PracticeProblem[],
    } as any,
  });

  // Problem forms for Edit/Add
  const emptyProblem = {
    slug: '',
    title: '',
    description_md: '',
    tagline: '',
    context_md: '',
    difficulty: 'beginner' as DifficultyLevel,
    estimatedHours: 1,
    isPublic: false,
  };
  const [problemForm, setProblemForm] = useState({ ...emptyProblem });
  useEffect(() => {
    if (problem && open) {
      setProblemForm({
        slug: problem.slug,
        title: problem.title,
        description_md: problem.description_md || '',
        tagline: problem.tagline || '',
        context_md: problem.context_md || '',
        difficulty: problem.difficulty as DifficultyLevel,
        estimatedHours: problem.estimatedHours,
        isPublic: problem.isPublic,
      });
    } else if (open) {
      setProblemForm({ ...emptyProblem });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, problem?._id]);

  useEffect(() => {
    const init = async () => {
      if (!problem?._id) {
        setPods([]);
        setStages([]);
        setSelectedPodId('');
        return;
      }
      const firstId = await loadPodsForProblem(problem._id);
      await loadStagesForPod(firstId);
    };
    if (open) init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, problem?._id]);

  const loadPodsForProblem = async (problemId: string): Promise<string> => {
    try {
      setPodsLoading(true);
      const response: PaginatedPodsResponse = await adminApi.Pods.list();
      const allPods: Pod[] = (response as any).pods || (response as any) || [];
      const filtered = allPods.filter((p: any) => (((p.problem as any)?._id) || p.problem) === problemId);
      setPods(filtered);
      if (filtered.length > 0) {
        const firstId = (filtered[0] as any)._id || '';
        setSelectedPodId(firstId);
        return firstId;
      } else {
        setSelectedPodId('');
      }
    } catch (e) {
      setPods([]);
      setSelectedPodId('');
      return '';
    } finally {
      setPodsLoading(false);
    }
    return '';
  };

  const loadStagesForPod = async (podId?: string) => {
    try {
      if (!podId) {
        setStages([]);
        return;
      }
      setStagesLoading(true);
      const response: PaginatedStagesResponse = await adminApi.Stages.list(podId);
      setStages(((response as any).stages) || (response as any) || []);
    } catch (e) {
      setStages([]);
    } finally {
      setStagesLoading(false);
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

  const getStageTypeColor = (type: StageType) => {
    const colors: Record<StageType, string> = {
      introduction: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      case_studies: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      resources: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      practice: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assessment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      documentation: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    } as any;
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const onChangeSelectedPod = async (podId: string) => {
    setSelectedPodId(podId);
    await loadStagesForPod(podId);
  };

  const handleCreatePod = () => {
    if (!problem?._id) return;
    setEditingPod(null);
    setPodForm({ problem: problem._id, title: '', phase: 'research', order: 0, description_md: '', estimatedMinutes: 60, mode: 'multi_stage' });
    setPodDialogOpen(true);
  };
  const handleEditPod = (pod: Pod) => {
    setEditingPod(pod);
    setPodForm({
      problem: ((pod.problem as any)?._id) || (pod.problem as any),
      title: pod.title,
      phase: pod.phase,
      order: pod.order,
      description_md: pod.description_md || '',
      estimatedMinutes: pod.estimatedMinutes || 60,
      mode: pod.mode || 'multi_stage',
    });
    setPodDialogOpen(true);
  };
  const handleDeletePod = async (pod: Pod) => {
    if (!confirm(`Are you sure you want to delete "${pod.title}"?`)) return;
    await adminApi.Pods.delete(pod._id!);
    if (problem?._id) await loadPodsForProblem(problem._id);
  };
  const handleSubmitPod = async () => {
    if (editingPod) await adminApi.Pods.update(editingPod._id!, podForm);
    else await adminApi.Pods.create(podForm);
    if (problem?._id) await loadPodsForProblem(problem._id);
    setPodDialogOpen(false);
  };

  const handleCreateStage = () => {
    if (!selectedPodId) return;
    setEditingStage(null);
    setStageForm({ pod: selectedPodId, title: '', description: '', order: 0, type: 'introduction', estimatedMinutes: 30, isRequired: true, content: { introduction: '', learningObjectives: [], content_md: '', mcqs: [], practiceProblems: [] } });
    setStageDialogOpen(true);
  };
  const handleEditStage = (stage: PodStage) => {
    setEditingStage(stage);
    setStageForm({
      pod: ((stage.pod as any)?._id) || (stage.pod as any),
      title: stage.title,
      description: stage.description,
      order: stage.order,
      type: stage.type,
      estimatedMinutes: stage.estimatedMinutes,
      isRequired: stage.isRequired,
      content: stage.content as any,
    });
    setStageDialogOpen(true);
  };
  const handleDeleteStage = async (stage: PodStage) => {
    if (!confirm(`Are you sure you want to delete "${stage.title}"?`)) return;
    await adminApi.Stages.delete(stage._id!);
    await loadStagesForPod(selectedPodId);
  };
  const handleSubmitStage = async () => {
    if (editingStage) await adminApi.Stages.update(editingStage._id!, stageForm);
    else await adminApi.Stages.create(stageForm);
    await loadStagesForPod(selectedPodId);
    setStageDialogOpen(false);
  };

  // Problem operations
  const handleUpdateProblem = async () => {
    if (!problem?._id) return;
    await adminApi.Problems.update(problem._id, problemForm);
    onOpenChange(false);
  };
  const handleCreateProblem = async () => {
    await adminApi.Problems.create(problemForm);
    onOpenChange(false);
  };
  const handleDeleteProblem = async () => {
    if (!problem?._id) return;
    if (!confirm(`Delete problem "${problem.title}"? This cannot be undone.`)) return;
    await adminApi.Problems.delete(problem._id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 h-[calc(100vh-3rem)] w-full max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-3rem)] rounded-xl shadow-xl overflow-hidden">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <aside className="w-64 border-r bg-muted/30 h-full p-4 space-y-2 overflow-y-auto">
            <button className="w-full text-left px-3 py-2 rounded hover:bg-muted mb-2" onClick={() => onOpenChange(false)}>
              <div className="flex items-center gap-2"><ChevronLeft className="h-4 w-4"/> <span>Back</span></div>
            </button>
            <div className="text-xs text-muted-foreground px-2">PROBLEM</div>
            <button className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${section==='pods'?'bg-muted':''}`} onClick={() => setSection('pods')}>
              <div className="flex items-center gap-2"><Layers className="h-4 w-4"/> <span>Pods</span></div>
            </button>
            <button className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${section==='stages'?'bg-muted':''}`} onClick={() => setSection('stages')}>
              <div className="flex items-center gap-2"><ListTodo className="h-4 w-4"/> <span>Stages</span></div>
            </button>
            <button className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${section==='analytics'?'bg-muted':''}`} onClick={() => setSection('analytics')}>
              <div className="flex items-center gap-2"><LineChart className="h-4 w-4"/> <span>Analytics</span></div>
            </button>
          </aside>

          {/* Main content */}
          <main className="flex-1 h-full min-h-0 overflow-y-auto">
            <div className="border-b p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Account & settings like layout</div>
                <h2 className="text-xl font-semibold">Manage: {problem?.title || 'Problem'}</h2>
              </div>
              <div className="flex gap-2">
                {problem?._id && (
                  <>
                    <Button variant="outline" onClick={() => setSection('edit')}><Settings className="h-4 w-4 mr-2"/>Edit</Button>
                    <Button variant="destructive" onClick={handleDeleteProblem}><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
                  </>
                )}
              </div>
            </div>

            {/* Pods Section */}
            {section === 'pods' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {podsLoading ? 'Loading pods...' : `${pods.length} pod(s)`}
                  </div>
                  <Button size="sm" onClick={handleCreatePod} disabled={!problem?._id}>
                    <Plus className="mr-2 h-4 w-4" /> New Pod
                  </Button>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No pods for this problem
                          </TableCell>
                        </TableRow>
                      ) : (
                        pods.map((pod) => (
                          <TableRow
                            key={pod._id}
                            className={selectedPodId === (pod._id as any) ? 'bg-muted/40' : ''}
                            onClick={() => onChangeSelectedPod((pod._id as any) || '')}
                          >
                            <TableCell className="font-medium">{pod.title}</TableCell>
                            <TableCell>
                              <Badge className={getPhaseColor(pod.phase)}>{pod.phase}</Badge>
                            </TableCell>
                            <TableCell>{pod.order}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{pod.mode}</Badge>
                            </TableCell>
                            <TableCell>{pod.estimatedMinutes || 60}m</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditPod(pod); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeletePod(pod); }}>
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
              </div>
            )}

            {/* Stages Section */}
            {section === 'stages' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedPodId ? `Stages for selected pod` : 'Select a pod to view stages'}
                  </div>
                  <Button size="sm" onClick={handleCreateStage} disabled={!selectedPodId}>
                    <Plus className="mr-2 h-4 w-4" /> New Stage
                  </Button>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stagesLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading stages...</TableCell>
                        </TableRow>
                      ) : stages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {selectedPodId ? 'No stages' : 'Select a pod to view stages'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        stages.map((stage) => (
                          <TableRow key={stage._id}>
                            <TableCell className="font-medium">{stage.title}</TableCell>
                            <TableCell>
                              <Badge className={getStageTypeColor(stage.type)}>{stage.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ListTodo className="h-4 w-4 text-muted-foreground" />
                                <span>{stage.order}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{stage.estimatedMinutes}m</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={stage.isRequired ? 'default' : 'secondary'}>
                                {stage.isRequired ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditStage(stage)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteStage(stage)}>
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
              </div>
            )}

            {/* Analytics Section */}
            {section === 'analytics' && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pods</CardTitle>
                    </CardHeader>
                    <CardContent>{pods.length}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Stages</CardTitle>
                    </CardHeader>
                    <CardContent>{stages.length}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Visibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={problem?.isPublic ? 'default' : 'secondary'}>
                        {problem?.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Edit Problem Section */}
            {section === 'edit' && (
              <div className="p-6 space-y-4 max-w-5xl">
                <div className="text-sm text-muted-foreground">Update the problem details.</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input id="slug" value={problemForm.slug} onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })} placeholder="problem-slug" disabled={!!problem?._id} />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select value={problemForm.difficulty} onValueChange={(v: DifficultyLevel) => setProblemForm({ ...problemForm, difficulty: v })}>
                      <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
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
                  <Input id="title" value={problemForm.title} onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })} placeholder="Problem title" />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" value={problemForm.tagline} onChange={(e) => setProblemForm({ ...problemForm, tagline: e.target.value })} placeholder="Short tagline" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours *</Label>
                    <Input id="estimatedHours" type="number" min="1" value={problemForm.estimatedHours} onChange={(e) => setProblemForm({ ...problemForm, estimatedHours: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch id="isPublic" checked={problemForm.isPublic} onCheckedChange={(c) => setProblemForm({ ...problemForm, isPublic: c })} />
                    <Label htmlFor="isPublic">Make this problem public</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description (Markdown)</Label>
                  <Textarea id="description" value={problemForm.description_md} onChange={(e) => setProblemForm({ ...problemForm, description_md: e.target.value })} rows={4} />
                </div>
                <div>
                  <Label htmlFor="context">Context (Markdown)</Label>
                  <Textarea id="context" value={problemForm.context_md} onChange={(e) => setProblemForm({ ...problemForm, context_md: e.target.value })} rows={4} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button onClick={handleUpdateProblem} disabled={!problem?._id}>Update Problem</Button>
                </div>
              </div>
            )}

            {/* Add Problem Section */}
            {section === 'add' && (
              <div className="p-6 space-y-4 max-w-5xl">
                <div className="text-sm text-muted-foreground">Create a new learning problem.</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add_slug">Slug *</Label>
                    <Input id="add_slug" value={problemForm.slug} onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })} placeholder="problem-slug" />
                  </div>
                  <div>
                    <Label htmlFor="add_difficulty">Difficulty *</Label>
                    <Select value={problemForm.difficulty} onValueChange={(v: DifficultyLevel) => setProblemForm({ ...problemForm, difficulty: v })}>
                      <SelectTrigger id="add_difficulty"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="add_title">Title *</Label>
                  <Input id="add_title" value={problemForm.title} onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })} placeholder="Problem title" />
                </div>
                <div>
                  <Label htmlFor="add_tagline">Tagline</Label>
                  <Input id="add_tagline" value={problemForm.tagline} onChange={(e) => setProblemForm({ ...problemForm, tagline: e.target.value })} placeholder="Short tagline" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add_estimatedHours">Estimated Hours *</Label>
                    <Input id="add_estimatedHours" type="number" min="1" value={problemForm.estimatedHours} onChange={(e) => setProblemForm({ ...problemForm, estimatedHours: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch id="add_isPublic" checked={problemForm.isPublic} onCheckedChange={(c) => setProblemForm({ ...problemForm, isPublic: c })} />
                    <Label htmlFor="add_isPublic">Make this problem public</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="add_description">Description (Markdown)</Label>
                  <Textarea id="add_description" value={problemForm.description_md} onChange={(e) => setProblemForm({ ...problemForm, description_md: e.target.value })} rows={4} />
                </div>
                <div>
                  <Label htmlFor="add_context">Context (Markdown)</Label>
                  <Textarea id="add_context" value={problemForm.context_md} onChange={(e) => setProblemForm({ ...problemForm, context_md: e.target.value })} rows={4} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button onClick={handleCreateProblem}>Create Problem</Button>
                </div>
              </div>
            )}

          </main>
        </div>
      </DialogContent>

        {/* Pod Form Dialog */}
        <Dialog open={podDialogOpen} onOpenChange={setPodDialogOpen}>
          <DialogContent className="max-w-2xl h-[90vh] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPod ? 'Edit Pod' : 'Create New Pod'}</DialogTitle>
              <DialogDescription>
                {editingPod ? 'Update the pod details.' : 'Create a new learning pod.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pod_title">Title *</Label>
                  <Input id="pod_title" value={podForm.title} onChange={(e) => setPodForm({ ...podForm, title: e.target.value })} placeholder="Pod title" />
                </div>
                <div>
                  <Label htmlFor="pod_phase">Phase *</Label>
                  <Select value={podForm.phase} onValueChange={(v: PodPhase) => setPodForm({ ...podForm, phase: v })}>
                    <SelectTrigger id="pod_phase"><SelectValue /></SelectTrigger>
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
                  <Label htmlFor="pod_order">Order *</Label>
                  <Input id="pod_order" type="number" min="0" value={podForm.order} onChange={(e) => setPodForm({ ...podForm, order: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label htmlFor="pod_minutes">Estimated Minutes *</Label>
                  <Input id="pod_minutes" type="number" min="1" value={podForm.estimatedMinutes} onChange={(e) => setPodForm({ ...podForm, estimatedMinutes: parseInt(e.target.value) || 60 })} />
                </div>
              </div>
              <div>
                <Label htmlFor="pod_mode">Mode</Label>
                <Select value={podForm.mode} onValueChange={(v: 'single_stage' | 'multi_stage') => setPodForm({ ...podForm, mode: v })}>
                  <SelectTrigger id="pod_mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_stage">Single Stage</SelectItem>
                    <SelectItem value="multi_stage">Multi Stage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pod_desc">Description (Markdown)</Label>
                <Textarea id="pod_desc" value={podForm.description_md} onChange={(e) => setPodForm({ ...podForm, description_md: e.target.value })} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPodDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitPod}>{editingPod ? 'Update' : 'Create'} Pod</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stage Form Dialog */}
        <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStage ? 'Edit Stage' : 'Create New Stage'}</DialogTitle>
              <DialogDescription>
                {editingStage ? 'Update the stage details.' : 'Create a new learning stage.'}
              </DialogDescription>
            </DialogHeader>
            <div className="w-full">
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="col-span-4 sm:col-span-1 font-medium">Basic</div>
              </div>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="stage_title">Title *</Label>
                  <Input id="stage_title" value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} placeholder="Stage title" />
                </div>
                <div>
                  <Label htmlFor="stage_description">Description *</Label>
                  <Textarea id="stage_description" value={stageForm.description} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="stage_type">Type *</Label>
                    <Select value={stageForm.type} onValueChange={(v: StageType) => setStageForm({ ...stageForm, type: v })}>
                      <SelectTrigger id="stage_type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="introduction">Introduction</SelectItem>
                        <SelectItem value="case_studies">Case Studies</SelectItem>
                        <SelectItem value="resources">Resources</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stage_order">Order *</Label>
                    <Input id="stage_order" type="number" min="0" value={stageForm.order} onChange={(e) => setStageForm({ ...stageForm, order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label htmlFor="stage_minutes">Duration (min) *</Label>
                    <Input id="stage_minutes" type="number" min="1" value={stageForm.estimatedMinutes} onChange={(e) => setStageForm({ ...stageForm, estimatedMinutes: parseInt(e.target.value) || 30 })} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="stage_required" checked={stageForm.isRequired} onCheckedChange={(c) => setStageForm({ ...stageForm, isRequired: c })} />
                  <Label htmlFor="stage_required">Required stage</Label>
                </div>
              </div>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="stage_intro">Introduction</Label>
                  <Textarea id="stage_intro" value={stageForm.content.introduction} onChange={(e) => setStageForm({ ...stageForm, content: { ...stageForm.content, introduction: e.target.value } })} rows={3} />
                </div>
                <div>
                  <Label htmlFor="stage_content_md">Content (Markdown)</Label>
                  <Textarea id="stage_content_md" value={stageForm.content.content_md} onChange={(e) => setStageForm({ ...stageForm, content: { ...stageForm.content, content_md: e.target.value } })} rows={8} />
                </div>
              </div>
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">Add MCQs in future enhancement</div>
              </div>
              <div className="space-y-4 py-4">
                <div className="text-sm text-muted-foreground">Add practice problems in future enhancement</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStageDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitStage}>{editingStage ? 'Update' : 'Create'} Stage</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </Dialog>
  );
}
