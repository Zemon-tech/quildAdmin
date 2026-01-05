import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Plus, Clock, ListTodo, LineChart, Layers, Settings, ChevronLeft, Eye, Play, CheckCircle, BookOpen, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ChartAreaInteractive, ChartBarLabel, ChartLineInteractive, ChartRadarLinesOnly, ChartRadialSimple } from '@/components/charts';
import { adminApi } from '@/lib/api';
import type { Problem, Pod, PodPhase, PodStage, StageType, MCQQuestion, PracticeProblem, PaginatedPodsResponse, DifficultyLevel } from '@/types/admin';

// simple HTML <-> Markdown helpers
const markdownToHtml = (md: string): string => {
  if (!md) return ''
  let html = md
  html = html.replace(/^######\s?(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s?(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s?(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
  html = html.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img alt="$1" src="$2" />')
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => (m.includes('<ul>') ? m : `<ol>${m}</ol>`))
  html = html.replace(/^(?!<h\d|<ul>|<ol>|<li>|<blockquote>|<img|<p>|<pre>|<code>)(.+)$/gm, '<p>$1</p>')
  return html
}

const htmlToMarkdown = (html: string): string => {
  if (!html) return ''
  let md = html
  md = md.replace(/\n/g, '')
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
  md = md.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n')
  md = md.replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n')
  md = md.replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n')
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`')
  md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n')
  md = md.replace(/<ul>(.*?)<\/ul>/gi, (_m: string, p1: string) => p1.replace(/<li>(.*?)<\/li>/gi, '- $1\n'))
  md = md.replace(/<ol>(.*?)<\/ol>/gi, (_m: string, p1: string) => p1.replace(/<li>(.*?)<\/li>/gi, (_mm: string, li: string, index: number) => `${index + 1}. ${li}\n`))
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  md = md.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']?([^"']*)["']?[^>]*\/>/gi, '![$2]($1)')
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  return md.trim()
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <SimpleEditor
        initialContent={markdownToHtml(value)}
        onUpdate={(html) => {
          // Convert HTML back to markdown using the helper function
          const md = htmlToMarkdown(html);
          onChange(md);
        }}
      />
    </div>
  );
}

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
  const [section, setSection] = useState<'pods' | 'stages' | 'analytics' | 'edit' | 'add' | 'editPod' | 'editStage' | 'viewContent'>('pods');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Content viewing states
  const [viewingStage, setViewingStage] = useState<PodStage | null>(null);
  const [stageContent, setStageContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);

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

  // Escape key handler to exit focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    if (isFocusMode) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode]);

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
      // Use the new enhanced endpoint that includes user progress
      const response = await adminApi.Stages.list(podId);
      setStages(response.stages || []);
    } catch (e) {
      setStages([]);
    } finally {
      setStagesLoading(false);
    }
  };

  // View complete stage content
  const handleViewStageContent = async (stage: PodStage) => {
    try {
      setViewingStage(stage);
      setContentLoading(true);
      setSection('viewContent');

      // Get complete stage details with content
      const stageDetails = await adminApi.Stages.get(stage.pod, stage._id!);
      setStageContent(stageDetails);
    } catch (error) {
      console.error('Error loading stage content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  // Start a stage
  const handleStartStage = async (stage: PodStage) => {
    try {
      await adminApi.Stages.start(stage.pod, stage._id!);
      // Refresh stages to update progress
      await loadStagesForPod(selectedPodId);
    } catch (error) {
      console.error('Error starting stage:', error);
    }
  };

  // Complete a stage
  const handleCompleteStage = async (stage: PodStage) => {
    try {
      await adminApi.Stages.complete(stage.pod, stage._id!, { assessmentScore: 100 });
      // Refresh stages to update progress
      await loadStagesForPod(selectedPodId);
    } catch (error) {
      console.error('Error completing stage:', error);
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
    setSection('editPod');
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
    setSection('editPod');
  };
  const handleDeletePod = async (pod: Pod) => {
    if (!confirm(`Are you sure you want to delete "${pod.title}"?`)) return;
    await adminApi.Pods.delete(pod._id!);
    if (problem?._id) await loadPodsForProblem(problem._id);
  };
  const handleSubmitPod = async () => {
    if (editingPod) {
      await adminApi.Pods.update(editingPod._id!, podForm);
      setSection('pods');
    } else {
      await adminApi.Pods.create(podForm);
      setSection('pods');
    }
    if (problem?._id) await loadPodsForProblem(problem._id);
  };

  const handleCreateStage = () => {
    if (!selectedPodId) return;
    setEditingStage(null);
    setStageForm({ pod: selectedPodId, title: '', description: '', order: 0, type: 'introduction', estimatedMinutes: 30, isRequired: true, content: { introduction: '', learningObjectives: [], content_md: '', mcqs: [], practiceProblems: [] } });
    setSection('editStage');
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
    setSection('editStage');
  };
  const handleDeleteStage = async (stage: PodStage) => {
    if (!confirm(`Are you sure you want to delete "${stage.title}"?`)) return;
    await adminApi.Stages.delete(stage._id!);
    await loadStagesForPod(selectedPodId);
  };
  const handleSubmitStage = async () => {
    if (editingStage) {
      await adminApi.Stages.update(editingStage._id!, stageForm);
      setSection('stages');
    } else {
      await adminApi.Stages.create(stageForm);
      setSection('stages');
    }
    await loadStagesForPod(selectedPodId);
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
    if (!confirm(`Are you sure you want to delete "${problem.title}"? This action cannot be undone.`)) return;
    
    try {
      await adminApi.Problems.delete(problem._id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting problem:', error);
      alert('Failed to delete problem. Please try again.');
    }
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 h-[calc(100vh-3rem)] w-full max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-3rem)] rounded-xl shadow-xl overflow-hidden">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <aside className={`${isFocusMode && section === 'editStage' ? 'hidden' : 'w-64'} border-r bg-muted/30 h-full flex-shrink-0 p-4 space-y-2 overflow-y-auto transition-all duration-300`}>
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
            {problem?._id && (
              <>
                <div className="text-xs text-muted-foreground px-2 mt-4">ACTIONS</div>
                <button className={`w-full text-left px-3 py-2 rounded hover:bg-muted ${section==='edit'?'bg-muted':''}`} onClick={() => setSection('edit')}>
                  <div className="flex items-center gap-2"><Settings className="h-4 w-4"/> <span>Edit Problem</span></div>
                </button>
                <button className="w-full text-left px-3 py-2 rounded hover:bg-muted text-destructive" onClick={handleDeleteProblem}>
                  <div className="flex items-center gap-2"><Trash2 className="h-4 w-4"/> <span>Delete Problem</span></div>
                </button>
              </>
            )}
          </aside>

          {/* Main content */}
          <main className={`${isFocusMode && section === 'editStage' ? 'w-full' : 'flex-1'} h-full min-h-0 flex flex-col overflow-hidden transition-all duration-300`}>
            <div className={`border-b p-4 flex items-center justify-between ${isFocusMode && section === 'editStage' ? 'hidden' : ''}`}>
              <div className="flex items-center gap-4">
                {isFocusMode && section === 'editStage' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFocusMode(false)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Standard View</span>
                  </Button>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">Account & settings like layout</div>
                  <h2 className="text-xl font-semibold">
                    {section === 'edit' ? `Edit: ${problem?.title || 'Problem'}` :
                     section === 'editPod' ? `Edit Pod: ${editingPod?.title || 'Pod'}` :
                     section === 'editStage' ? `Edit Stage: ${editingStage?.title || 'Stage'}` :
                     `Manage: ${problem?.title || 'Problem'}`}
                  </h2>
                </div>
              </div>
              <div className="flex gap-2">
                {(section === 'edit' || section === 'editPod' || section === 'editStage') && (
                  <>
                    <Button variant="outline" onClick={() => section === 'edit' ? setSection('pods') : section === 'editPod' ? setSection('pods') : setSection('stages')}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      if (section === 'edit') handleUpdateProblem();
                      else if (section === 'editPod') handleSubmitPod();
                      else if (section === 'editStage') handleSubmitStage();
                    }}>
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Pods Section */}
            {section === 'pods' && (
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
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
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
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
                        <TableHead>Progress</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stagesLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading stages...</TableCell>
                        </TableRow>
                      ) : stages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                            <TableCell>
                              <Badge variant={(stage as any).userProgress?.status === 'completed' ? 'default' : 
                                             (stage as any).userProgress?.status === 'in_progress' ? 'secondary' : 'outline'}>
                                {(stage as any).userProgress?.status || 'Not Started'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleViewStageContent(stage)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleStartStage(stage)}>
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCompleteStage(stage)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
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
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Summary Cards */}
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

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pod Progress Chart */}
                  <ChartAreaInteractive />
                  
                  {/* Stage Distribution Chart */}
                  <ChartBarLabel />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Learning Progress Chart */}
                  <ChartLineInteractive />
                  
                  {/* Pod Phase Distribution */}
                  <ChartRadialSimple />
                </div>

                {/* Additional Analytics */}
                <ChartRadarLinesOnly />
              </div>
            )}

            {/* View Content Section */}
            {section === 'viewContent' && (
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {contentLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : stageContent && viewingStage ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{viewingStage.title}</h3>
                        <p className="text-sm text-muted-foreground">{viewingStage.description}</p>
                      </div>
                      <Badge className={getStageTypeColor(viewingStage.type)}>
                        {viewingStage.type}
                      </Badge>
                    </div>

                    {/* Stage Metadata */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration</Label>
                        <p className="font-medium">{viewingStage.estimatedMinutes} minutes</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Order</Label>
                        <p className="font-medium">{viewingStage.order}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Required</Label>
                        <Badge variant={viewingStage.isRequired ? 'default' : 'secondary'}>
                          {viewingStage.isRequired ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Your Progress</Label>
                        <Badge variant={stageContent.userProgress?.status === 'completed' ? 'default' : 
                                       stageContent.userProgress?.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {stageContent.userProgress?.status || 'Not Started'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Tabs */}
                    <div className="space-y-4">
                      {/* Introduction */}
                      {stageContent.content?.introduction && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5" />
                              Introduction
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{stageContent.content.introduction}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Learning Objectives */}
                      {stageContent.content?.learningObjectives && stageContent.content.learningObjectives.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Learning Objectives</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc list-inside space-y-2">
                              {stageContent.content.learningObjectives.map((objective: string, index: number) => (
                                <li key={index} className="text-sm">{objective}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Main Content */}
                      {stageContent.content?.content_md && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Content
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-md max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: markdownToHtml(stageContent.content.content_md) }} />
                          </CardContent>
                        </Card>
                      )}

                      {/* External Content */}
                      {stageContent.externalContent && (
                        <Card>
                          <CardHeader>
                            <CardTitle>External Content</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm">{stageContent.externalContent}</pre>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* MCQ Questions */}
                      {stageContent.content?.mcqs && stageContent.content.mcqs.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>MCQ Questions</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {stageContent.content.mcqs.map((mcq: MCQQuestion, index: number) => (
                              <div key={mcq.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">Question {index + 1}</h4>
                                  <Badge variant={mcq.difficulty === 'easy' ? 'secondary' : 
                                                 mcq.difficulty === 'medium' ? 'default' : 'destructive'}>
                                    {mcq.difficulty}
                                  </Badge>
                                </div>
                                <p className="mb-3">{mcq.question}</p>
                                {mcq.scenario && (
                                  <div className="p-3 bg-muted rounded-md mb-3">
                                    <p className="text-sm italic">{mcq.scenario}</p>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {mcq.options.map((option) => (
                                    <div key={option.id} className={`p-2 border rounded-md ${option.isCorrect ? 'bg-green-50 border-green-200' : ''}`}>
                                      <p className="text-sm">{option.text}</p>
                                      {option.isCorrect && <Badge className="mt-1 text-xs">Correct</Badge>}
                                    </div>
                                  ))}
                                </div>
                                {mcq.explanation && (
                                  <div className="p-3 bg-blue-50 rounded-md">
                                    <p className="text-sm"><strong>Explanation:</strong> {mcq.explanation}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Practice Problems */}
                      {stageContent.content?.practiceProblems && stageContent.content.practiceProblems.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Practice Problems</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {stageContent.content.practiceProblems.map((problem: PracticeProblem, index: number) => (
                              <div key={problem.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">Problem {index + 1}</h4>
                                  <Badge variant={problem.difficulty === 'easy' ? 'secondary' : 
                                                 problem.difficulty === 'medium' ? 'default' : 'destructive'}>
                                    {problem.difficulty}
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Title</Label>
                                    <p>{problem.title}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Description</Label>
                                    <p className="text-sm text-muted-foreground">{problem.description}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Problem Statement</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p>{problem.problemStatement}</p>
                                    </div>
                                  </div>
                                  {problem.hints && problem.hints.length > 0 && (
                                    <div>
                                      <Label className="text-xs">Hints</Label>
                                      <ul className="list-disc list-inside space-y-1">
                                        {problem.hints.map((hint, hintIndex) => (
                                          <li key={hintIndex} className="text-sm text-muted-foreground">{hint}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {problem.solution && (
                                    <div>
                                      <Label className="text-xs">Solution</Label>
                                      <div className="mt-1 p-3 bg-green-50 rounded-md">
                                        <p className="text-sm">{problem.solution}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Resources */}
                      {stageContent.content?.resources && stageContent.content.resources.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Resources</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {stageContent.content.resources.map((resource: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                                <div>
                                  <h4 className="font-medium">{resource.title}</h4>
                                  <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                  {resource.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                                  )}
                                </div>
                                {resource.url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                      Open
                                    </a>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* If no content */}
                      {!stageContent.content?.introduction && 
                       !stageContent.content?.learningObjectives?.length &&
                       !stageContent.content?.content_md &&
                       !stageContent.externalContent &&
                       !stageContent.content?.mcqs?.length &&
                       !stageContent.content?.practiceProblems?.length &&
                       !stageContent.content?.resources?.length && (
                        <Card>
                          <CardContent className="pt-6 text-center">
                            <p className="text-muted-foreground">No content available for this stage.</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Select a stage to view its content.</p>
                  </div>
                )}
              </div>
            )}

            {/* Edit Problem Section */}
            {section === 'edit' && (
              <div className="flex-1 p-6 space-y-4 max-w-5xl overflow-y-auto">
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
                  <MarkdownEditor value={problemForm.description_md} onChange={(value) => setProblemForm({ ...problemForm, description_md: value })} />
                </div>
                <div>
                  <Label htmlFor="context">Context (Markdown)</Label>
                  <MarkdownEditor value={problemForm.context_md} onChange={(value) => setProblemForm({ ...problemForm, context_md: value })} />
                </div>
              </div>
            )}

            {/* Edit Pod Section */}
            {section === 'editPod' && (
              <div className="flex-1 p-6 space-y-4 max-w-5xl overflow-y-auto">
                <div className="text-sm text-muted-foreground">{editingPod ? 'Update the pod details.' : 'Create a new learning pod.'}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_pod_title">Title *</Label>
                    <Input id="edit_pod_title" value={podForm.title} onChange={(e) => setPodForm({ ...podForm, title: e.target.value })} placeholder="Pod title" />
                  </div>
                  <div>
                    <Label htmlFor="edit_pod_phase">Phase *</Label>
                    <Select value={podForm.phase} onValueChange={(v: PodPhase) => setPodForm({ ...podForm, phase: v })}>
                      <SelectTrigger id="edit_pod_phase"><SelectValue /></SelectTrigger>
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
                    <Label htmlFor="edit_pod_order">Order *</Label>
                    <Input id="edit_pod_order" type="number" min="0" value={podForm.order} onChange={(e) => setPodForm({ ...podForm, order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label htmlFor="edit_pod_minutes">Estimated Minutes *</Label>
                    <Input id="edit_pod_minutes" type="number" min="1" value={podForm.estimatedMinutes} onChange={(e) => setPodForm({ ...podForm, estimatedMinutes: parseInt(e.target.value) || 60 })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_pod_mode">Mode</Label>
                  <Select value={podForm.mode} onValueChange={(v: 'single_stage' | 'multi_stage') => setPodForm({ ...podForm, mode: v })}>
                    <SelectTrigger id="edit_pod_mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_stage">Single Stage</SelectItem>
                      <SelectItem value="multi_stage">Multi Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_pod_desc">Description (Markdown)</Label>
                  <MarkdownEditor value={podForm.description_md} onChange={(value) => setPodForm({ ...podForm, description_md: value })} />
                </div>
                              </div>
            )}

            {/* Edit Stage Section */}
            {section === 'editStage' && (
              <div className={`flex-1 ${isFocusMode ? 'p-0' : 'p-6'} space-y-4 overflow-y-auto transition-all duration-300 relative`}>
                {isFocusMode && (
                  // Floating exit button for focus mode
                  <div className="fixed bottom-4 right-4 z-50">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFocusMode(false)}
                      className="flex items-center gap-2 bg-background/80 backdrop-blur-sm shadow-lg"
                    >
                      <Minimize2 className="h-4 w-4" />
                      <span>Exit Focus Mode</span>
                    </Button>
                  </div>
                )}
                {isFocusMode ? (
                  // Focus Mode - Show only Simple Editor
                  <div className="h-full flex flex-col">
                    <div className="h-full border-0">
                      <div className="simple-editor-wrapper h-full">
                        <SimpleEditor
                          initialContent={markdownToHtml(stageForm.content.content_md)}
                          onUpdate={(html) => {
                            setStageForm((prev) => ({
                              ...prev,
                              content: {
                                ...prev.content,
                                content_md: htmlToMarkdown(html),
                              },
                            }))
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard Mode - Show all fields
                  <>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4">
                        <Label htmlFor="edit_stage_title" className="text-xs">Title</Label>
                        <Input id="edit_stage_title" value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} placeholder="Stage title" className="h-9" />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="edit_stage_type" className="text-xs">Type</Label>
                        <Select value={stageForm.type} onValueChange={(v: StageType) => setStageForm({ ...stageForm, type: v })}>
                          <SelectTrigger id="edit_stage_type" className="h-9"><SelectValue /></SelectTrigger>
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
                      <div className="col-span-1">
                        <Label htmlFor="edit_stage_order" className="text-xs">Order</Label>
                        <Input id="edit_stage_order" type="number" min="0" value={stageForm.order} onChange={(e) => setStageForm({ ...stageForm, order: parseInt(e.target.value) || 0 })} className="h-9" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="edit_stage_minutes" className="text-xs">Duration</Label>
                        <Input id="edit_stage_minutes" type="number" min="1" value={stageForm.estimatedMinutes} onChange={(e) => setStageForm({ ...stageForm, estimatedMinutes: parseInt(e.target.value) || 30 })} className="h-9" />
                      </div>
                      <div className="col-span-2 flex items-center gap-2 pt-5">
                        <Switch id="edit_stage_required" checked={stageForm.isRequired} onCheckedChange={(c) => setStageForm({ ...stageForm, isRequired: c })} />
                        <Label htmlFor="edit_stage_required" className="text-xs">Required</Label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit_stage_description" className="text-xs">Description</Label>
                      <div className="border rounded-md mt-1">
                        <div className="simple-editor-wrapper compact">
                          <SimpleEditor
                            initialContent={markdownToHtml(stageForm.description)}
                            onUpdate={(html) => setStageForm({ ...stageForm, description: htmlToMarkdown(html) })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit_stage_intro" className="text-xs">Introduction</Label>
                      <div className="border rounded-md mt-1">
                        <div className="simple-editor-wrapper compact">
                          <SimpleEditor
                            initialContent={markdownToHtml(stageForm.content.introduction)}
                            onUpdate={(html) => setStageForm({ ...stageForm, content: { ...stageForm.content, introduction: htmlToMarkdown(html) } })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="edit_stage_content_md" className="text-xs">Content</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFocusMode(!isFocusMode)}
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Maximize2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="border rounded-md">
                        <div className="simple-editor-wrapper compact">
                          <SimpleEditor
                            initialContent={markdownToHtml(stageForm.content.content_md)}
                            onUpdate={(html) => {
                              setStageForm((prev) => ({
                                ...prev,
                                content: {
                                  ...prev.content,
                                  content_md: htmlToMarkdown(html),
                                },
                              }))
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Add Problem Section */}
            {section === 'add' && (
              <div className="flex-1 p-6 space-y-4 max-w-5xl overflow-y-auto">
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
                  <MarkdownEditor value={problemForm.description_md} onChange={(value) => setProblemForm({ ...problemForm, description_md: value })} />
                </div>
                <div>
                  <Label htmlFor="add_context">Context (Markdown)</Label>
                  <MarkdownEditor value={problemForm.context_md} onChange={(value) => setProblemForm({ ...problemForm, context_md: value })} />
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

        {/* Commented out old dialogs - now using full-page sections */}
        {/*
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
                <MarkdownEditor value={podForm.description_md} onChange={(value) => setPodForm({ ...podForm, description_md: value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPodDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitPod}>{editingPod ? 'Update' : 'Create'} Pod</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  <MarkdownEditor value={stageForm.content.introduction} onChange={(value) => setStageForm({ ...stageForm, content: { ...stageForm.content, introduction: value } })} />
                </div>
                <div>
                  <Label htmlFor="stage_content_md">Content (Markdown)</Label>
                  <MarkdownEditor value={stageForm.content.content_md} onChange={(value) => setStageForm({ ...stageForm, content: { ...stageForm.content, content_md: value } })} />
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
        */}
    </Dialog>
  );
}
