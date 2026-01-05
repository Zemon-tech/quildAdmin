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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Edit, Trash2, ListTodo, Clock, Eye, Play, CheckCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { PodStage, StageType, MCQQuestion, PracticeProblem, PaginatedStagesResponse } from '@/types/admin';
import { format } from 'date-fns';

export function Stages() {
  const [stages, setStages] = useState<PodStage[]>([]);
  const [filteredStages, setFilteredStages] = useState<PodStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PodStage | null>(null);
  const [viewingStage, setViewingStage] = useState<PodStage | null>(null);
  const [stageContent, setStageContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    filterStages();
  }, [stages, searchQuery, typeFilter]);

  const loadStages = async () => {
    try {
      setLoading(true);
      const response: PaginatedStagesResponse = await adminApi.Stages.list();
      setStages(response.stages || []);
    } catch (error) {
      console.error('Error loading stages:', error);
      setStages([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStages = () => {
    let filtered = stages;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (stage) =>
          stage.title.toLowerCase().includes(query) ||
          (stage.pod as any)?.title?.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((stage) => stage.type === typeFilter);
    }

    setFilteredStages(filtered);
  };

  const handleCreate = () => {
    setEditingStage(null);
    setFormData({
      pod: '',
      title: '',
      description: '',
      order: 0,
      type: 'introduction',
      estimatedMinutes: 30,
      isRequired: true,
      content: {
        introduction: '',
        learningObjectives: [],
        content_md: '',
        mcqs: [],
        practiceProblems: [],
      },
    });
    setDialogOpen(true);
  };

  const handleEdit = (stage: PodStage) => {
    setEditingStage(stage);
    setFormData({
      pod: stage.pod,
      title: stage.title,
      description: stage.description,
      order: stage.order,
      type: stage.type,
      estimatedMinutes: stage.estimatedMinutes,
      isRequired: stage.isRequired,
      content: stage.content,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (stage: PodStage) => {
    if (!confirm(`Are you sure you want to delete "${stage.title}"?`)) return;

    try {
      await adminApi.Stages.delete(stage._id!);
      await loadStages();
    } catch (error) {
      console.error('Error deleting stage:', error);
    }
  };

  const handleViewStage = async (stage: PodStage) => {
    try {
      setViewingStage(stage);
      setViewDialogOpen(true);
      setContentLoading(true);

      // Get complete stage details with content
      const stageDetails = await adminApi.Stages.get(stage.pod, stage._id!);
      setStageContent(stageDetails);
    } catch (error) {
      console.error('Error loading stage content:', error);
    } finally {
      setContentLoading(false);
    }
  };

  const handleStartStage = async (stage: PodStage) => {
    try {
      await adminApi.Stages.start(stage.pod, stage._id!);
      // Refresh stage data to update progress
      await loadStages();
    } catch (error) {
      console.error('Error starting stage:', error);
    }
  };

  const handleCompleteStage = async (stage: PodStage) => {
    try {
      await adminApi.Stages.complete(stage.pod, stage._id!, { assessmentScore: 100 });
      // Refresh stage data to update progress
      await loadStages();
    } catch (error) {
      console.error('Error completing stage:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingStage) {
        await adminApi.Stages.update(editingStage._id!, formData);
      } else {
        await adminApi.Stages.create(formData);
      }
      await loadStages();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving stage:', error);
    }
  };

  const addMCQ = () => {
    const newMCQ: MCQQuestion = {
      id: `mcq-${Date.now()}`,
      type: 'direct',
      question: '',
      options: [
        { id: 'opt-1', text: '', isCorrect: false },
        { id: 'opt-2', text: '', isCorrect: false },
        { id: 'opt-3', text: '', isCorrect: false },
        { id: 'opt-4', text: '', isCorrect: false },
      ],
      explanation: '',
      difficulty: 'easy',
    };
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        mcqs: [...formData.content.mcqs, newMCQ],
      },
    });
  };

  const removeMCQ = (index: number) => {
    const newMCQs = formData.content.mcqs.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      content: { ...formData.content, mcqs: newMCQs },
    });
  };

  const updateMCQ = (index: number, field: string, value: any) => {
    const newMCQs = [...formData.content.mcqs];
    newMCQs[index] = { ...newMCQs[index], [field]: value };
    setFormData({
      ...formData,
      content: { ...formData.content, mcqs: newMCQs },
    });
  };

  const addPracticeProblem = () => {
    const newProblem: PracticeProblem = {
      id: `pp-${Date.now()}`,
      title: '',
      description: '',
      problemStatement: '',
      hints: [],
      solution: '',
      difficulty: 'easy',
    };
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        practiceProblems: [...formData.content.practiceProblems, newProblem],
      },
    });
  };

  const removePracticeProblem = (index: number) => {
    const newProblems = formData.content.practiceProblems.filter((_: any, i: number) => i !== index);
    setFormData({
      ...formData,
      content: { ...formData.content, practiceProblems: newProblems },
    });
  };

  const updatePracticeProblem = (index: number, field: string, value: any) => {
    const newProblems = [...formData.content.practiceProblems];
    newProblems[index] = { ...newProblems[index], [field]: value };
    setFormData({
      ...formData,
      content: { ...formData.content, practiceProblems: newProblems },
    });
  };

  const getTypeColor = (type: StageType) => {
    const colors: Record<StageType, string> = {
      introduction: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      case_studies: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      resources: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      practice: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assessment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      documentation: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stages</h1>
          <p className="text-muted-foreground">Manage stages within pods with MCQs and practice problems</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Stage
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stage Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stages by title or pod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="introduction">Introduction</SelectItem>
                <SelectItem value="case_studies">Case Studies</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
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
                    <TableHead>Stage</TableHead>
                    <TableHead>Pod</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No stages found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStages.map((stage) => (
                      <TableRow key={stage._id}>
                        <TableCell>
                          <div className="font-medium">{stage.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {(stage.pod as any)?.title || 'Unknown Pod'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(stage.type)}>
                            {stage.type}
                          </Badge>
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
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(stage.updatedAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewStage(stage)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleStartStage(stage)}>
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCompleteStage(stage)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(stage)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(stage)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Edit Stage' : 'Create New Stage'}</DialogTitle>
            <DialogDescription>
              {editingStage ? 'Update the stage details.' : 'Create a new learning stage.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="mcq">MCQs</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 py-4">
              <div>
                <Label htmlFor="pod">Pod ID *</Label>
                <Input
                  id="pod"
                  value={formData.pod}
                  onChange={(e) => setFormData({ ...formData, pod: e.target.value })}
                  placeholder="Pod ID"
                />
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Stage title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Stage description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: StageType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label htmlFor="estimatedMinutes">Duration (min) *</Label>
                  <Input
                    id="estimatedMinutes"
                    type="number"
                    min="1"
                    value={formData.estimatedMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                />
                <Label htmlFor="isRequired">Required stage</Label>
              </div>
            </TabsContent>
            <TabsContent value="content" className="space-y-4 py-4">
              <div>
                <Label htmlFor="introduction">Introduction</Label>
                <Textarea
                  id="introduction"
                  value={formData.content.introduction}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, introduction: e.target.value }
                  })}
                  placeholder="Stage introduction"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content_md">Content (Markdown)</Label>
                <Textarea
                  id="content_md"
                  value={formData.content.content_md}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, content_md: e.target.value }
                  })}
                  placeholder="Stage content in markdown..."
                  rows={8}
                />
              </div>
            </TabsContent>
            <TabsContent value="mcq" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>MCQ Questions</Label>
                <Button size="sm" onClick={addMCQ}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add MCQ
                </Button>
              </div>
              {formData.content.mcqs.map((mcq: any, index: number) => (
                <Card key={mcq.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Question {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeMCQ(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={mcq.question}
                      onChange={(e) => updateMCQ(index, 'question', e.target.value)}
                      placeholder="Question text"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {mcq.options.map((option: any, optIndex: number) => (
                        <div key={option.id} className="flex items-center gap-2">
                          <Switch
                            checked={option.isCorrect}
                            onCheckedChange={(checked) => {
                              const newOptions = mcq.options.map((o: any, i: number) =>
                                i === optIndex ? { ...o, isCorrect: checked } : o
                              );
                              updateMCQ(index, 'options', newOptions);
                            }}
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = mcq.options.map((o: any, i: number) =>
                                i === optIndex ? { ...o, text: e.target.value } : o
                              );
                              updateMCQ(index, 'options', newOptions);
                            }}
                            placeholder={`Option ${optIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    <Textarea
                      value={mcq.explanation}
                      onChange={(e) => updateMCQ(index, 'explanation', e.target.value)}
                      placeholder="Explanation"
                      rows={2}
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="practice" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Practice Problems</Label>
                <Button size="sm" onClick={addPracticeProblem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Problem
                </Button>
              </div>
              {formData.content.practiceProblems.map((problem: any, index: number) => (
                <Card key={problem.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Problem {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removePracticeProblem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={problem.title}
                      onChange={(e) => updatePracticeProblem(index, 'title', e.target.value)}
                      placeholder="Problem title"
                    />
                    <Textarea
                      value={problem.problemStatement}
                      onChange={(e) => updatePracticeProblem(index, 'problemStatement', e.target.value)}
                      placeholder="Problem statement"
                      rows={3}
                    />
                    <Textarea
                      value={problem.solution}
                      onChange={(e) => updatePracticeProblem(index, 'solution', e.target.value)}
                      placeholder="Solution"
                      rows={3}
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingStage ? 'Update' : 'Create'} Stage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stage Content Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingStage?.title} - Complete Content</DialogTitle>
            <DialogDescription>
              Full stage content including all learning materials, MCQs, and practice problems.
            </DialogDescription>
          </DialogHeader>
          
          {contentLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : stageContent && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="mcqs">MCQs</TabsTrigger>
                <TabsTrigger value="practice">Practice</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Stage Type</Label>
                    <Badge className={getTypeColor(viewingStage?.type || 'introduction')}>
                      {viewingStage?.type}
                    </Badge>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <p>{viewingStage?.estimatedMinutes} minutes</p>
                  </div>
                  <div>
                    <Label>Order</Label>
                    <p>{viewingStage?.order}</p>
                  </div>
                  <div>
                    <Label>Required</Label>
                    <Badge variant={viewingStage?.isRequired ? 'default' : 'secondary'}>
                      {viewingStage?.isRequired ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{viewingStage?.description}</p>
                </div>
                
                {stageContent.userProgress && (
                  <div>
                    <Label>Your Progress</Label>
                    <Badge variant={stageContent.userProgress.status === 'completed' ? 'default' : 
                                   stageContent.userProgress.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {stageContent.userProgress.status}
                    </Badge>
                    {stageContent.userProgress.timeSpent > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Time spent: {stageContent.userProgress.timeSpent} minutes
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4 py-4">
                {stageContent.content?.introduction && (
                  <div>
                    <Label>Introduction</Label>
                    <div className="mt-2 p-4 bg-muted rounded-md">
                      <p>{stageContent.content.introduction}</p>
                    </div>
                  </div>
                )}
                
                {stageContent.content?.learningObjectives && stageContent.content.learningObjectives.length > 0 && (
                  <div>
                    <Label>Learning Objectives</Label>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {stageContent.content.learningObjectives.map((objective: string, index: number) => (
                        <li key={index} className="text-sm">{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {stageContent.content?.content_md && (
                  <div>
                    <Label>Content (Markdown)</Label>
                    <div className="mt-2 p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{stageContent.content.content_md}</pre>
                    </div>
                  </div>
                )}
                
                {stageContent.externalContent && (
                  <div>
                    <Label>External Content</Label>
                    <div className="mt-2 p-4 bg-muted rounded-md max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{stageContent.externalContent}</pre>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="mcqs" className="space-y-4 py-4">
                {stageContent.content?.mcqs && stageContent.content.mcqs.length > 0 ? (
                  stageContent.content.mcqs.map((mcq: MCQQuestion, index: number) => (
                    <Card key={mcq.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <Badge variant={mcq.difficulty === 'easy' ? 'secondary' : 
                                       mcq.difficulty === 'medium' ? 'default' : 'destructive'}>
                          {mcq.difficulty}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p>{mcq.question}</p>
                        {mcq.scenario && (
                          <div className="p-3 bg-muted rounded-md">
                            <p className="text-sm italic">{mcq.scenario}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {mcq.options.map((option) => (
                            <div key={option.id} className={`p-2 border rounded-md ${option.isCorrect ? 'bg-green-50 border-green-200' : ''}`}>
                              <p className="text-sm">{option.text}</p>
                              {option.isCorrect && <Badge className="mt-1">Correct</Badge>}
                            </div>
                          ))}
                        </div>
                        {mcq.explanation && (
                          <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm"><strong>Explanation:</strong> {mcq.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No MCQ questions available for this stage.</p>
                )}
              </TabsContent>
              
              <TabsContent value="practice" className="space-y-4 py-4">
                {stageContent.content?.practiceProblems && stageContent.content.practiceProblems.length > 0 ? (
                  stageContent.content.practiceProblems.map((problem: PracticeProblem, index: number) => (
                    <Card key={problem.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">Problem {index + 1}</CardTitle>
                        <Badge variant={problem.difficulty === 'easy' ? 'secondary' : 
                                       problem.difficulty === 'medium' ? 'default' : 'destructive'}>
                          {problem.difficulty}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <p>{problem.title}</p>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <p className="text-sm text-muted-foreground">{problem.description}</p>
                        </div>
                        <div>
                          <Label>Problem Statement</Label>
                          <div className="p-3 bg-muted rounded-md">
                            <p>{problem.problemStatement}</p>
                          </div>
                        </div>
                        {problem.hints && problem.hints.length > 0 && (
                          <div>
                            <Label>Hints</Label>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                              {problem.hints.map((hint, hintIndex) => (
                                <li key={hintIndex} className="text-sm text-muted-foreground">{hint}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {problem.solution && (
                          <div>
                            <Label>Solution</Label>
                            <div className="mt-1 p-3 bg-green-50 rounded-md">
                              <p className="text-sm">{problem.solution}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No practice problems available for this stage.</p>
                )}
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4 py-4">
                {stageContent.content?.resources && stageContent.content.resources.length > 0 ? (
                  stageContent.content.resources.map((resource: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{resource.title}</h4>
                            <Badge variant="outline">{resource.type}</Badge>
                          </div>
                          {resource.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mt-2">{resource.description}</p>
                        )}
                        {resource.content && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm">{resource.content}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No resources available for this stage.</p>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
