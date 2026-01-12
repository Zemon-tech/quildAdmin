import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import type { MCQQuestion, MCQOption } from '@/types/admin';

interface MCQEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcq: MCQQuestion | null;
  onSave: (mcq: MCQQuestion) => void;
  isEditing: boolean;
}

export function MCQEditModal({ open, onOpenChange, mcq, onSave, isEditing }: MCQEditModalProps) {
  const [formData, setFormData] = useState<MCQQuestion>({
    id: '',
    type: 'direct',
    question: '',
    scenario: '',
    options: [
      { id: 'opt-1', text: '', isCorrect: false, explanation: '' },
      { id: 'opt-2', text: '', isCorrect: false, explanation: '' },
      { id: 'opt-3', text: '', isCorrect: false, explanation: '' },
      { id: 'opt-4', text: '', isCorrect: false, explanation: '' },
    ],
    explanation: '',
    difficulty: 'easy',
  });

  useEffect(() => {
    if (mcq) {
      setFormData(mcq);
    } else {
      // Reset form for new MCQ
      setFormData({
        id: `mcq-${Date.now()}`,
        type: 'direct',
        question: '',
        scenario: '',
        options: [
          { id: 'opt-1', text: '', isCorrect: false, explanation: '' },
          { id: 'opt-2', text: '', isCorrect: false, explanation: '' },
          { id: 'opt-3', text: '', isCorrect: false, explanation: '' },
          { id: 'opt-4', text: '', isCorrect: false, explanation: '' },
        ],
        explanation: '',
        difficulty: 'easy',
      });
    }
  }, [mcq, open]);

  const handleSave = () => {
    // Validation
    if (!formData.question.trim()) {
      alert('Question is required');
      return;
    }

    if (formData.options.some(opt => !opt.text.trim())) {
      alert('All option texts are required');
      return;
    }

    const correctCount = formData.options.filter(opt => opt.isCorrect).length;
    if (correctCount !== 1) {
      alert('Exactly one option must be marked as correct');
      return;
    }

    if (!formData.explanation.trim()) {
      alert('Explanation is required');
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  const updateOption = (index: number, field: keyof MCQOption, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const setCorrectOption = (index: number) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOption: MCQOption = {
      id: `opt-${Date.now()}`,
      text: '',
      isCorrect: false,
      explanation: '',
    };
    setFormData({
      ...formData,
      options: [...formData.options, newOption],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      alert('At least 2 options are required');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const correctOptionIndex = formData.options.findIndex(opt => opt.isCorrect);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit MCQ Question' : 'Add New MCQ Question'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of this multiple choice question.' : 'Create a new multiple choice question for this stage.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mcq-type">Question Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'direct' | 'scenario') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="mcq-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Question</SelectItem>
                    <SelectItem value="scenario">Scenario-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mcq-difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: 'easy' | 'medium' | 'hard') =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger id="mcq-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'scenario' && (
              <div>
                <Label htmlFor="mcq-scenario">Scenario</Label>
                <Textarea
                  id="mcq-scenario"
                  value={formData.scenario || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, scenario: e.target.value })
                  }
                  placeholder="Describe the scenario context for this question..."
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="mcq-question">Question *</Label>
              <Textarea
                id="mcq-question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Answer Options</h3>
                <p className="text-sm text-muted-foreground">
                  Select the correct answer and provide explanations
                </p>
              </div>
              <Button onClick={addOption} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            <RadioGroup
              value={correctOptionIndex.toString()}
              onValueChange={(value: string) => setCorrectOption(parseInt(value))}
            >
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <Card key={option.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            value={index.toString()}
                            id={`option-${index}`}
                          />
                          <Label htmlFor={`option-${index}`} className="font-medium">
                            Option {index + 1}
                            {option.isCorrect && (
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                Correct
                              </Badge>
                            )}
                          </Label>
                        </div>
                        {formData.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label htmlFor={`option-text-${index}`}>Option Text *</Label>
                        <Input
                          id={`option-text-${index}`}
                          value={option.text}
                          onChange={(e) =>
                            updateOption(index, 'text', e.target.value)
                          }
                          placeholder="Enter option text..."
                        />
                      </div>
                      <div>
                        <Label htmlFor={`option-explanation-${index}`}>
                          Option Explanation (Optional)
                        </Label>
                        <Textarea
                          id={`option-explanation-${index}`}
                          value={option.explanation || ''}
                          onChange={(e) =>
                            updateOption(index, 'explanation', e.target.value)
                          }
                          placeholder="Explain why this option is correct/incorrect..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-4">
            <div>
              <Label htmlFor="mcq-explanation">Overall Explanation *</Label>
              <Textarea
                id="mcq-explanation"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Provide a comprehensive explanation of the correct answer and why other options are incorrect..."
                rows={6}
              />
              <p className="text-sm text-muted-foreground mt-2">
                This explanation will be shown to users after they submit their answer.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? 'Update MCQ' : 'Add MCQ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}